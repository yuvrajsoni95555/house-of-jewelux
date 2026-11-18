with open('index.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'mobile-menu' in line or 'mobile-nav' in line or 'mobile-drawer' in line:
            print(f"{i+1}: {line.strip()[:100]}")
