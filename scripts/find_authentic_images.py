import urllib.request
import urllib.parse
import json
import os

HEADERS = {'User-Agent': 'HouseOfJeweluxAtelier/1.0 (admin@houseofjewelux.com)'}

def search_wikimedia(term, limit=6):
    s_url = f'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(term)}&srnamespace=6&srlimit={limit}&format=json'
    req = urllib.request.Request(s_url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        s_data = json.loads(resp.read().decode('utf-8'))
        titles = [x['title'] for x in s_data.get('query', {}).get('search', []) if x['title'].lower().endswith(('.jpg', '.jpeg', '.png'))]

    if not titles:
        return []

    t_str = '|'.join(titles)
    i_url = f'https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(t_str)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json'
    req2 = urllib.request.Request(i_url, headers=HEADERS)
    with urllib.request.urlopen(req2) as resp:
        i_data = json.loads(resp.read().decode('utf-8'))
        results = []
        for pid, p in i_data.get('query', {}).get('pages', {}).items():
            ii = p.get('imageinfo', [{}])[0]
            em = ii.get('extmetadata', {})
            license_name = em.get('LicenseShortName', {}).get('value', 'Public domain / CC')
            artist = em.get('Artist', {}).get('value', 'Museum / Unknown')
            results.append({
                'title': p.get('title'),
                'url': ii.get('url'),
                'width': ii.get('width'),
                'height': ii.get('height'),
                'license': license_name,
                'artist': artist
            })
        return results

if __name__ == '__main__':
    queries = [
        'goldsmith jeweler workbench',
        'Indian gold necklace Jaipur',
        'temple jewellery gold',
        'diamond solitaire ring',
        'gold brooch antique',
        'Indian bride jewelry'
    ]
    for q in queries:
        print(f"\n=================== {q} ===================")
        hits = search_wikimedia(q, 4)
        for h in hits:
            print(f"- {h['title']} ({h['width']}x{h['height']})")
            print(f"  URL: {h['url']}")
            print(f"  License: {h['license']} | Artist: {h['artist'][:60] if h['artist'] else 'N/A'}")
