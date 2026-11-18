import subprocess

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
bench_html = """
<!DOCTYPE html>
<html>
<body>
<iframe id="f" src="http://localhost:3000/#home" style="width:1440px;height:900px;"></iframe>
<script>
window.onload = () => {
  const f = document.getElementById('f');
  f.onload = () => {
    setTimeout(() => {
      const doc = f.contentDocument;
      const h = doc.body.scrollHeight;
      const elH = doc.documentElement.scrollHeight;
      document.title = `HEIGHT:${h}:${elH}`;
      console.log('PAGE HEIGHT:', h, elH);
    }, 500);
  };
};
</script>
</body>
</html>
"""
with open('test_height.html', 'w', encoding='utf-8') as f:
    f.write(bench_html)

args = [
    chrome_path, '--headless=new', '--disable-gpu', '--virtual-time-budget=2000',
    '--dump-dom', 'file:///C:/houseofjewelux/test_height.html'
]
res = subprocess.run(args, capture_output=True, text=True)
print("Result:", res.stdout[:300])
