with open('app.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'collections/' in line or 'renderCollection' in line or 'renderCatalogue' in line or 'category' in line.lower() and 'function' in line:
            print(f"{i+1}: {line.strip()[:100]}")
