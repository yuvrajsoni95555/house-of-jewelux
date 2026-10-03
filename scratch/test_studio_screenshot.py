import subprocess
import time
import json
import base64
import urllib.request
import websocket
import os

ARTIFACT_DIR = r"C:\Users\yuvra\.gemini\antigravity\brain\3f1566cd-7f97-4ba1-9470-142009ceb583"
PORT = 8080

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--use-gl=angle",
    "--enable-webgl",
    "--remote-debugging-port=9336",
    "--remote-allow-origins=*",
    "--window-size=1600,1100",
    "about:blank"
])
time.sleep(2.5)

try:
    with urllib.request.urlopen("http://127.0.0.1:9336/json") as resp:
        targets = json.loads(resp.read().decode())
    
    page_target = next(t for t in targets if t.get("type") == "page")
    ws = websocket.create_connection(page_target["webSocketDebuggerUrl"], timeout=30)
    msg_id = 0

    def send_cmd(method, params=None):
        global msg_id
        msg_id += 1
        ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        while True:
            res = json.loads(ws.recv())
            if res.get("id") == msg_id:
                return res.get("result", {})

    send_cmd("Page.enable")
    send_cmd("Runtime.enable")

    def eval_js(exp):
        return send_cmd("Runtime.evaluate", {"expression": exp, "returnByValue": True, "awaitPromise": True}).get("result", {}).get("value")

    send_cmd("Page.navigate", {"url": f"http://127.0.0.1:{PORT}/#bespoke-studio"})
    time.sleep(4.0)

    # Scroll directly to the customizer card
    eval_js("""
        const card = document.querySelector('#bespoke-studio .rounded-2xl');
        if (card) {
            card.scrollIntoView({ behavior: 'instant', block: 'start' });
            window.scrollBy(0, -20);
        }
    """)
    time.sleep(1.0)

    def capture_full_viewport(filename):
        res = send_cmd("Page.captureScreenshot", {"format": "png"})
        out_path = os.path.join(ARTIFACT_DIR, filename)
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(res["data"]))
        print("Saved:", filename)

    # Default (Yellow Gold + Diamond)
    capture_full_viewport("verified_local_customizer_pic2_default.png")

    # Select Ruby
    eval_js("setBespokeGem('ruby');")
    time.sleep(0.8)
    capture_full_viewport("verified_local_customizer_pic2_ruby.png")

    # Select Emerald
    eval_js("setBespokeGem('emerald');")
    time.sleep(0.8)
    capture_full_viewport("verified_local_customizer_pic2_emerald.png")

    # Select Sapphire + Rose Gold
    eval_js("setBespokeGem('sapphire'); setBespokeMetal('rose-gold');")
    time.sleep(0.8)
    capture_full_viewport("verified_local_customizer_pic2_sapphire_rosegold.png")

finally:
    try:
        ws.close()
    except Exception:
        pass
    proc.terminate()
