import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('data.json', encoding='utf-8'))
html = d['cache']['/']['html']
idx = html.find('ho-ba')
start = max(0, idx - 30)
end = idx + 500
print(html[start:end])
