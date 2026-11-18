import os
import subprocess
import time

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'

target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

# 1. Capture initial opening (Scene 01)
p1 = os.path.join(target_dir, 'jewelux_cinematic_scene_01.png')
if os.path.exists(p1): os.remove(p1)

args1 = [
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-features=LensOverlay,LensStandalone,LensRegionSearch',
    '--window-size=1440,950',
    f'--screenshot={p1}',
    'http://localhost:3000/#home'
]
subprocess.run(args1, check=True)
print("Captured Scene 01 screenshot:", p1)
