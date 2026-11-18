import os, subprocess

out_dir = r"C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots"

targets = [
    ("jewelux_home_desktop_1440.png", "http://localhost:3000", 1440, 1100),
    ("jewelux_earrings_desktop_1440.png", "http://localhost:3000/collections/earrings", 1440, 1100),
    ("jewelux_home_mobile_375.png", "http://localhost:3000", 375, 812),
]

for filename, url, width, height in targets:
    p = os.path.join(out_dir, filename)
    if os.path.exists(p):
        os.remove(p)
    chrome_cmd = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--disable-gpu",
        "--disable-features=LensOverlay,LensStandalone,LensRegionSearch",
        f"--window-size={width},{height}",
        "--virtual-time-budget=4000",
        f"--screenshot={p}",
        url
    ]
    subprocess.run(chrome_cmd, check=True)
    print(f"Captured {filename}: {os.path.getsize(p)} bytes")
