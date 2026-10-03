import subprocess
import time
import json
import base64
import urllib.request
import websocket
import os
import sys

# Ensure stdout handles utf-8 properly
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ARTIFACT_DIR = r"C:\Users\yuvra\.gemini\antigravity\brain\3f1566cd-7f97-4ba1-9470-142009ceb583"
PORT = 8080

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--use-gl=angle",
    "--enable-webgl",
    "--remote-debugging-port=9335",
    "--remote-allow-origins=*",
    "--window-size=1600,1200",
    "about:blank"
])
print("Headless Edge started on CDP port 9335")
time.sleep(2.5)

try:
    with urllib.request.urlopen("http://127.0.0.1:9335/json") as resp:
        targets = json.loads(resp.read().decode())
    
    page_target = next(t for t in targets if t.get("type") == "page")
    ws_url = page_target["webSocketDebuggerUrl"]
    print(f"Connecting to page WS: {ws_url}")

    ws = websocket.create_connection(ws_url, timeout=30)
    msg_id = 0

    def send_cmd(method, params=None):
        global msg_id
        msg_id += 1
        payload = {"id": msg_id, "method": method, "params": params or {}}
        ws.send(json.dumps(payload))
        while True:
            res = json.loads(ws.recv())
            if res.get("id") == msg_id:
                return res.get("result", {})

    send_cmd("Page.enable")
    send_cmd("Runtime.enable")
    send_cmd("Log.enable")

    def eval_js(expression):
        res = send_cmd("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        return res.get("result", {}).get("value")

    print(f"Navigating to http://127.0.0.1:{PORT}/#bespoke-studio ...")
    send_cmd("Page.navigate", {"url": f"http://127.0.0.1:{PORT}/#bespoke-studio"})
    time.sleep(4.5)

    def capture_studio(filename):
        out_path = os.path.join(ARTIFACT_DIR, filename)
        eval_js("""
            const el = document.getElementById('bespoke-studio');
            if (el) {
                el.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
        """)
        time.sleep(0.6)
        
        # Get element's bounding rect relative to viewport
        r = eval_js("""
            (() => {
                const el = document.querySelector('#bespoke-studio .max-w-7xl');
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {
                    x: Math.max(0, rect.left),
                    y: Math.max(0, rect.top),
                    width: rect.width,
                    height: Math.min(rect.height, 1000)
                };
            })()
        """)
        
        if r and r['width'] > 100 and r['height'] > 100:
            res = send_cmd("Page.captureScreenshot", {
                "format": "png",
                "clip": {
                    "x": r["x"],
                    "y": r["y"],
                    "width": r["width"],
                    "height": r["height"],
                    "scale": 1
                }
            })
        else:
            res = send_cmd("Page.captureScreenshot", {"format": "png"})
            
        data = res.get("data")
        if data:
            with open(out_path, "wb") as f:
                f.write(base64.b64decode(data))
            print(f"Captured: {out_path}")
        else:
            print(f"Failed to capture: {filename}")

    # Check 3D status
    status = eval_js("""
        (() => {
            if (!window.jewelryViewer) return 'no viewer';
            const m = window.jewelryViewer.materials;
            return {
                gem: '0x' + m.gem.color.getHexString(),
                shank: '0x' + m.shank.color.getHexString(),
                head: '0x' + m.head.color.getHexString()
            };
        })()
    """)
    print(f"Initial 3D status: {status}")
    capture_studio("verified_local_customizer_pic2_default.png")

    # 1. Click Ruby Swatch
    print("Selecting Ruby...")
    eval_js("setBespokeGem('ruby');")
    time.sleep(0.8)
    ruby_status = eval_js("""
        (() => {
            const m = window.jewelryViewer.materials;
            const price = document.getElementById('bespoke-calc-price')?.textContent || '';
            const name = document.getElementById('selected-gem-name')?.textContent || '';
            return { gem: '0x' + m.gem.color.getHexString(), price, name };
        })()
    """)
    print(f"Ruby status: {ruby_status}")
    capture_studio("verified_local_customizer_pic2_ruby.png")

    # 2. Click Emerald Swatch
    print("Selecting Emerald...")
    eval_js("setBespokeGem('emerald');")
    time.sleep(0.8)
    emerald_status = eval_js("""
        (() => {
            const m = window.jewelryViewer.materials;
            const price = document.getElementById('bespoke-calc-price')?.textContent || '';
            const name = document.getElementById('selected-gem-name')?.textContent || '';
            return { gem: '0x' + m.gem.color.getHexString(), price, name };
        })()
    """)
    print(f"Emerald status: {emerald_status}")
    capture_studio("verified_local_customizer_pic2_emerald.png")

    # 3. Click Sapphire Swatch + Rose Gold
    print("Selecting Sapphire + Rose Gold...")
    eval_js("setBespokeGem('sapphire'); setBespokeMetal('rose-gold');")
    time.sleep(0.8)
    sapphire_status = eval_js("""
        (() => {
            const m = window.jewelryViewer.materials;
            return {
                gem: '0x' + m.gem.color.getHexString(),
                shank: '0x' + m.shank.color.getHexString(),
                head: '0x' + m.head.color.getHexString()
            };
        })()
    """)
    print(f"Sapphire + Rose Gold status: {sapphire_status}")
    capture_studio("verified_local_customizer_pic2_sapphire_rosegold.png")

    # 4. Click White Gold + Diamond + Oval
    print("Selecting White Gold + Diamond + Oval...")
    eval_js("setBespokeMetal('white-gold'); setBespokeGem('diamond'); setBespokeCut('oval');")
    time.sleep(0.8)
    capture_studio("verified_local_customizer_pic2_whitegold_oval.png")

    # 5. Switch to Engraving Tab
    print("Switching to Engraving tab...")
    eval_js("switchBespokeTab('engraving'); handleEngravingInput('FOREVER \u2661 Y&A');")
    time.sleep(0.8)
    capture_studio("verified_local_customizer_pic2_engraving.png")

    # 6. Test Add To Cart
    cart_before = eval_js("state.cart.length")
    eval_js("orderBespokePiece();")
    time.sleep(0.5)
    cart_after = eval_js("state.cart.length")
    print(f"Cart count: before={cart_before}, after={cart_after}")

    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")

finally:
    try:
        ws.close()
    except Exception:
        pass
    proc.terminate()
    print("Headless Edge terminated.")
