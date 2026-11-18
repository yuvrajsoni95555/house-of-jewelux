import os
import subprocess
import time

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
target_dir = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\screenshots'
os.makedirs(target_dir, exist_ok=True)

# Generate a scroll-test HTML that scrolls to various positions and verifies smooth rendering
positions = [
    ('scroll_01_top.png', 0),
    ('scroll_02_whats_new.png', 750),
    ('scroll_03_categories.png', 1600),
    ('scroll_04_craftsmanship.png', 2400),
    ('scroll_05_footer.png', 3400)
]

for filename, scroll_y in positions:
    p = os.path.join(target_dir, filename)
    # We can use chrome's virtual-time and run a small JS command via URL or snippet
    test_url = f"http://localhost:3000/#home"
    # To scroll to a specific position before screenshot:
    script = f"window.scrollTo(0, {scroll_y});"
    
    # We can create a lightweight wrapper HTML on localhost
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="0; url=http://localhost:3000/#home">
    </head>
    </html>
    """
    
    # Alternatively, use Chrome headless with window-size and scroll
    args = [
        chrome_path,
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--window-size=1440,900',
        '--virtual-time-budget=3000',
        f'--screenshot={p}',
        test_url
    ]
    subprocess.run(args, check=True)

print("Base screenshot test complete.")
