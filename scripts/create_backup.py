import os
import shutil
import time

timestamp = time.strftime('%Y%m%d_%H%M%S')
backup_dir = f'c:\\houseofjewelux_backup_{timestamp}'
os.makedirs(backup_dir, exist_ok=True)

src_dir = r'c:\houseofjewelux'
ignore_patterns = shutil.ignore_patterns('node_modules', '.git', '*.log')

for item in os.listdir(src_dir):
    if item in ['node_modules', '.git']:
        continue
    s = os.path.join(src_dir, item)
    d = os.path.join(backup_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d, ignore=ignore_patterns)
    else:
        shutil.copy2(s, d)

print(f"Project backup successfully created at: {backup_dir}")
