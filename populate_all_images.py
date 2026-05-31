import json
import re

print("Loading data.json...")
with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

gl_data = data["data"]["gl"]
cache = data["cache"]

# Let's restore the data.json cache HTML to clean blank ones first!
# We can do this by reloading the original cached layouts from our backup or from a fresh parse.
# Wait! In customize_data.py we customized data.json.
# Let's write a python script that will read data.json and, for any img tag inside a _me or _pme, remove it,
# so we can re-populate cleanly!
# That is extremely safe and ensures a perfect clean slate!

def clean_placeholders(html):
    # We want to replace <div class="_me" ...><img ...></div> back with <div class="_me" ...></div>
    # Pattern: (<(div|a|span) [^>]*class="[^"]*(_me|_pme)[^"]*"[^>]*)>.*?</\2>
    # We replace it with \1></\2>
    pattern = re.compile(r'(<([a-zA-Z0-9]+)\s+[^>]*class="[^"]*(_me|_pme)[^"]*"[^>]*)>.*?</\2>')
    
    # We repeatedly apply it to strip any existing img tags
    # Wait, we want to keep aspect-ratio styling!
    # Yes, the match group 1 contains the entire start tag including style aspect-ratio!
    return pattern.sub(r'\1></\2>', html)

# Let's populate cleanly
def populate_route_images(route, html):
    if route not in gl_data:
        return html
    
    # Clean it first to guarantee perfect clean slate!
    html = clean_placeholders(html)
    
    tex = gl_data[route].get("tex", {})
    store = tex.get("store", {})
    
    main_urls = []
    for item_list in store.get("main", []):
        for item in item_list:
            if "url" in item:
                main_urls.append(item["url"])
                
    footer_urls = []
    for item_list in store.get("footer", []):
        for item in item_list:
            if "url" in item:
                footer_urls.append(item["url"])
                
    if len(main_urls) == 0:
        return html
        
    print(f"Route {route}: found {len(main_urls)} main URLs, {len(footer_urls)} footer URLs.")
    
    # We will use modulo to reuse the main_urls!
    main_idx = 0
    
    def replace_placeholder(match):
        nonlocal main_idx
        tag_start = match.group(1) # e.g. '<div class="_me" style="aspect-ratio: ..."'
        tag_name = match.group(2)  # e.g. 'div'
        
        # Use modulo to wrap around!
        url = main_urls[main_idx % len(main_urls)]
        main_idx += 1
        
        img_tag = f'<img src="{url}" alt="Photography Work" style="width:100%; height:100%; object-fit:cover;">'
        return f'{tag_start}>{img_tag}</{tag_name}>'
    
    pattern = re.compile(r'(<([a-zA-Z0-9]+)\s+[^>]*class="[^"]*(_me|_pme)[^"]*"[^>]*)>\s*</\2>')
    html = pattern.sub(replace_placeholder, html)
    
    # Replace footer-me
    if '<div id="f0-me"></div>' in html and len(footer_urls) > 0:
        url = footer_urls[0]
        img_tag = f'<img src="{url}" alt="Footer CTA" style="width:100%; height:100%; object-fit:cover;">'
        html = html.replace('<div id="f0-me"></div>', f'<div id="f0-me">{img_tag}</div>')
        
    return html

# Populate images for all routes in cache
for route in cache.keys():
    print(f"Populating route: {route}")
    cache[route]["html"] = populate_route_images(route, cache[route]["html"])

# Save updated json
print("Saving populated data.json...")
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Images population completed successfully!")
