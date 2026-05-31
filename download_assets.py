import os
import urllib.request

os.makedirs("media", exist_ok=True)

preloader_images = [
    "https://cristinagomezruiz.com/media/0.webp",
    "https://cristinagomezruiz.com/media/1.webp",
    "https://cristinagomezruiz.com/media/2.webp",
    "https://cristinagomezruiz.com/media/3.webp",
    "https://cristinagomezruiz.com/media/4.webp",
    "https://cristinagomezruiz.com/media/5.webp"
]

print("Downloading preloader images...")
for i, url in enumerate(preloader_images):
    try:
        dest = f"media/{i}.webp"
        print(f"  Downloading {url} -> {dest}")
        urllib.request.urlretrieve(url, dest)
    except Exception as e:
        print(f"  Error downloading {url}: {e}")

print("Preloader images download finished!")
