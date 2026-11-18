import re

with open('scripts/genomines_home.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

print("=== GENOMINES ANIMATION & MOTION ANALYSIS ===")

# Find key libraries / scripts
scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html)
print(f"Total external scripts: {len(scripts)}")
for s in scripts[:10]:
    print("• Script:", s)

# Search for animation keywords in inline scripts or styles
print("\n--- Key Animation Classes & Attributes ---")
classes = set(re.findall(r'class=["\']([^"\']*(?:scroll|reveal|motion|fade|parallax|mask|pin|hero|anim)[^"\']*)["\']', html, re.IGNORECASE))
for c in list(classes)[:20]:
    print("• Class:", c)

# Find CSS variables or animation definitions
styles = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
print(f"\nTotal style tags: {len(styles)}")
all_styles = "\n".join(styles)
easings = re.findall(r'cubic-bezier\([^\)]+\)', all_styles)
print("Unique easings found:", set(easings))
