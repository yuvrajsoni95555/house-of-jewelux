import os
import subprocess
import time

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'

target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

views = [
    {
        'name': 'jewelux_jaipur_home_desktop.png',
        'url': 'http://localhost:3000/#home',
        'width': 1440,
        'height': 1200
    },
    {
        'name': 'jewelux_jaipur_whats_new.png',
        'url': 'http://localhost:3000/#collections/new-arrivals',
        'width': 1440,
        'height': 1050
    },
    {
        'name': 'jewelux_jaipur_mobile.png',
        'url': 'http://localhost:3000/#home',
        'width': 375,
        'height': 812
    }
]

for v in views:
    p = os.path.join(target_dir, v['name'])
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
        f'--window-size={v["width"]},{v["height"]}',
        f'--screenshot={p}',
        v['url']
    ]
    subprocess.run(args, check=True)
    print(f"Captured {v['name']} at {v['width']}x{v['height']}")

print("All Jaipur Jewels integration screenshots captured successfully!")
