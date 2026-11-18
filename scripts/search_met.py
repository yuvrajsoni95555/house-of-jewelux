import urllib.request, json

url = 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=Indian+gold+jewelry&hasImages=true'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print('Met Museum total results:', data.get('total'))
        object_ids = data.get('objectIDs', [])[:8]
        for oid in object_ids:
            obj_url = f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{oid}'
            oreq = urllib.request.Request(obj_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(oreq, timeout=10) as oresp:
                obj = json.loads(oresp.read().decode('utf-8'))
                title = obj.get('title')
                img = obj.get('primaryImage')
                date = obj.get('objectDate')
                print(f'ID {oid}: {title} ({date}) -> {img[:60] if img else "None"}')
except Exception as e:
    print('Met error:', e)
