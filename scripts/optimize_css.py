with open('style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Parallax plane - remove CSS transition
content = content.replace(
    ".parallax-plane {\n  transition: transform 0.1s ease-out;\n  will-change: transform;\n}",
    ".parallax-plane {\n  will-change: transform;\n}"
)
content = content.replace(
    ".parallax-plane {\r\n  transition: transform 0.1s ease-out;\r\n  will-change: transform;\r\n}",
    ".parallax-plane {\r\n  will-change: transform;\r\n}"
)

# 2. Site header scrolled - remove heavy backdrop blur, replace with luxury opaque ivory & shadow
content = content.replace(
    ".site-header.scrolled {\n  background: rgba(250, 248, 245, 0.95);\n  backdrop-filter: blur(12px);\n  box-shadow: 0 4px 20px rgba(35, 28, 22, 0.06);\n}",
    ".site-header.scrolled {\n  background: rgba(250, 248, 245, 0.98);\n  box-shadow: 0 4px 20px rgba(35, 28, 22, 0.05);\n  border-bottom-color: rgba(216, 206, 194, 0.8);\n}"
)
content = content.replace(
    ".site-header.scrolled {\r\n  background: rgba(250, 248, 245, 0.95);\r\n  backdrop-filter: blur(12px);\r\n  box-shadow: 0 4px 20px rgba(35, 28, 22, 0.06);\r\n}",
    ".site-header.scrolled {\r\n  background: rgba(250, 248, 245, 0.98);\r\n  box-shadow: 0 4px 20px rgba(35, 28, 22, 0.05);\r\n  border-bottom-color: rgba(216, 206, 194, 0.8);\r\n}"
)

# 3. Sticky header states - remove height shrinking reflow
content = content.replace(
    ".site-header.sticky-compact {\n  height: 56px;\n  padding-top: 0;\n  padding-bottom: 0;\n}",
    "/* .site-header.sticky-compact removed to eliminate layout shift / reflow */"
)
content = content.replace(
    ".site-header.sticky-compact {\r\n  height: 56px;\r\n  padding-top: 0;\r\n  padding-bottom: 0;\r\n}",
    "/* .site-header.sticky-compact removed to eliminate layout shift / reflow */"
)

# 4. Product card transition - avoid fighting GSAP transforms
content = content.replace(
    ".product-card {\n  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;\n  will-change: transform;\n}\n\n.product-card:hover {\n  transform: translateY(-6px);",
    ".product-card {\n  border: 1px solid var(--color-warm-stone-light);\n  will-change: transform, opacity;\n}\n\n.product-card:hover {\n  box-shadow: 0 14px 32px rgba(35, 28, 22, 0.08);\n  border-color: var(--color-antique-gold);"
)
content = content.replace(
    ".product-card {\r\n  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;\r\n  will-change: transform;\r\n}\r\n\r\n.product-card:hover {\r\n  transform: translateY(-6px);",
    ".product-card {\r\n  border: 1px solid var(--color-warm-stone-light);\r\n  will-change: transform, opacity;\r\n}\r\n\r\n.product-card:hover {\r\n  box-shadow: 0 14px 32px rgba(35, 28, 22, 0.08);\r\n  border-color: var(--color-antique-gold);"
)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS optimizations applied successfully!")
