import urllib.request
import urllib.parse
import re

def search_direct_photos(query_term):
    query = f'"https://images.unsplash.com/photo-" {query_term}'
    url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8')
            matches = set(re.findall(r'images\.unsplash\.com(?:%2F|/)photo-([0-9a-fA-F-]+)', html))
            return [f"https://images.unsplash.com/photo-{m}" for m in matches]
    except Exception as e:
        print('Error:', e)
        return []

if __name__ == '__main__':
    for term in ['jewelry', 'necklace', 'earrings', 'ring', 'goldsmith', 'bracelet']:
        print(f"=== {term} ===")
        photos = search_direct_photos(term)
        print('Found:', len(photos))
        for p in photos[:5]:
            print(' ', p)
