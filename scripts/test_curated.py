import urllib.request

verified_photos = [
    ('craftsmanship_atelier', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=85'),
    ('earrings_model_macro', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=85'),
    ('earrings_diamond_stone', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85'),
    ('earrings_gold_hoop', 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1200&q=85'),
    ('earrings_huggie_close', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=85'),
    ('ring_solitaire_velvet', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85'),
    ('ring_diamond_pave', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85'),
    ('necklace_pendant_velvet', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'),
    ('necklace_luxury_chain', 'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?auto=format&fit=crop&w=1200&q=85'),
    ('bracelet_tennis_diamonds', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=85'),
    ('bracelet_gold_chain', 'https://images.unsplash.com/photo-1611591475877-2287e0766324?auto=format&fit=crop&w=1200&q=85'),
    ('bracelet_gemstones', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85'),
    ('bangles_charcoal_gold', 'https://images.unsplash.com/photo-1787769499628-cc33a6c79ad9?auto=format&fit=crop&w=1200&q=85'),
    ('brooch_diamond_flower', 'https://images.unsplash.com/photo-1728318853117-f9b3ce9be350?auto=format&fit=crop&w=1200&q=85')
]

for name, url in verified_photos:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            ct = resp.headers.get('Content-Type')
            print(f'✓ {name}: {len(content)} bytes ({ct})')
    except Exception as e:
        print(f'✗ {name}: {e}')
