with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'function renderCategoryPage\([^{]*\{(.*?)\n  function ', text, re.DOTALL)
if m:
    print(m.group(0)[:1500])
else:
    print("renderCategoryPage not found")
