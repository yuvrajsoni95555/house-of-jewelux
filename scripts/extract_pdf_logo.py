import zlib
import re
from PIL import Image

pdf_path = r'C:\Users\yuvra\.gemini\antigravity\brain\14c37c52-8c4c-49d3-b421-e3ddc07a0d58\.user_uploaded\media_1794993035098_9f2e6b66.pdf'

with open(pdf_path, 'rb') as f:
    data = f.read()

# Let's inspect objects in the PDF
idx = 0
for match in re.finditer(b'stream', data):
    pos = match.start()
    header_chunk = data[max(0, pos-400):pos]
    print(f"--- Stream at {pos} ---")
    print(header_chunk.decode('latin1', errors='ignore'))
