import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('data.json', encoding='utf-8') as f:
    d = json.load(f)

replacements = [
    # Text content inside HTML
    ("an independent photographer based in Andalusia, nestled in the captivating south of Spain, who believes that photography is the ultimate form of self-expression.",
     "an independent photographer based in Bekasi, Indonesia, who believes that photography is the ultimate form of self-expression."),
    
    ("It's a time where improvisation reigns, allowing me to surrender to the moment and embrace all the elements that surround me. While organization is key in my life, photography offers me freedom to escape into a different world for a few hours.",
     "I capture moments that feel real — raw, honest, and full of life. Whether it's the streets of a city or the stillness of a quiet afternoon, I believe every frame tells a story worth keeping."),

    # Alt text for images
    ('alt="Photography Work"', 'alt="Abdila Asy Photography"'),

    # Email references (already abdila, just ensure correct)
    # Contact text
    ("I'm always excited to discuss new projects and collaboration opportunities. Feel free to reach out and let's capture some beautiful moments together.",
     "I'm always excited to discuss new projects and collaboration opportunities. Feel free to reach out and let's capture some beautiful moments together."),
]

total_changes = 0
for route, page in d['cache'].items():
    html = page.get('html', '')
    original = html
    for old, new in replacements:
        html = html.replace(old, new)
    if html != original:
        d['cache'][route]['html'] = html
        count = sum(original.count(old) for old, new in replacements)
        print(f"Updated: {route}")
        total_changes += 1

print(f"\nTotal pages updated: {total_changes}")

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, separators=(',', ':'))

print("data.json saved successfully.")
