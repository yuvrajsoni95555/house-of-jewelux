import os
from PIL import Image

src_dir = r"c:\Users\yuvra\OneDrive\Desktop\House of jewelux pc example img"
dest_dir = r"c:\houseofjewelux\images"

def crop_and_save(src_filename, box, dest_filename):
    src_path = os.path.join(src_dir, src_filename)
    dest_jpg = os.path.join(dest_dir, dest_filename)
    dest_webp = os.path.join(dest_dir, os.path.splitext(dest_filename)[0] + '.webp')
    with Image.open(src_path) as im:
        cropped = im.crop(box)
        if cropped.mode != 'RGB':
            cropped = cropped.convert('RGB')
        cropped.save(dest_jpg, 'JPEG', quality=92, optimize=True)
        cropped.save(dest_webp, 'WEBP', quality=88)
        print(f"✓ Cleanly Saved {dest_filename} ({cropped.size[0]}x{cropped.size[1]})")

# 1. Clean Falcon Brooch (No Rathod watermark)
crop_and_save("Screenshot_2026-11-18-13-23-53-946_com.pinterest.jpg", (120, 480, 1050, 1420), "user_falcon_brooch_white.jpg")

# 2. Falcon Brooch Green Emerald
crop_and_save("Screenshot_2026-11-18-13-23-57-883_com.pinterest.jpg", (30, 240, 470, 820), "user_falcon_brooch_emerald.jpg")

# 3. Clean Balaji Temple Nakshi Pendant (No Visit Site button)
crop_and_save("Screenshot_2026-11-18-13-23-57-883_com.pinterest.jpg", (520, 390, 1170, 1140), "user_balaji_temple_pendant.jpg")

# 4. Clean Dual Swan Diamond Brooch
crop_and_save("Screenshot_2026-11-18-13-23-57-883_com.pinterest.jpg", (30, 1220, 470, 1800), "user_swan_diamond_brooch.jpg")

# 5. Clean Royal Elephant Brooch (No text at bottom)
crop_and_save("Screenshot_2026-11-18-13-24-06-853_com.pinterest.jpg", (100, 250, 1100, 1120), "user_elephant_brooch.jpg")

# 6. Clean Jaguar Clawed Emerald Brooch
crop_and_save("Screenshot_2026-11-18-13-24-12-843_com.pinterest.jpg", (120, 280, 1080, 1420), "user_jaguar_emerald_brooch.jpg")

# 7. Clean Ganesha Leaf Emerald Brooch
crop_and_save("Screenshot_2026-11-18-13-24-17-689_com.pinterest.jpg", (180, 240, 1020, 1360), "user_ganesha_leaf_brooch.jpg")

print("All clean watermark-free user crops generated!")
