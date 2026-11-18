import os
import subprocess

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

views = [
    {'name': 'houseofjewelux_live_domain_home.png', 'url': 'https://houseofjewelux.com', 'w': 1440, 'h': 900},
    {'name': 'houseofjewelux_live_domain_earrings.png', 'url': 'https://houseofjewelux.com/#earrings', 'w': 1440, 'h': 900},
    {'name': 'houseofjewelux_live_domain_mobile.png', 'url': 'https://houseofjewelux.com', 'w': 390, 'h': 844}
]

for v in views:
    p = os.path.join(target_dir, v['name'])
    w = v['w']
    h = v['h']
    args = [
        chrome_path,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--virtual-time-budget=4000',
        f'--window-size={w},{h}',
        f'--screenshot={p}',
        v['url']
    ]
    subprocess.run(args, check=True)
    size = os.path.getsize(p)
    print(f"Captured {v['name']} ({size} bytes)")

print("All screenshots captured successfully from live custom domain!")
