import urllib.request
import urllib.parse
import json

HEADERS = {'User-Agent': 'HouseOfJeweluxAtelier/1.0 (admin@houseofjewelux.com)'}

def search_met_indian_jewelry(query, limit=10):
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
            url = ii.get('url', '')
            results.append({
                'title': p.get('title'),
                'url': url,
                'width': ii.get('width'),
                'height': ii.get('height')
            })
        return results

if __name__ == '__main__':
    for q in ['Indian necklace gold Cleveland Museum', 'Indian gold jewelry MET', 'Kundan necklace Jaipur', 'Mughal necklace gold']:
        print(f"\n=== {q} ===")
        for r in search_met_indian_jewelry(q, 3):
            print(f"- {r['title']} ({r['width']}x{r['height']})")
            print(f"  {r['url']}")
