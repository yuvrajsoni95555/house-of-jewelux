import urllib.request
import os
from PIL import Image
import io

new_assets = [
    ('authentic_indian_bridal', 'photo-1610030469983-98e550d6193c'),
    ('authentic_diamond_choker', 'photo-1599643478518-a784e5dc4c8f'),
    ('authentic_emerald_ring', 'photo-1605100804763-247f67b3557e'),
    ('authentic_polki_craft', 'photo-1535632066927-ab7c9ab60908'),
    ('authentic_mens_sherwani_jewel', 'photo-1583939003579-730e3918a45a')
]

out_dir = r"c:\houseofjewelux\images"

for name, pid in new_assets:
    url = f"https://images.unsplash.com/{pid}?q=88&w=1600&auto=format&fit=crop"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            im = Image.open(io.BytesIO(data))
            if im.mode != 'RGB':
                im = im.convert('RGB')
            
            jpg_path = os.path.join(out_dir, f"{name}.jpg")
            webp_path = os.path.join(out_dir, f"{name}.webp")
            
            im.save(jpg_path, 'JPEG', quality=90)
            im.save(webp_path, 'WEBP', quality=90)
            print(f"✓ Saved {name} ({im.size[0]}x{im.size[1]})")
    except Exception as e:
        print(f"✗ Failed {name}: {e}")
