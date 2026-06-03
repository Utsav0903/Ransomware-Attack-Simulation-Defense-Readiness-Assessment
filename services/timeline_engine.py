import json
import os
from datetime import datetime
from config import TIMELINE

def load_timeline():
    if not os.path.exists(TIMELINE):
        with open(TIMELINE, 'w', encoding='utf-8') as f:
            json.dump([], f)
    try:
        with open(TIMELINE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def add_timeline_event(event):
    timeline = load_timeline()
    timeline.append({'time': datetime.now().strftime('%H:%M:%S'), 'event': event})
    with open(TIMELINE, 'w', encoding='utf-8') as f:
        json.dump(timeline[-50:], f, indent=4)
