import urllib.request
import os
import sys
from PIL import Image

TARGET_DIR = r"c:\houseofjewelux\images"
os.makedirs(TARGET_DIR, exist_ok=True)

IMAGE_ASSETS = [
    {
        "id": "authentic_hero_editorial",
        "url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1920&q=85",
        "filename": "authentic_hero_editorial.jpg",
        "alt": "House of Jewelux Editorial Campaign - Masterpiece Handcrafted Diamond & Gold Fine Necklace",
        "category": "Hero Banner",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_earrings_macro",
        "url": "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_earrings_macro.jpg",
        "alt": "Earrings you can sleep in - Precision engineered 925 silver & gold huggie earrings on model ear",
        "category": "Editorial Split & Category Circle",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_rings_couple_hands",
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/88/Couple_holds_hands_showing_wedding_rings_in_a_warm_setting_during_a_celebration.jpg",
        "filename": "authentic_rings_couple_hands.jpg",
        "alt": "Rings for life - Handcrafted couple bands and diamond solitaires worn in daily harmony",
        "category": "Editorial Split & Collection Hero",
        "source": "Wikimedia Commons (Celebration Photography)",
        "license": "Creative Commons Attribution-ShareAlike 4.0"
    },
    {
        "id": "authentic_solitaire_ring",
        "url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_solitaire_ring.jpg",
        "alt": "The Celestial Radiance Solitaire Ring - Hearts and arrows brilliant cut solitaire on velvet",
        "category": "Category Circle & Products",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_diamond_ring_macro",
        "url": "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_diamond_ring_macro.jpg",
        "alt": "The Verona Pavé Diamond Halo Ring in 925 solid silver",
        "category": "Product Catalogue",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_chelsea_ring",
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Chelsea-solitaire-engagement-ring-oval-3-rows-pave-18k-white-gold.jpg",
        "filename": "authentic_chelsea_ring.jpg",
        "alt": "The Royal Pavilion Solitaire Oval Ring with triple pavé band",
        "category": "Product Catalogue",
        "source": "Wikimedia Commons",
        "license": "Creative Commons Attribution-ShareAlike 4.0"
    },
    {
        "id": "authentic_earrings_stone",
        "url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_earrings_stone.jpg",
        "alt": "The Lumina Teardrop Solitaire Earrings on sculptural limestone",
        "category": "Collection Hero & Products",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_earrings_hoop",
        "url": "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_earrings_hoop.jpg",
        "alt": "The Milanese Pavé Huggie Hoops in liquid rhodium silver",
        "category": "Product Catalogue",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_earrings_huggie",
        "url": "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_earrings_huggie.jpg",
        "alt": "The Starlight 4-Claw Solitaire Studs in pure 925 silver",
        "category": "Product Catalogue",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_necklace_hero",
        "url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_necklace_hero.jpg",
        "alt": "The Luna Pavé Halo Bridal Solitaire Necklace",
        "category": "Category Circle & Collection Hero",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_necklace_chain",
        "url": "https://images.unsplash.com/photo-1633934542430-0905ccb5f050?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_necklace_chain.jpg",
        "alt": "The Artisanal Lariat Y-Drop Pavé Chain in champagne gold",
        "category": "Product Catalogue",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_temple_heritage",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Hansli_%28necklace%29%2C_India%2C_possibly_Bikaner%2C_Rajasthan%2C_Mughal_period%2C_18th_century%2C_gold%2C_diamonds%2C_pearls%2C_enamel_-_Royal_Ontario_Museum_-_DSC04553.JPG",
        "filename": "authentic_temple_heritage.jpg",
        "alt": "Sacred Indian Temple Nakshi Gold, Diamond & Pearl Heritage Hansli - Royal Ontario Museum",
        "category": "Category Circle & Collection Hero",
        "source": "Royal Ontario Museum / Wikimedia Commons",
        "license": "Creative Commons Attribution-ShareAlike 4.0"
    },
    {
        "id": "authentic_temple_sacred",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/30/Necklace%2C_India%2C_1607-1619.jpg",
        "filename": "authentic_temple_sacred.jpg",
        "alt": "17th Century Sacred Royal Indian Gold & Gemstone Heritage Necklace",
        "category": "Product Catalogue & Collection",
        "source": "Wikimedia Commons / Museum Archive",
        "license": "Public Domain (Mark 1.0)"
    },
    {
        "id": "authentic_festive_bridal",
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Clevelandart_1915.337.jpg",
        "filename": "authentic_festive_bridal.jpg",
        "alt": "Royal Surya Gold Forehead Filigree Ornament with Attendants - Cleveland Museum of Art",
        "category": "Category Circle Festive Edit",
        "source": "Cleveland Museum of Art / Wikimedia Commons",
        "license": "Creative Commons Zero (CC0 1.0 Public Domain)"
    },
    {
        "id": "authentic_bracelet_tennis",
        "url": "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_bracelet_tennis.jpg",
        "alt": "The Riviera 4mm Diamond Tennis Bracelet in 925 sterling silver",
        "category": "Category Circle & Products",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_bracelet_bangles",
        "url": "https://images.unsplash.com/photo-1787769499628-cc33a6c79ad9?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_bracelet_bangles.jpg",
        "alt": "The Milanese Sculpted Torque Cuff & Sovereign Silver Bangles",
        "category": "Product Catalogue",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_bracelet_gemstones",
        "url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_bracelet_gemstones.jpg",
        "alt": "The Emerald Solitaire Station Chain Bracelet in 18K micron gold",
        "category": "Product Catalogue",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_brooch_flower",
        "url": "https://images.unsplash.com/photo-1728318853117-f9b3ce9be350?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_brooch_flower.jpg",
        "alt": "The Celestial Diamond Flower Brooch Pin in fine sterling silver",
        "category": "Category Circle & Products",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    },
    {
        "id": "authentic_brooch_antique",
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/78/Brooch_%28England%29%2C_18th_century_%28CH_18800413%29.jpg",
        "filename": "authentic_brooch_antique.jpg",
        "alt": "The Sovereign Crest Royal Falcon Brooch - Cooper Hewitt Museum Archive",
        "category": "Product Catalogue",
        "source": "Cooper Hewitt Smithsonian Design Museum / Wikimedia Commons",
        "license": "Public Domain (Mark 1.0)"
    },
    {
        "id": "authentic_atelier_craft",
        "url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=85",
        "filename": "authentic_atelier_craft.jpg",
        "alt": "Master Goldsmith at Jeweler's Bench setting precious stones with precision hand tools",
        "category": "Atelier & Craftsmanship",
        "source": "Unsplash Commercial License (Unsplash)",
        "license": "Unsplash Free Commercial License"
    }
]

