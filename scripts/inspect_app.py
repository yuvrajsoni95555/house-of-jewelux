with open('app.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'home' in line.lower() and ('function' in line or 'case' in line or 'render' in line):
            print(f"{i+1}: {line.strip()[:100]}")
