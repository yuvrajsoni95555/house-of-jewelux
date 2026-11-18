import os
from PIL import Image

master_path = r'brand-identity\house_of_jewelux_master_3464.png'
im_master = Image.open(master_path)
width, height = im_master.size

# 1. Emblem: y from 120 to 2075
emblem_box = (0, 120, width, 2075)
im_emblem = im_master.crop(emblem_box)
bbox_emblem = im_emblem.getbbox()
im_emblem_tight = im_emblem.crop(bbox_emblem)
print(f"Emblem tight size: {im_emblem_tight.size}")

# Save Emblem
im_emblem_tight.save(r'brand-identity\jewelux-official-emblem-transparent.png', 'PNG')
im_emblem_tight.save(r'brand-identity\jewelux-official-emblem.png', 'PNG')
im_emblem_tight.save(r'images\jewelux-official-emblem.png', 'PNG')

# 2. Typography: y from 2150 to 3260
typo_box = (0, 2150, width, 3260)
im_typo = im_master.crop(typo_box)
bbox_typo = im_typo.getbbox()
im_typo_tight = im_typo.crop(bbox_typo)
print(f"Typography tight size: {im_typo_tight.size}")

# Save Typography
im_typo_tight.save(r'brand-identity\jewelux-official-typography-transparent.png', 'PNG')
im_typo_tight.save(r'brand-identity\jewelux-official-typography.png', 'PNG')
im_typo_tight.save(r'images\jewelux-official-typography.png', 'PNG')

# 3. Stacked Full Logo (tight crop)
bbox_full = im_master.getbbox()
im_stacked = im_master.crop(bbox_full)
im_stacked.save(r'brand-identity\house_of_jewelux_stacked_logo.png', 'PNG')
im_stacked.save(r'brand-identity\house_of_jewelux_official_logo.png', 'PNG')
im_stacked.save(r'brand-identity\house_of_jewelux_official_logo_transparent.png', 'PNG')
im_stacked.save(r'images\house_of_jewelux_official_logo.png', 'PNG')

# 4. Horizontal Lockup: Emblem on Left, Typography on Right
# Let's scale emblem and typography so they align harmoniously
# Target horizontal height: 800px (retina resolution for header)
target_h = 800
# Emblem height = target_h * 0.95
emb_h = int(target_h * 0.95)
emb_w = int(im_emblem_tight.width * (emb_h / im_emblem_tight.height))
emb_resized = im_emblem_tight.resize((emb_w, emb_h), Image.Resampling.LANCZOS)

# Typography height = target_h * 0.65
typ_h = int(target_h * 0.62)
typ_w = int(im_typo_tight.width * (typ_h / im_typo_tight.height))
typ_resized = im_typo_tight.resize((typ_w, typ_h), Image.Resampling.LANCZOS)

# Canvas width: emb_w + gap + typ_w + padding
gap = int(target_h * 0.12)
pad_x = int(target_h * 0.08)
total_w = pad_x * 2 + emb_w + gap + typ_w
total_h = target_h

im_horizontal = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
# Paste emblem vertically centered
emb_y = (total_h - emb_h) // 2
im_horizontal.paste(emb_resized, (pad_x, emb_y), emb_resized)

# Paste typography vertically centered
typ_y = (total_h - typ_h) // 2
im_horizontal.paste(typ_resized, (pad_x + emb_w + gap, typ_y), typ_resized)

# Save Horizontal Logo
im_horizontal.save(r'brand-identity\house_of_jewelux_horizontal_logo.png', 'PNG')
im_horizontal.save(r'brand-identity\house_of_jewelux_horizontal_logo_transparent.png', 'PNG')
im_horizontal.save(r'images\house_of_jewelux_horizontal_logo.png', 'PNG')
im_horizontal.save(r'brand-identity\jewelux-header-logo.png', 'PNG')
im_horizontal.save(r'images\jewelux-header-logo.png', 'PNG')
print(f"Horizontal lockup created: {im_horizontal.size}")

# 5. Square App Icon & Favicon
# Create a square canvas with subtle warm ivory (#FAF8F5) or transparent background
sq_size = 512
im_square = Image.new('RGBA', (sq_size, sq_size), (0, 0, 0, 0))
# Fit emblem nicely inside square (80% of square size)
sq_emb_h = int(sq_size * 0.82)
sq_emb_w = int(im_emblem_tight.width * (sq_emb_h / im_emblem_tight.height))
sq_emb = im_emblem_tight.resize((sq_emb_w, sq_emb_h), Image.Resampling.LANCZOS)
sq_x = (sq_size - sq_emb_w) // 2
sq_y = (sq_size - sq_emb_h) // 2
im_square.paste(sq_emb, (sq_x, sq_y), sq_emb)

im_square.save(r'brand-identity\jewelux-avatar-512.png', 'PNG')
im_square.save(r'brand-identity\apple-touch-icon.png', 'PNG')
im_square.save(r'images\apple-touch-icon.png', 'PNG')

# 32x32 Favicon
fav_32 = im_square.resize((32, 32), Image.Resampling.LANCZOS)
fav_32.save(r'brand-identity\favicon-32x32.png', 'PNG')
fav_32.save(r'images\favicon-32x32.png', 'PNG')
im_square.save(r'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
im_square.save(r'brand-identity\favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print("Successfully generated all brand identity assets!")
