import os

print("=== AUDITING SCROLL PERFORMANCE & ROOT CAUSES ===")

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"index.html total lines: {len(lines)}")
for i, line in enumerate(lines):
    s = line.strip()
    if any(k in s for k in ['<header', '<section', '<main', '<footer', 'id="app-view"', 'class="site-header"']):
        print(f"Line {i+1}: {s[:110]}")

print("\n--- SCRIPT TAGS IN INDEX.HTML ---")
for i, line in enumerate(lines):
    s = line.strip()
    if '<script' in s:
        print(f"Line {i+1}: {s}")

