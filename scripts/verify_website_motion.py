import os
import subprocess
import time

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'

target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

tests = [
    {
        'name': 'jewelux_motion_home.png',
        'url': 'http://localhost:3000/#home',
        'w': 1440,
        'h': 1200
    },
    {
        'name': 'jewelux_motion_earrings_grid.png',
        'url': 'http://localhost:3000/#collections/earrings',
        'w': 1440,
        'h': 1100
    },
    {
        'name': 'jewelux_motion_craftsmanship.png',
        'url': 'http://localhost:3000/#craftsmanship',
        'w': 1440,
        'h': 1100
    },
    {
        'name': 'jewelux_motion_pdp.png',
        'url': 'http://localhost:3000/#products/the-lumina-teardrop-solitaire-earrings-hj-ear-001',
        'w': 1440,
        'h': 1100
    },
    {
        'name': 'jewelux_motion_mobile.png',
        'url': 'http://localhost:3000/#home',
        'w': 375,
        'h': 812
    }
]

for t in tests:
    p = os.path.join(target_dir, t['name'])
    if os.path.exists(p):
        try:
            os.remove(p)
        except Exception:
            pass

    args = [
        chrome_path,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--disable-features=LensOverlay,LensStandalone,LensRegionSearch',
        f'--window-size={t["w"]},{t["h"]}',
        f'--screenshot={p}',
        t['url']
    ]
    subprocess.run(args, check=True)
    print(f"Captured {t['name']} ({t['w']}x{t['h']})")

print("Website-wide motion verification completed successfully!")
