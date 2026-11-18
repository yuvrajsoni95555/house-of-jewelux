with open('style.css', 'r', encoding='utf-8') as f:
    code = f.read()

print(".acquisition-toast in style.css:", ".acquisition-toast" in code)
print(".back-to-top in style.css:", ".back-to-top" in code)
