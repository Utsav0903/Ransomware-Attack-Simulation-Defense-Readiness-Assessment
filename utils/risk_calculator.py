def calculate_risk_score(encrypted, recovered, safe):
    total = encrypted + recovered + safe
    if total == 0: return 0
    score = (encrypted/total)*120 - (recovered/total)*40 - (safe/total)*20
    return round(max(0, min(100, score)))
