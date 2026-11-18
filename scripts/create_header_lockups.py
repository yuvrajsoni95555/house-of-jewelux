from PIL import Image

# Let's inspect the typography crop
im_typo = Image.open(r'brand-identity\jewelux-official-typography-transparent.png')
print("Typography size:", im_typo.size)

# Let's also create a clean horizontal lockup tailored specifically for the header:
# Height: 200px (retina for 40px display)
# Emblem height: 200px
# Wordmark: "HOUSE OF JEWELUX" (without tagline, or with crisp tagline)
im_emblem = Image.open(r'brand-identity\jewelux-official-emblem-transparent.png')

# Let's create:
# 1. header_logo_full (Emblem + HOUSE OF JEWELUX + tagline)
# 2. header_logo_clean (Emblem + HOUSE OF JEWELUX)
# Let's see y positions inside im_typo:
# "HOUSE OF" and "JEWELUX" end before the divider line.
# In master:
# "JEWELUX" ends around y=3089
# divider line is 3089-3168
# tagline is 3168-3243

# Inside im_typo (which started at y=2150):
# "JEWELUX" ends at 3089 - 2150 = 939
# Let's crop just "HOUSE OF JEWELUX"
im_words = im_typo.crop((0, 0, im_typo.width, 950))
bbox_words = im_words.getbbox()
im_words_tight = im_words.crop(bbox_words)
print("Words tight size:", im_words_tight.size)

# Create Header Lockup A: Emblem + HOUSE OF JEWELUX + Tagline
target_h = 400 # 4x retina for 40px height
# Emblem
emb_h = target_h
emb_w = int(im_emblem.width * (emb_h / im_emblem.height))
emb_r = im_emblem.resize((emb_w, emb_h), Image.Resampling.LANCZOS)

# Typo Full
typ_h = int(target_h * 0.70)
typ_w = int(im_typo.width * (typ_h / im_typo.height))
typ_r = im_typo.resize((typ_w, typ_h), Image.Resampling.LANCZOS)

gap = int(target_h * 0.15)
canvas_w = emb_w + gap + typ_w
canvas_h = target_h

hdr_full = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
hdr_full.paste(emb_r, (0, 0), emb_r)
typ_y = (canvas_h - typ_h) // 2
hdr_full.paste(typ_r, (emb_w + gap, typ_y), typ_r)
hdr_full.save(r'brand-identity\jewelux-header-logo-full.png', 'PNG')
hdr_full.save(r'images\jewelux-header-logo-full.png', 'PNG')

# Create Header Lockup B: Emblem + HOUSE OF JEWELUX (clean words)
words_h = int(target_h * 0.58)
words_w = int(im_words_tight.width * (words_h / im_words_tight.height))
words_r = im_words_tight.resize((words_w, words_h), Image.Resampling.LANCZOS)

canvas_w_b = emb_w + gap + words_w
hdr_words = Image.new('RGBA', (canvas_w_b, canvas_h), (0, 0, 0, 0))
hdr_words.paste(emb_r, (0, 0), emb_r)
words_y = (canvas_h - words_h) // 2
hdr_words.paste(words_r, (emb_w + gap, words_y), words_r)
hdr_words.save(r'brand-identity\jewelux-header-logo-clean.png', 'PNG')
hdr_words.save(r'images\jewelux-header-logo-clean.png', 'PNG')

print("Created header lockups A and B!")
