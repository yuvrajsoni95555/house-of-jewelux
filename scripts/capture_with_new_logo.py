import os
import subprocess
import time

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'

target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

screenshot_path = os.path.join(target_dir, 'jewelux_live_with_official_logo.png')
if os.path.exists(screenshot_path):
    try:
        os.remove(screenshot_path)
    except Exception:
        pass

args = [
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-features=LensOverlay,LensStandalone,LensRegionSearch',
    '--window-size=1440,1050',
    f'--screenshot={screenshot_path}',
    'http://localhost:3000/#home'
]

subprocess.run(args, check=True)
print("Captured live screenshot with new official logo:", screenshot_path)
