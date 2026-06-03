import os
import time

from cryptography.fernet import (
    Fernet,
    InvalidToken
)

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
# CHECK IF FILE IS ENCRYPTED
# =========================================================

def is_encrypted(data):

    return data.startswith(MARKER)


# =========================================================
# DECRYPT SINGLE FILE
# =========================================================

def decrypt_file(path):

    try:

        cipher = Fernet(load_key())

        with open(path, 'rb') as f:
            data = f.read()

        # -------------------------------------------------
        # VALIDATE ENCRYPTED FILE
        # -------------------------------------------------

        if not is_encrypted(data):

            add_log(
                'WARNING',
                f'Skipped non-encrypted file: {os.path.basename(path)}'
            )

            return False

        # -------------------------------------------------
        # REMOVE CUSTOM MARKER
        # -------------------------------------------------

        encrypted_payload = data[len(MARKER):]

        # -------------------------------------------------
        # DECRYPT DATA
        # -------------------------------------------------

        decrypted_data = cipher.decrypt(encrypted_payload)

        # -------------------------------------------------
        # WRITE DECRYPTED CONTENT
        # -------------------------------------------------

        with open(path, 'wb') as f:
            f.write(decrypted_data)

        # -------------------------------------------------
        # LOGGING
        # -------------------------------------------------

        add_log(
            'SUCCESS',
            f'Recovered: {os.path.basename(path)}'
        )

        add_timeline_event(
            f'{os.path.basename(path)} recovered'
        )

        return True

    # =====================================================
    # INVALID TOKEN
    # =====================================================

    except InvalidToken:

        add_log(
            'ERROR',
            f'Invalid encryption token: {os.path.basename(path)}'
        )

        return False

    # =====================================================
    # KEY FILE MISSING
    # =====================================================

    except FileNotFoundError:

        add_log(
            'ERROR',
            f'Key file not found. Cannot decrypt {os.path.basename(path)}'
        )

        return False

    # =====================================================
    # GENERAL ERROR
    # =====================================================

    except Exception as e:

        add_log(
            'ERROR',
            f'Recovery failed ({os.path.basename(path)}): {str(e)}'
        )

        return False


# =========================================================
# START FULL DECRYPTION
# =========================================================

def start_decryption():

    # -----------------------------------------------------
    # SET DASHBOARD STATUS
    # -----------------------------------------------------

    state = load_dashboard_state()

    state['status'] = 'RECOVERING'

    save_dashboard_state(state)

    add_log(
        'INFO',
        'Decryption engine started. Restoring files...'
    )

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
        # DECRYPT FILE
        # -------------------------------------------------

        if decrypt_file(path):

            count += 1

            # ---------------------------------------------
            # LIVE RECOVERY SPEED
            # ---------------------------------------------

            speed = max(0, 90 - count * 7)

            state = load_dashboard_state()


            state['encryption_speed'] = speed

            save_dashboard_state(state)

        time.sleep(0.3)

    # =====================================================
    # FINAL DASHBOARD STATE
    # =====================================================

    state = load_dashboard_state()

    state['status'] = 'SAFE'

    state['phase'] = 'IDLE'

    state['threat'] = 0

    state['attack_running'] = False

    state['encryption_speed'] = 0


    save_dashboard_state(state)

    # =====================================================
    # FINAL LOGS
    # =====================================================

    add_log(
        'SUCCESS',
        f'{count}/{total} files successfully restored.'
    )

    add_log(
        'INFO',
        'System status: SAFE. All subsystems nominal.'
    )

    # =====================================================
    # TIMELINE EVENT
    # =====================================================

    add_timeline_event(
        'Recovery complete. System status: SAFE.'
    )
