import time
from utils.audit_logger import add_log
from services.timeline_engine import add_timeline_event
from services.persistence import load_dashboard_state, save_dashboard_state

PHASES = ['RECON','INFILTRATE','LATERAL','ENCRYPT','COMPLETE']

def run_behavior_engine():
    state = load_dashboard_state()
    for phase in PHASES:
        state['phase'] = phase
        save_dashboard_state(state)
        add_log('INFO', f'Phase: {phase}')
        add_timeline_event(f'{phase} phase initiated')
        time.sleep(2)
    add_log('SUCCESS', 'Attack lifecycle completed.')
