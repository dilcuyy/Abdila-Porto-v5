import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('data.json', encoding='utf-8'))
html = d['cache']['/']['html']
# find full SVG element
idx = html.find('<svg id="f0-ic"')
end = html.find('</svg>', idx) + 6
print(f"SVG starts at: {idx}")
print(f"SVG ends at: {end}")
print(f"SVG length: {end - idx} chars")
print("---")
print(html[idx:idx+100])
print("...")
print(html[end-50:end+100])
