import base64

# Read the horizontal PNG
with open(r'brand-identity\house_of_jewelux_horizontal_logo.png', 'rb') as f:
    hdr_b64 = base64.b64encode(f.read()).decode('ascii')

# Create jewelux-logo-horizontal-transparent.svg (width: 2018, height: 600)
svg_hdr = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2018 600" width="100%" height="100%">
  <image href="data:image/png;base64,{hdr_b64}" x="0" y="0" width="2018" height="600" />
</svg>'''

with open(r'brand-identity\svg\jewelux-logo-horizontal-transparent.svg', 'w', encoding='utf-8') as f:
    f.write(svg_hdr)

# Read the stacked/official PNG
with open(r'brand-identity\house_of_jewelux_official_logo.png', 'rb') as f:
    stacked_b64 = base64.b64encode(f.read()).decode('ascii')

# Create jewelux-logo-primary-transparent.svg (width: 3464, height: 3464)
svg_stacked = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3464 3464" width="100%" height="100%">
  <image href="data:image/png;base64,{stacked_b64}" x="0" y="0" width="3464" height="3464" />
</svg>'''

with open(r'brand-identity\svg\jewelux-logo-primary-transparent.svg', 'w', encoding='utf-8') as f:
    f.write(svg_stacked)

# Read the emblem PNG
with open(r'brand-identity\jewelux-official-emblem.png', 'rb') as f:
    emb_b64 = base64.b64encode(f.read()).decode('ascii')

# Create jewelux-logo-monogram-emblem.svg (width: 1522, height: 1944)
svg_emb = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1522 1944" width="100%" height="100%">
  <image href="data:image/png;base64,{emb_b64}" x="0" y="0" width="1522" height="1944" />
</svg>'''

with open(r'brand-identity\svg\jewelux-logo-monogram-emblem.svg', 'w', encoding='utf-8') as f:
    f.write(svg_emb)

print("Updated brand-identity/svg files with authentic master logo!")
