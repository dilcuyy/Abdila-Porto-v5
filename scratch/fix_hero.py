import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('data.json', encoding='utf-8') as f:
    d = json.load(f)

OLD_HERO = "https://images.prismic.io/cristinagomez/aLXSQGGNHVfTOgJQ_2.png?auto=format,compress"
NEW_HERO = "/media/hero.jpg"

# Also fix remaining bio text to be cleaner for Abdila
OLD_BIO2 = 'I capture moments that feel real — raw, honest, and full of life. Whether it\'s the streets of a city or the stillness of a quiet afternoon, I believe every frame tells a story worth keeping.'
NEW_BIO2 = 'I capture moments that feel real — raw, honest, and full of life. Photography is my way of pausing time, exploring the world, and telling stories without words.'

changes = 0
for route, page in d['cache'].items():
    html = page.get('html', '')
    original = html

    # Replace hero image
    html = html.replace(OLD_HERO, NEW_HERO)

    # Fix alt text still saying generic phrase
    html = html.replace('alt="Abdila Asy Photography" style="width:100%; height:100%; object-fit:cover;"',
                        'alt="Abdila Asy — Portrait" style="width:100%; height:100%; object-fit:cover;"')

    if html != original:
        d['cache'][route]['html'] = html
        print(f"Updated: {route}")
        changes += 1

print(f"\nTotal updated: {changes}")

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, separators=(',', ':'))

print("data.json saved.")
