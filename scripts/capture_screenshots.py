import subprocess
import os
import time

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CAPTURES = [
    {
        "name": "jewelux_falcon_pdp_desktop.png",
        "url": "http://localhost:3000/#products/the-sovereign-crest-royal-falcon-brooch-hj-bro-001",
        "width": 1440,
        "height": 900
    },
    {
        "name": "jewelux_home_desktop_1440.png",
        "url": "http://localhost:3000/#home",
        "width": 1440,
        "height": 900
    },
    {
        "name": "jewelux_home_tablet_768.png",
        "url": "http://localhost:3000/#home",
        "width": 768,
        "height": 1024
    },
    {
        "name": "jewelux_home_mobile_375.png",
        "url": "http://localhost:3000/#home",
        "width": 375,
        "height": 812
    },
    {
        "name": "jewelux_earrings_desktop_1440.png",
        "url": "http://localhost:3000/#collections/earrings",
        "width": 1440,
        "height": 900
    },
    {
        "name": "jewelux_earrings_mobile_375.png",
        "url": "http://localhost:3000/#collections/earrings",
        "width": 375,
        "height": 812
    },
    {
        "name": "jewelux_pdp_desktop_1440.png",
        "url": "http://localhost:3000/#products/the-celestial-radiance-925-solitaire-ring-hj-rng-001",
        "width": 1440,
        "height": 900
    },
    {
        "name": "jewelux_pdp_mobile_375.png",
        "url": "http://localhost:3000/#products/the-celestial-radiance-925-solitaire-ring-hj-rng-001",
        "width": 375,
        "height": 812
    },
    {
        "name": "jewelux_about_desktop_1440.png",
        "url": "http://localhost:3000/#about",
        "width": 1440,
        "height": 900
    }
]

def run():
    print(f"Starting screenshot capture to {OUTPUT_DIR}...")
    for cap in CAPTURES:
        out_path = os.path.join(OUTPUT_DIR, cap["name"])
        cmd = [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            f"--window-size={cap['width']},{cap['height']}",
            "--virtual-time-budget=6000",
            f"--screenshot={out_path}",
            cap["url"]
        ]
        print(f"Capturing {cap['name']} ({cap['width']}x{cap['height']}) -> {cap['url']}...")
        res = subprocess.run(cmd, capture_output=True)
        if os.path.exists(out_path):
            size_kb = os.path.getsize(out_path) / 1024
            print(f"  ✓ Saved {cap['name']} ({size_kb:.1f} KB)")
        else:
            print(f"  ✗ Failed to save {cap['name']}: {res.stderr.decode('utf-8', errors='ignore')}")

if __name__ == '__main__':
    run()
