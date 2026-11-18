import os
import subprocess
import time

screenshot_path = r"C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots\jewelux_falcon_pdp_desktop.png"
if os.path.exists(screenshot_path):
    os.remove(screenshot_path)

chrome_cmd = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "--headless=new",
    "--disable-gpu",
    "--disable-features=LensOverlay,LensStandalone,LensRegionSearch",
    "--window-size=1440,1100",
    "--virtual-time-budget=4000",
    f"--screenshot={screenshot_path}",
    "http://localhost:3000/products/the-sovereign-crest-royal-falcon-brooch-hj-bro-001"
]
subprocess.run(chrome_cmd, check=True)
print("Screenshot created:", os.path.exists(screenshot_path), "size:", os.path.getsize(screenshot_path) if os.path.exists(screenshot_path) else 0)
