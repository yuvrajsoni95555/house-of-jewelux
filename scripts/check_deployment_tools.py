import shutil
import subprocess

tools = ['git', 'node', 'npm', 'npx', 'gcloud', 'firebase', 'vercel', 'netlify', 'cloudflared', 'ngrok', 'localtunnel']

for t in tools:
    path = shutil.which(t)
    if path:
        print(f"• {t}: AVAILABLE at {path}")
    else:
        print(f"• {t}: NOT INSTALLED")

# Check npm global packages or installed tools
try:
    res = subprocess.run(['npm', 'list', '-g', '--depth=0'], capture_output=True, text=True, timeout=5)
    print("\n--- Global npm packages ---")
    print(res.stdout[:500])
except Exception as e:
    print("Could not list global npm packages:", e)
