import os
import subprocess

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

out = os.path.join(target_dir, 'all_jewellery_vault_desktop.png')
args = [
    chrome_path, '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1440,900', '--virtual-time-budget=3000',
    f'--screenshot={out}',
    'http://localhost:3000/#collections/all'
]
subprocess.run(args, check=True)
print(f"Captured all_jewellery_vault_desktop.png ({os.path.getsize(out)} bytes)")
