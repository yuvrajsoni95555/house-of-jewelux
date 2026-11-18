with open('hero-cinematic.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- LINES 145-172 ---")
for i in range(144, 172):
    print(f"{i+1}: {lines[i]}", end='')

print("\n--- LINES 500-530 ---")
for i in range(499, min(532, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
