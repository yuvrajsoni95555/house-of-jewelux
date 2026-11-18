import subprocess

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
args = [
    chrome_path, '--headless=new', '--disable-gpu', '--virtual-time-budget=3000',
    '--dump-dom', 'http://localhost:3000/?scrollY=1550#home'
]
res = subprocess.run(args, capture_output=True, text=True)
dom = res.stdout

print(f"DOM length: {len(dom)}")
print("Has app-view:", 'id="app-view"' in dom)
print("Has hero-slider:", 'hero-slider' in dom)
print("Has What's New:", "What's New" in dom)
print("Has Categories:", "Shop by Categories" in dom)

# Print the last 1000 characters of the body
if '</main>' in dom:
    idx = dom.find('</main>')
    print("Main content tail:")
    print(dom[idx-500:idx+100])
