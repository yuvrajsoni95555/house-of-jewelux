import urllib.request
import urllib.parse
import json

HEADERS = {'User-Agent': 'HouseOfJeweluxAtelier/1.0 (admin@houseofjewelux.com)'}

def search_commons(query, limit=5):
    url = f'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&srnamespace=6&srlimit={limit}&format=json'
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        s_data = json.loads(resp.read().decode('utf-8'))
        titles = [x['title'] for x in s_data.get('query', {}).get('search', []) if x['title'].lower().endswith(('.jpg', '.jpeg', '.png'))]

    if not titles: return []
    t_str = '|'.join(titles)
    i_url = f'https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(t_str)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json'
    req2 = urllib.request.Request(i_url, headers=HEADERS)
    with urllib.request.urlopen(req2) as resp:
        i_data = json.loads(resp.read().decode('utf-8'))
        results = []
        for pid, p in i_data.get('query', {}).get('pages', {}).items():
            ii = p.get('imageinfo', [{}])[0]
            em = ii.get('extmetadata', {})
            desc = em.get('ImageDescription', {}).get('value', '')[:100]
            results.append({
                'title': p.get('title'),
                'url': ii.get('url', ''),
                'width': ii.get('width'),
                'height': ii.get('height'),
                'desc': desc
            })
        return results

if __name__ == '__main__':
    searches = [
        'Indian bride jewelry',
        'Indian bride necklace',
        'Indian wedding necklace portrait',
        'woman gold necklace'
    ]
    for s in searches:
        print(f"\n=================== {s} ===================")
        res = search_commons(s, 4)
        for r in res:
            print(f"- {r['title']} ({r['width']}x{r['height']})")
            print(f"  {r['url']}")
