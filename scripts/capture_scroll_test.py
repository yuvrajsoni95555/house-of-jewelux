import os
import subprocess
import time

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

tests = [
    {
        'file': 'scroll_01_hero_desktop.png',
        'url': 'http://localhost:3000/?scrollY=0#home',
        'w': 1440,
        'h': 900
    },
    {
        'file': 'scroll_02_whats_new.png',
        'url': 'http://localhost:3000/?scrollY=800#home',
        'w': 1440,
        'h': 900
    },
    {
        'file': 'scroll_03_categories.png',
        'url': 'http://localhost:3000/?scrollY=1550#home',
        'w': 1440,
        'h': 900
    },
    {
        'file': 'scroll_04_craftsmanship.png',
        'url': 'http://localhost:3000/?scrollY=2400#home',
        'w': 1440,
        'h': 900
    },
    {
        'file': 'scroll_05_footer.png',
        'url': 'http://localhost:3000/?scrollY=3300#home',
        'w': 1440,
        'h': 900
    },
    {
        'file': 'scroll_06_mobile_hero.png',
        'url': 'http://localhost:3000/?scrollY=0#home',
        'w': 390,
        'h': 844
    },
    {
        'file': 'scroll_07_mobile_categories.png',
        'url': 'http://localhost:3000/?scrollY=700#home',
        'w': 390,
        'h': 844
    }
]

for t in tests:
    out_path = os.path.join(target_dir, t['file'])
    args = [
        chrome_path,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        f'--window-size={t["w"]},{t["h"]}',
        '--virtual-time-budget=3500',
        f'--screenshot={out_path}',
        t['url']
    ]
    subprocess.run(args, check=True)
    size = os.path.getsize(out_path)
    print(f"Captured {t['file']} ({size} bytes)")

print("All scroll verification captures completed successfully!")
