import json
from datetime import datetime
from config import FORENSIC_REPORT
from services.persistence import load_dashboard_state
from utils.audit_logger import load_logs

def generate_report():
    state = load_dashboard_state()
    logs = load_logs()
    report = {'generated_at': str(datetime.now()), 'system_status': state['status'],
        'encrypted_files': state['encrypted'], 'recovered_files': state['recovered'],
        'safe_files': state['safe'], 'threat_score': state['threat'], 'logs': logs[-20:]}
    with open(FORENSIC_REPORT, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4)
    return report
