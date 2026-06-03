from flask import Flask, render_template, jsonify, request
from werkzeug.utils import secure_filename
import os, threading, json
from config import VICTIM_DIR, TIMELINE
from services.encryptor import start_encryption, encrypt_file
from services.decryptor import start_decryption, decrypt_file
from services.persistence import load_dashboard_state, save_dashboard_state, reset_dashboard_state
from services.timeline_engine import add_timeline_event
from services.forensic_engine import generate_report as forensic_generate_report
from utils.audit_logger import load_logs, add_log, reset_logs_file
from utils.file_utils import is_encrypted
from flask import jsonify
from datetime import datetime

app = Flask(__name__)

# ─── Helpers ──────────────────────────────────────────────────

def reset_timeline_file():
    try:
        with open(TIMELINE, 'w', encoding='utf-8') as f:
            json.dump([], f)
    except Exception:
        pass


def _fmt(size):
    if size < 1024:      return f'{size} B'
    elif size < 1048576: return f'{size/1024:.1f} KB'
    else:                return f'{size/1048576:.1f} MB'


def real_file_data():
    """
    ALWAYS reads file states directly from disk.
    Never trusts JSON state for enc/safe counts.
    Returns (enc_count, safe_count, file_list).
    """
    enc = safe = 0
    files = []
    try:
        for fname in sorted(os.listdir(VICTIM_DIR)):
            path = os.path.normpath(os.path.join(VICTIM_DIR, fname))
            if not os.path.isfile(path):
                continue
            encrypted = is_encrypted(path)
            enc  += 1 if encrypted else 0
            safe += 0 if encrypted else 1
            ext   = ('.' + fname.rsplit('.', 1)[-1]) if '.' in fname else 'N/A'
            files.append({
                'name':      fname,
                'ext':       ext,
                'size':      _fmt(os.path.getsize(path)),
                'status':    'ENCRYPTED' if encrypted else 'SAFE',
                'encrypted': encrypted,
            })
    except Exception as e:
        add_log('ERROR', f'File scan failed: {e}')
    return enc, safe, files


def any_encrypted():
    enc, _, _ = real_file_data()
    return enc > 0


# ─── Pages ────────────────────────────────────────────────────

@app.route('/')
def dashboard():

    return render_template('index.html')


@app.route('/manual')
def manual_page():
    return render_template('manual_encryption.html')


@app.route('/about')
def about_page():
    return render_template('about.html')


@app.route('/payment')
def payment_page():

    add_log(
        'WARNING',
        'Ransom payment portal accessed.'
    )

    add_timeline_event(
        'Payment portal opened'
    )

    return render_template(
        'payment.html'
    )

@app.route('/payment-success', methods=['POST'])
def payment_success():

    try:

        state = load_dashboard_state()

        if not any_encrypted():

            return jsonify({
                'success': False,
                'message': 'No encrypted files found.'
            })

        add_log(
            'SUCCESS',
            'Ransom payment confirmed.'
        )

        add_log(
            'INFO',
            'Recovery authorization granted.'
        )

        add_timeline_event(
            'Payment verified'
        )

        # ONLY AUTHORIZE RECOVERY
        state['payment_completed'] = True

        save_dashboard_state(state)

        return jsonify({
            'success': True,
            'message': 'Payment successful.'
        })

    except Exception as e:

        return jsonify({
            'success': False,
            'message': str(e)
        })


# ─── Status API ───────────────────────────────────────────────

@app.route('/status')
def status():
    state    = load_dashboard_state()
    logs     = load_logs()
    timeline = []
    try:
        with open(TIMELINE, 'r', encoding='utf-8') as f:
            timeline = json.load(f)
    except Exception:
        pass

    # REAL counts from filesystem — never from stale JSON
    enc_real, safe_real, files = real_file_data()

    # Derive correct status from actual file state
    js_status = state.get('status', 'SAFE')
    if enc_real > 0 and js_status in ('SAFE', 'IDLE'):
        js_status = 'COMPROMISED'
    elif enc_real == 0 and js_status == 'COMPROMISED':
        js_status = 'SAFE'

    total  = max(1, enc_real + safe_real + state.get('recovered', 0))
    threat = min(100, round(enc_real / total * 120))

    return jsonify({
    'status':           js_status,
    'phase':            state.get('phase', 'IDLE'),
    'encrypted':        enc_real,
    'recovered':        state.get('recovered', 0),
    'safe':             safe_real,
    'threat':           threat,
    'attack_running':   state.get('attack_running', False),
    'encryption_speed': state.get('encryption_speed', 0),
    'logs':             logs,
    'timeline':         timeline,
    'files':            files,
})



# ─── Attack ───────────────────────────────────────────────────

