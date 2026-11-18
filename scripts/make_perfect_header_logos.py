from PIL import Image

# Load the master 3464x3464 RGBA logo
im_master = Image.open(r'brand-identity\house_of_jewelux_master_3464.png')

# 1. Emblem (y: 120 to 2075)
emblem = im_master.crop((0, 120, im_master.width, 2075)).crop(im_master.crop((0, 120, im_master.width, 2075)).getbbox())

# 2. "HOUSE OF" (y: 2170 to 2340)
house_of = im_master.crop((0, 2170, im_master.width, 2340)).crop(im_master.crop((0, 2170, im_master.width, 2340)).getbbox())

# 3. "JEWELUX" (y: 2410 to 3085)
jewelux = im_master.crop((0, 2410, im_master.width, 3085)).crop(im_master.crop((0, 2410, im_master.width, 3085)).getbbox())

# 4. Divider with diamond star (x: 500 to 3000, y: 3085 to 3170)
div_crop = im_master.crop((500, 3085, 3000, 3170))
divider = div_crop.crop(div_crop.getbbox())

# 5. Tagline "WHERE ELEGANCE BECOMES ETERNAL" (y: 3168 to 3250)
tag_crop = im_master.crop((0, 3168, im_master.width, 3250))
tagline = tag_crop.crop(tag_crop.getbbox())

print(f"Emblem: {emblem.size}")
print(f"HOUSE OF: {house_of.size}")
print(f"JEWELUX: {jewelux.size}")
print(f"Divider: {divider.size}")
print(f"Tagline: {tagline.size}")

# Build the Master Horizontal Header Lockup
# Canvas height: 600px (retina for 45-50px height)
H = 600

# Emblem height = 560px
emb_h = 560
emb_w = int(emblem.width * (emb_h / emblem.height))
emb_scaled = emblem.resize((emb_w, emb_h), Image.Resampling.LANCZOS)

# On the right, stack:
# HOUSE OF (height = 68px)
# JEWELUX (height = 240px)
# Divider (height = 28px)
# Tagline (height = 44px)
ho_h = 68
ho_w = int(house_of.width * (ho_h / house_of.height))
ho_scaled = house_of.resize((ho_w, ho_h), Image.Resampling.LANCZOS)

jw_h = 240
jw_w = int(jewelux.width * (jw_h / jewelux.height))
jw_scaled = jewelux.resize((jw_w, jw_h), Image.Resampling.LANCZOS)

div_h = 28
div_w = int(divider.width * (div_h / divider.height))
div_scaled = divider.resize((min(div_w, jw_w), div_h), Image.Resampling.LANCZOS)

tag_h = 44
tag_w = int(tagline.width * (tag_h / tagline.height))
tag_scaled = tagline.resize((tag_w, tag_h), Image.Resampling.LANCZOS)

right_w = max(ho_w, jw_w, div_scaled.width, tag_w)
total_right_h = ho_h + 16 + jw_h + 20 + div_h + 14 + tag_h

gap = 70
total_W = emb_w + gap + right_w + 30

hdr = Image.new('RGBA', (total_W, H), (0, 0, 0, 0))

# Paste Emblem
emb_y = (H - emb_h) // 2
hdr.paste(emb_scaled, (10, emb_y), emb_scaled)

# Paste Right Stack (centered vertically)
start_x = 10 + emb_w + gap
curr_y = (H - total_right_h) // 2

# HOUSE OF (centered)
ho_x = start_x + (right_w - ho_w) // 2
hdr.paste(ho_scaled, (ho_x, curr_y), ho_scaled)
curr_y += ho_h + 16

# JEWELUX (centered)
jw_x = start_x + (right_w - jw_w) // 2
hdr.paste(jw_scaled, (jw_x, curr_y), jw_scaled)
curr_y += jw_h + 20

# Divider (centered)
div_x = start_x + (right_w - div_scaled.width) // 2
hdr.paste(div_scaled, (div_x, curr_y), div_scaled)
curr_y += div_h + 14

# Tagline (centered)
tag_x = start_x + (right_w - tag_w) // 2
hdr.paste(tag_scaled, (tag_x, curr_y), tag_scaled)

# Save master horizontal lockup
hdr.save(r'brand-identity\house_of_jewelux_horizontal_logo.png', 'PNG')
hdr.save(r'brand-identity\house_of_jewelux_horizontal_logo_transparent.png', 'PNG')
hdr.save(r'images\house_of_jewelux_horizontal_logo.png', 'PNG')
hdr.save(r'brand-identity\jewelux-header-logo.png', 'PNG')
hdr.save(r'images\jewelux-header-logo.png', 'PNG')

print(f"Created Perfect Master Horizontal Lockup: {hdr.size}")
