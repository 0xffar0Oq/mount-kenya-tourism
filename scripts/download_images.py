import os
import time
import urllib.request
import urllib.error

IMAGES = {
    "hero-peaks.jpg": "https://upload.wikimedia.org/wikipedia/commons/e/e6/Mount_Kenya_Lenana_Nelion_Batian.jpg",
    "the-temple.jpg": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Mt_kenya_the_temple.jpg",
    "gorges-valley.jpg": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Mt_kenya_gorges_valley_chogoria_route.jpg",
    "giant-groundsels.jpg": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Dendrosenecio_keniodendron_mtkenya_landscape_2.jpg",
    "senecio-flora.jpg": "https://upload.wikimedia.org/wikipedia/commons/6/62/Senecio_battiscombei.jpg",
    "mintos-highland.jpg": "https://upload.wikimedia.org/wikipedia/commons/9/9b/Giant_Groundsels_%28Dendrosenecio_keniodendron%29%2C_Mount_Kenya_%2822220742114%29.jpg",
}

target_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
os.makedirs(target_dir, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}

for filename, url in IMAGES.items():
    filepath = os.path.join(target_dir, filename)
    if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
        print(f"Already downloaded: {filename} ({os.path.getsize(filepath)/1024:.1f} KB)")
        continue
    
    print(f"Waiting 3s before downloading {filename}...")
    time.sleep(3)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response, open(filepath, "wb") as out_file:
            data = response.read()
            out_file.write(data)
            size_kb = len(data) / 1024
            print(f"  -> SUCCESS: {filename} ({size_kb:.1f} KB)")
    except Exception as e:
        print(f"  -> ERROR downloading {filename}: {e}")

print("Checking downloaded files:")
for f in os.listdir(target_dir):
    p = os.path.join(target_dir, f)
    print(f"  - {f}: {os.path.getsize(p)/1024:.1f} KB")