def run_attack_with_phases():
    """Background thread: phase progression then encrypt."""
    import time
    phases = [
        ('RECON',      2.0, 'Reconnaissance active — scanning target'),
        ('INFILTRATE', 2.0, 'Infiltration in progress — injecting payload'),
        ('LATERAL',    1.5, 'Lateral movement — traversing file system'),
    ]
    for phase, delay, msg in phases:
        s = load_dashboard_state()
        s['phase'] = phase
        save_dashboard_state(s)
        add_log('WARNING', msg)
        add_timeline_event(f'{phase} phase initiated')
        time.sleep(delay)

    s = load_dashboard_state()
    s['phase']            = 'ENCRYPT'
    s['encryption_speed'] = 0
    save_dashboard_state(s)
    add_log('CRITICAL', 'Encryption engine activated')
    add_timeline_event('File encryption started')
    start_encryption()


@app.route('/attack')
def attack():

    state = load_dashboard_state()

    if state.get('attack_running'):

        return jsonify({
            'message': 'Attack already running.'
        })

    state.update({

    'attack_running': True,
    'status': 'ENCRYPTING',
    'phase': 'RECON',
    'threat': 95,
    'encryption_speed': 0,
    'recovered': 0,
    'payment_completed': False,

})

    save_dashboard_state(state)

    add_log(
        'CRITICAL',
        'Ransomware attack sequence initiated.'
    )

    add_log(
        'WARNING',
        'Filesystem scan initialized.'
    )

    add_log(
        'WARNING',
        'Payload injection active.'
    )

    add_log(
        'CRITICAL',
        'Encryption engine armed.'
    )

    add_timeline_event(
        'Attack sequence started'
    )

    threading.Thread(
        target=run_attack_with_phases,
        daemon=True
    ).start()

    return jsonify({
        'message': 'Attack launched.'
    })


@app.route('/manual-encrypt', methods=['POST'])
def manual_encrypt():

    try:

        data = request.json

        filenames = data.get('files', [])

        encrypted = 0

        for filename in filenames:

            path = os.path.join(
                VICTIM_DIR,
                filename
            )

            if not os.path.exists(path):
                continue

            if encrypt_file(path):

                encrypted += 1

                add_log(
                    'CRITICAL',
                    f'Encrypted: {filename}'
                )

        return jsonify({

            'success': encrypted > 0,
            'count': encrypted

        })

    except Exception as e:

        print(e)

        return jsonify({

            'success': False,
            'message': str(e)

        })

@app.route('/manual-decrypt', methods=['POST'])
def manual_decrypt():

    try:

        data = request.json

        filenames = data.get('files', [])

        recovered = 0

        for filename in filenames:

            path = os.path.join(
                VICTIM_DIR,
                filename
            )

            if not os.path.exists(path):
                continue

            if decrypt_file(path):

                recovered += 1

                add_log(
                    'SUCCESS',
                    f'Recovered: {filename}'
                )

        return jsonify({

            'success': recovered > 0,
            'count': recovered

        })

    except Exception as e:

        print(e)

        return jsonify({

            'success': False,
            'message': str(e)

        })

# ─── Recovery ─────────────────────────────────────────────────

@app.route('/decrypt')
def decrypt():

    state = load_dashboard_state()

    # PAYMENT REQUIRED
    if not state.get('payment_completed'):

        return jsonify({
            'message': 'Payment required before recovery.'
        }), 403

    # UPDATE DASHBOARD STATE
    state['status'] = 'RECOVERING'

    save_dashboard_state(state)

    # LOGS
    add_log(
        'INFO',
        'Recovery engine initialized.'
    )

    add_log(
        'SUCCESS',
        'Decryption process started.'
    )

    add_log(
        'INFO',
        'Attempting victim file restoration.'
    )

    add_timeline_event(
        'Recovery sequence started'
    )

    # START REAL RECOVERY
    threading.Thread(
        target=start_decryption,
        daemon=True
    ).start()

    return jsonify({
        'message': 'Recovery started.'
    })

# ─── Victim files API (manual page) ──────────────────────────

@app.route('/api/victim-files')
def api_victim_files():
    _, _, files = real_file_data()
    return jsonify(files)


# ─── Report ───────────────────────────────────────────────────
@app.route('/report')
def report_page():

    return render_template('report.html')

@app.route('/generate-report')
def generate_report():

    state = load_dashboard_state()

    encrypted, safe, files = real_file_data()

    recovered = state.get(
        'recovered',
        0
    )

    total = max(
        1,
        encrypted + safe + recovered
    )

    threat = min(
        100,
        round((encrypted / total) * 120)
    )

    status = state.get(
        'status',
        'SAFE'
    )

    logs = load_logs()

    return jsonify({

        'generated_at':
        datetime.now().strftime(
            '%d %b %Y | %H:%M:%S'
        ),

        'encrypted_files':
        encrypted,

        'recovered_files':
        recovered,

        'safe_files':
        safe,

        'threat_score':
        threat,

        'status':
        status,

        'logs':
        logs

    })


# ─── Entry ────────────────────────────────────────────────────

if __name__ == '__main__':
    reset_logs_file()
    reset_timeline_file()
    reset_dashboard_state()
    add_log('INFO', 'RADSAS System initialized.')
    add_log('INFO', 'All subsystems online. Awaiting operator command.')
    app.run(
        debug=True,
        port=5000,
        use_reloader=False
    )
