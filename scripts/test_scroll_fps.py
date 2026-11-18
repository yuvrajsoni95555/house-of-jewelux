import os
import subprocess
import json
import time

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
url = 'http://localhost:3000'

# We can run chrome with a user-script or inspect console logs
benchmark_html = """
<!DOCTYPE html>
<html>
<body>
<iframe id="test-frame" src="http://localhost:3000" style="width: 1440px; height: 900px; border: none;"></iframe>
<script>
window.addEventListener('load', () => {
  const frame = document.getElementById('test-frame');
  frame.onload = () => {
    const fWin = frame.contentWindow;
    const fDoc = frame.contentDocument;

    let frames = 0;
    let longFrames = 0;
    let lastTime = performance.now();
    let frameTimes = [];

    function countFrames(now) {
      frames++;
      let dt = now - lastTime;
      frameTimes.push(dt);
      if (dt > 25) longFrames++; // frames taking > 25ms (< 40 fps)
      lastTime = now;
      if (measuring) requestAnimationFrame(countFrames);
    }

    let measuring = true;
    requestAnimationFrame(countFrames);

    // Smooth scroll down
    let currentY = 0;
    const maxScroll = fDoc.body.scrollHeight - fWin.innerHeight;
    const scrollStep = 45;
    
    const timer = setInterval(() => {
      currentY += scrollStep;
      fWin.scrollTo(0, currentY);

      if (currentY >= maxScroll) {
        clearInterval(timer);
        // Scroll back up
        const upTimer = setInterval(() => {
          currentY -= scrollStep;
          fWin.scrollTo(0, currentY);
          if (currentY <= 0) {
            clearInterval(upTimer);
            measuring = false;

            const totalTime = frameTimes.reduce((a, b) => a + b, 0);
            const avgFPS = Math.round((frames / (totalTime / 1000)));
            const p99 = frameTimes.sort((a,b) => a - b)[Math.floor(frameTimes.length * 0.99)];

            const result = {
              totalFrames: frames,
              avgFPS: avgFPS,
              longFrames: longFrames,
              p99FrameTimeMs: Math.round(p99 * 10) / 10,
              maxScrollHeight: maxScroll,
              smooth: longFrames < 5
            };
            console.log('__BENCHMARK_RESULT__:' + JSON.stringify(result));
            document.title = '__DONE__:' + JSON.stringify(result);
          }
        }, 16);
      }
    }, 16);
  };
});
</script>
</body>
</html>
"""

bench_file = r'C:\houseofjewelux\benchmark.html'
with open(bench_file, 'w', encoding='utf-8') as f:
    f.write(benchmark_html)

print("Running scroll smoothness benchmark...")
args = [
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--virtual-time-budget=12000',
    '--dump-dom',
    r'file:///C:/houseofjewelux/benchmark.html'
]

res = subprocess.run(args, capture_output=True, text=True)
dom = res.stdout

if '__DONE__:' in dom:
    part = dom.split('__DONE__:')[1].split('<')[0]
    data = json.loads(part)
    print("=== SCROLL BENCHMARK RESULTS ===")
    print(f"Total Frames Rendered: {data['totalFrames']}")
    print(f"Average Scroll FPS: {data['avgFPS']} FPS")
    print(f"P99 Frame Time: {data['p99FrameTimeMs']} ms (16.6ms target)")
    print(f"Dropped Frames (>25ms): {data['longFrames']}")
    print(f"Full Roundtrip Scroll: 0px -> {data['maxScrollHeight']}px -> 0px")
    print(f"Scroll Status: {'SILKY SMOOTH (STABLE)' if data['smooth'] else 'NEEDS FURTHER TUNING'}")
else:
    print("Benchmark completed DOM:")
    print(dom[:500])

if os.path.exists(bench_file):
    os.remove(bench_file)