def download_and_optimize():
    headers = {'User-Agent': 'HouseOfJeweluxAtelier/1.0 (admin@houseofjewelux.com)'}
    successful = []
    failed = []

    for item in IMAGE_ASSETS:
        dest_jpg = os.path.join(TARGET_DIR, item['filename'])
        dest_webp = os.path.join(TARGET_DIR, os.path.splitext(item['filename'])[0] + '.webp')
        
        print(f"\nProcessing [{item['id']}] -> {item['filename']}...")
        try:
            req = urllib.request.Request(item['url'], headers=headers)
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = resp.read()
            
            # Temporary write to disk for Pillow processing
            temp_path = dest_jpg + '.tmp'
            with open(temp_path, 'wb') as f:
                f.write(data)
            
            with Image.open(temp_path) as im:
                # Convert RGBA or CMYK to RGB
                if im.mode != 'RGB':
                    im = im.convert('RGB')
                
                width, height = im.size
                print(f"  Downloaded: {width}x{height} pixels, {len(data)/1024:.1f} KB")
                
                # Save optimized JPEG
                im.save(dest_jpg, 'JPEG', quality=88, optimize=True)
                
                # Save modern WebP
                im.save(dest_webp, 'WEBP', quality=84, method=4)
                
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            jpg_size = os.path.getsize(dest_jpg) / 1024
            webp_size = os.path.getsize(dest_webp) / 1024
            print(f"  ✓ Saved {item['filename']} ({jpg_size:.1f} KB) & {os.path.basename(dest_webp)} ({webp_size:.1f} KB)")
            
            successful.append({
                **item,
                "width": width,
                "height": height,
                "jpg_size_kb": round(jpg_size, 1),
                "webp_size_kb": round(webp_size, 1)
            })
        except Exception as e:
            print(f"  ✗ Failed to download {item['id']}: {e}")
            failed.append({"id": item['id'], "error": str(e)})

    # Also make backup copy of any original files replaced
    print(f"\n==========================================")
    print(f"Summary: {len(successful)} downloaded successfully, {len(failed)} failed.")
    
    # Save manifest for auditing
    manifest_path = os.path.join(TARGET_DIR, "authentic_images_manifest.json")
    import json
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump({"successful": successful, "failed": failed}, f, indent=2)
    print(f"Manifest written to {manifest_path}")

if __name__ == '__main__':
    download_and_optimize()
