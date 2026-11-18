from PIL import Image

im = Image.open(r'brand-identity\house_of_jewelux_master_3464.png')
alpha = im.split()[-1]
width, height = im.size

# Calculate row non-zero counts
row_counts = []
for y in range(height):
    # sample row every 4th pixel
    cnt = sum(1 for x in range(0, width, 4) if alpha.getpixel((x, y)) > 20)
    row_counts.append(cnt)

non_empty = [y for y, c in enumerate(row_counts) if c > 0]
min_y, max_y = non_empty[0], non_empty[-1]
print(f"Top-most: {min_y}, Bottom-most: {max_y}")

in_gap = False
gap_start = 0
for y in range(min_y, max_y):
    c = row_counts[y]
    if c == 0 and not in_gap:
        in_gap = True
        gap_start = y
    elif c > 0 and in_gap:
        in_gap = False
        print(f"Gap from y={gap_start} to y={y} (height={y - gap_start})")
