with open('app.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'HJ_MOTION' in line:
            print(f"{i+1}: {line.strip()[:100]}")
