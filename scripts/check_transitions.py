with open('style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

targets = ['.product-card', '.cat-showcase', '.site-header', '.section-title', 'img', '.craft']
for i, line in enumerate(lines):
    if 'transition' in line:
        for t in targets:
            # check previous 5 lines for selector
            context = ''.join(lines[max(0, i-6):i+1])
            if t in context:
                print(f"Line {i+1} near {t}: {line.strip()[:80]}")
