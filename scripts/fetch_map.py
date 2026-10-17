"""Download Mount Kenya satellite imagery (Esri World Imagery) and stitch a map.

Tiles: Esri "World_Imagery" MapServer (satellite). Attribution required:
    Esri, Maxar, Earthstar Geographics, and the GIS User Community
"""
import math
import os
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

Z = 13
# Mount Kenya massif bounding box
LAT_MIN, LAT_MAX = -0.35, 0.10
LON_MIN, LON_MAX = 37.10, 37.60

TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
HEADERS = {"User-Agent": "Mozilla/5.0 (mount-kenya-tourism build)"}

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "assets", "images")
CACHE_DIR = os.path.join(ROOT, "scripts", ".tile-cache")
OUT_JPG = os.path.join(OUT_DIR, "map-satellite.jpg")


def deg2num(lat, lon, z):
    n = 2 ** z
    xt = int((lon + 180.0) / 360.0 * n)
    yt = int((1.0 - math.log(math.tan(math.radians(lat)) + 1.0 / math.cos(math.radians(lat))) / math.pi) / 2.0 * n)
    return xt, yt


def fetch_tile(z, x, y, attempts=5):
    path = os.path.join(CACHE_DIR, f"{z}_{x}_{y}.jpg")
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return path
    url = TILE_URL.format(z=z, x=x, y=y)
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            if data[:2] == b"\xff\xd8":
                with open(path, "wb") as fh:
                    fh.write(data)
                return path
        except Exception as exc:  # noqa: BLE001
            wait = 1.5 * (i + 1)
            print(f"  retry {x},{y} ({exc}) in {wait:.1f}s")
            time.sleep(wait)
    return None


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)

    x0, y0 = deg2num(LAT_MAX, LON_MIN, Z)
    x1, y1 = deg2num(LAT_MIN, LON_MAX, Z)
    xs = range(x0, x1 + 1)
    ys = range(y0, y1 + 1)
    coords = [(x, y) for y in ys for x in xs]
    print(f"z={Z}: {len(coords)} tiles -> {(len(list(xs)) * 256)}x{(len(list(ys)) * 256)}px")

    ok = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        for res in pool.map(lambda c: (c, fetch_tile(Z, *c)), coords):
            if res[1]:
                ok.append(res)
    print(f"downloaded {len(ok)}/{len(coords)} tiles")

    w = len(list(xs)) * 256
    h = len(list(ys)) * 256
    canvas = Image.new("RGB", (w, h))
    for (x, y), path in ok:
        canvas.paste(Image.open(path).convert("RGB"), ((x - x0) * 256, (y - y0) * 256))

    canvas.save(OUT_JPG, "JPEG", quality=86, optimize=True)
    print(f"wrote {OUT_JPG} ({w}x{h}, {os.path.getsize(OUT_JPG) / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
