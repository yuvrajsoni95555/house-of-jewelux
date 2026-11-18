import os
import subprocess

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'

target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

scenes = [
    {'name': 'jewelux_cinematic_scene_01.png', 'url': 'http://localhost:3000/?scene=1#home', 'w': 1440, 'h': 950},
    {'name': 'jewelux_cinematic_scene_02.png', 'url': 'http://localhost:3000/?scene=2#home', 'w': 1440, 'h': 950},
    {'name': 'jewelux_cinematic_scene_03.png', 'url': 'http://localhost:3000/?scene=3#home', 'w': 1440, 'h': 950},
    {'name': 'jewelux_cinematic_scene_04.png', 'url': 'http://localhost:3000/?scene=4#home', 'w': 1440, 'h': 950},
    {'name': 'jewelux_cinematic_mobile.png',   'url': 'http://localhost:3000/?scene=4#home', 'w': 375,  'h': 812}
]

for s in scenes:
    p = os.path.join(target_dir, s['name'])
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
        f'--window-size={s["w"]},{s["h"]}',
        f'--screenshot={p}',
        s['url']
    ]
    subprocess.run(args, check=True)
    print(f"Captured {s['name']} successfully ({s['w']}x{s['h']})")

print("All cinematic hero scenes captured successfully!")
