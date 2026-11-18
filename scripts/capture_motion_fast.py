import os
import subprocess

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'

target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

views = [
    ('jewelux_motion_home.png', 'http://localhost:3000/#home', 1440, 1100),
    ('jewelux_motion_earrings.png', 'http://localhost:3000/#collections/earrings', 1440, 1100),
    ('jewelux_motion_craftsmanship.png', 'http://localhost:3000/#craftsmanship', 1440, 1100),
    ('jewelux_motion_mobile.png', 'http://localhost:3000/#home', 375, 812)
]

for name, url, w, h in views:
    p = os.path.join(target_dir, name)
    if os.path.exists(p):
        try: os.remove(p)
        except Exception: pass

    args = [
        chrome_path,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--virtual-time-budget=2500',
        '--disable-features=LensOverlay,LensStandalone,LensRegionSearch',
        f'--window-size={w},{h}',
        f'--screenshot={p}',
        url
    ]
    subprocess.run(args, timeout=12)
    print(f"Captured {name} successfully!")

print("All views captured with motion engine active!")
