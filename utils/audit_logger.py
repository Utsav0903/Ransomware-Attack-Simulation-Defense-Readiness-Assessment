import json
import os
from datetime import datetime
from config import LIVE_LOGS

def reset_logs_file():
    with open(LIVE_LOGS, 'w', encoding='utf-8') as f:
        json.dump([], f)

if not os.path.exists(LIVE_LOGS):
    reset_logs_file()

def load_logs():
    try:
        with open(LIVE_LOGS, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_logs(logs):
    with open(LIVE_LOGS, 'w', encoding='utf-8') as f:
        json.dump(logs, f, indent=2)

def add_log(level, message):
    logs = load_logs()
    entry = {'time': datetime.now().strftime('%H:%M:%S'), 'level': level.upper(), 'message': message}
    logs.append(entry)
    logs = logs[-150:]
    save_logs(logs)
    return entry

def clear_logs():
    save_logs([])
