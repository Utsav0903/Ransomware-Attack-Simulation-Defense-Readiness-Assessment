import os

def format_size(size):
    if size < 1024: return f'{size} B'
    elif size < 1024*1024: return f'{round(size/1024,2)} KB'
    else: return f'{round(size/(1024*1024),2)} MB'

def get_extension(filename):
    parts = filename.split('.')
    return '.' + parts[-1] if len(parts) > 1 else 'N/A'

def is_encrypted(path):
    try:
        with open(path, 'rb') as f:
            return f.read(18).startswith(b'RADSAS_ENCRYPTED::')
    except Exception:
        return False

def list_files(directory):
    results = []
    if not os.path.exists(directory):
        return results
    for file in os.listdir(directory):
        path = os.path.join(directory, file)
        if not os.path.isfile(path):
            continue
        try:
            size = os.path.getsize(path)
            results.append({'name': file, 'ext': get_extension(file),
                'size': format_size(size), 'status': 'ENCRYPTED' if is_encrypted(path) else 'SAFE'})
        except Exception:
            pass
    return results
