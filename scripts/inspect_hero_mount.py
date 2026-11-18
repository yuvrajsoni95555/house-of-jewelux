with open('hero-cinematic.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'hero-slider' in line or 'getElementById' in line or 'querySelector' in line:
            print(f"{i+1}: {line.strip()[:100]}")
