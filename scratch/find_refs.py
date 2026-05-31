import json, sys
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('data.json', encoding='utf-8'))
keywords = ['cristina gomez', 'Andalusia', 'south of Spain', 'Photography Work', 'hey@abdilaasy', 'abdilaasy.com', 'Bekasi, Indonesia']
for route, page in d['cache'].items():
    html = page.get('html', '')
    for kw in keywords:
        idx = html.lower().find(kw.lower())
        if idx >= 0:
            print(f'[{route}] => {repr(kw)}')
            print(f'  ...{html[max(0,idx-20):idx+100]}...')
