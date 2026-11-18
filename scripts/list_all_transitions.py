with open('style.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'transition' in line:
        selector = ''
        for j in range(i-1, max(0, i-8), -1):
            if '{' in lines[j]:
                selector = lines[j].split('{')[0].strip()
                break
        print(f"Line {i+1} | {selector} | {line.strip()[:60]}")
