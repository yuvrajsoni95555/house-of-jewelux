from html.parser import HTMLParser
import re

with open('scripts/jaipurjewels_home.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Find title
m_title = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
print("Title:", m_title.group(1).strip() if m_title else "None")

# Find headings
print("\n--- Headings ---")
for m in re.finditer(r'<(h[1-4])[^>]*>(.*?)</\1>', content, re.IGNORECASE | re.DOTALL):
    tag = m.group(1).lower()
    text = re.sub(r'<[^>]+>', '', m.group(2)).strip()
    if text:
        print(f"<{tag}> {text}")

# Find navigation items
print("\n--- Navigation / Key Anchors ---")
anchors = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', content, re.IGNORECASE | re.DOTALL)
seen = set()
for href, text in anchors:
    clean_text = re.sub(r'<[^>]+>', '', text).strip()
    if clean_text and clean_text not in seen:
        if any(k in clean_text.lower() for k in ['jewel', 'collection', 'ring', 'earring', 'necklace', 'bangle', 'bracelet', 'polki', 'jadau', 'diamond', 'heritage', 'craft', 'about', 'contact', 'appointment', 'track', 'story', 'shop', 'bridal', 'new', 'cuff', 'pendant']):
            seen.add(clean_text)
            print(f"• {clean_text} -> {href}")
