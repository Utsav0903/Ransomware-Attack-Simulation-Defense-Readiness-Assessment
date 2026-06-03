import json
import os
from config import DASHBOARD_STATE

DEFAULT_STATE = {'status':'SAFE','phase':'IDLE','encrypted':0,'recovered':0,
    'safe':12,'threat':0,'attack_running':False,'encryption_speed':0}

def reset_dashboard_state():
    with open(DASHBOARD_STATE, 'w', encoding='utf-8') as f:
        json.dump(DEFAULT_STATE, f, indent=4)

def load_dashboard_state():
    if not os.path.exists(DASHBOARD_STATE):
        reset_dashboard_state()
    try:
        with open(DASHBOARD_STATE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        reset_dashboard_state()
        return dict(DEFAULT_STATE)

def save_dashboard_state(state):
    with open(DASHBOARD_STATE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=4)
