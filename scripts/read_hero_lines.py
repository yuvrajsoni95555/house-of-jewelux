with open('hero-cinematic.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(220, 255):
    print(f"{i+1}: {lines[i]}", end='')
