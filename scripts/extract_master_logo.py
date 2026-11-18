import zlib
import re
from PIL import Image

pdf_path = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\.user_uploaded\media_1794993035098_9f2e6b66.pdf'

with open(pdf_path, 'rb') as f:
    data = f.read()

# Extract object 4 (RGB) and object 5 (Alpha)
# In the PDF:
# obj 4 length: 3529407
# obj 5 length: 486371

# Find 4 0 obj ... stream ... endstream
m4 = re.search(rb'4 0 obj.*?stream\r?\n(.*?)[\r\n]+endstream', data, re.DOTALL)
m5 = re.search(rb'5 0 obj.*?stream\r?\n(.*?)[\r\n]+endstream', data, re.DOTALL)

if not m4 or not m5:
    print("Could not match obj 4 or obj 5 streams with regex. Trying alternate extraction...")
    # Find all streams
    streams = re.findall(rb'stream[\r\n]+(.*?)[\r\n]+endstream', data, re.DOTALL)
    for s in streams:
        try:
            d = zlib.decompress(s)
            if len(d) == 35997888:
                rgb_raw = d
                print("Found RGB stream by length: 35997888")
            elif len(d) == 11999296:
                alpha_raw = d
                print("Found Alpha stream by length: 11999296")
        except Exception as e:
            pass
else:
    rgb_compressed = m4.group(1)
    alpha_compressed = m5.group(1)
    rgb_raw = zlib.decompress(rgb_compressed)
    alpha_raw = zlib.decompress(alpha_compressed)
    print("Extracted via regex successfully!")

width, height = 3464, 3464
im_rgb = Image.frombytes('RGB', (width, height), rgb_raw)
im_a = Image.frombytes('L', (width, height), alpha_raw)

# Combine into RGBA
im_rgba = im_rgb.convert('RGBA')
im_rgba.putalpha(im_a)

output_master = r'brand-identity\house_of_jewelux_master_3464.png'
im_rgba.save(output_master, 'PNG')
print(f"Saved master RGBA logo to {output_master} (size: {im_rgba.size})")

# Also save high quality transparent web versions
# 1. Main official logo transparent
im_rgba.save(r'brand-identity\house_of_jewelux_official_logo_transparent.png', 'PNG')
im_rgba.save(r'brand-identity\house_of_jewelux_official_logo.png', 'PNG')

# 2. Check bounding box to crop tightly
bbox = im_rgba.getbbox()
print(f"Non-transparent bounding box: {bbox}")

# Crop to content
im_cropped = im_rgba.crop(bbox)
im_cropped.save(r'brand-identity\house_of_jewelux_logo_tight.png', 'PNG')
print(f"Saved tight cropped logo: {im_cropped.size}")
