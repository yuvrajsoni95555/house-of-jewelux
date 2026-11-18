with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '  <script src="/motion-design-system.js"></script>\n'
if target in html:
    html = html.replace(target, '')
else:
    target_crlf = '  <script src="/motion-design-system.js"></script>\r\n'
    html = html.replace(target_crlf, '')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html: single unified motion-engine.js active!")
