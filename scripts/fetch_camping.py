"""Download Mount Kenya camping / trekking-with-people photos (Wikimedia Commons).

Writes WebP files + a manifest into assets/images/camping/.
"""
import io
import json
import os
import time
import urllib.parse
import urllib.request

from PIL import Image

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "mount-kenya-tourism build (educational static site)"}

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "assets", "images", "camping")

# Curated camp + people-on-the-mountain files
FILES = [
    "Mount Kenya camping at met station.jpg",
    "Mount Kenya 14200ft camp.jpg",
    "Mount Kenya Mintos camp.jpg",
    "Mt kenya shiptons camp with sendeyo.jpg",
    "180 around Shipton's at Mount Kenya.jpg",
    "Kenya monte kenya da shipton.jpg",
    "Approaching Mackinders Camp.jpg",
    "Mt kenya austrian hut with nelion.jpg",
    "Mt kenya liki north hut.jpg",
    "Mintos hut.jpg",
    "Austrian hut with long drop.jpg",
    "Mount Kenya Sarfari Club.jpg",
    "Mount Kenya guides.jpg",
    "Mount Kenya trecking to the peak.jpg",
    "Mount Kenya hike.jpg",
    "Chogoria valley and climber.jpg",
    "Scaling Mt. Kenya.jpg",
    "Mt. Kenya up and candid.jpg",
    "Press listen to KWS Ranger Simon Gitau on Mount Kenya climbing tips.jpg",
    "Mount Kenya near the vertical bog.jpg",
    "200812 kenya-53 (3210409703).jpg",
    "200812 kenya-54 (3211255670).jpg",
    "Early morning view of Mt. Kenya's peaks, from an altitude of 4,290 meters (14,075 ft) (15850536024).jpg",
]

FREE = ("cc0", "cc by", "cc-by", "public domain", "pd", "attribution")


def api(params, attempts=5):
    params = {"format": "json", "formatversion": "2", **params}
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(attempts):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45) as r:
                return json.load(r)
        except Exception as exc:  # noqa: BLE001
            wait = 2 * (i + 1)
            print(f"  api retry ({exc}) in {wait}s")
            time.sleep(wait)
    return {}


def clean(text, limit=160):
    if not text:
        return ""
    import re
    text = re.sub(r"<[^>]+>", " ", str(text))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def slugify(name):
    base = os.path.splitext(name)[0].lower()
    out = []
    for ch in base:
        if ch.isalnum():
            out.append(ch)
        elif out and out[-1] != "-":
            out.append("-")
    return "".join(out).strip("-")[:72]


def save_webp(src_bytes, dest, max_w=1280, quality=80, target_kb=220):
    im = Image.open(io.BytesIO(src_bytes))
    im = im.convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    for q in range(quality, 45, -6):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=5)
        if buf.tell() <= target_kb * 1024:
            break
    with open(dest, "wb") as fh:
        fh.write(buf.getvalue())
    return len(buf.getvalue())


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = []
    for i, name in enumerate(FILES, 1):
        title = "File:" + name
        data = api({
            "action": "query", "titles": title, "prop": "imageinfo",
            "iiprop": "url|extmetadata|size", "iiurlwidth": "1280",
        })
        pages = data.get("query", {}).get("pages", [])
        if not pages or "imageinfo" not in pages[0]:
            print(f"[skip] no imageinfo: {name}")
            continue
        info = pages[0]["imageinfo"][0]
        meta = info.get("extmetadata", {})
        lic = clean(meta.get("LicenseShortName", {}).get("value", ""))
        credit = clean(meta.get("Artist", {}).get("value", "")) or "Wikimedia Commons"
        desc = clean(meta.get("ImageDescription", {}).get("value", "")) or name
        if lic and not any(f in lic.lower() for f in FREE):
            print(f"[skip] license '{lic}': {name}")
            continue
        thumb = info.get("thumburl") or info.get("url")
        try:
            with urllib.request.urlopen(urllib.request.Request(thumb, headers=UA), timeout=60) as r:
                raw = r.read()
        except Exception as exc:  # noqa: BLE001
            print(f"[skip] download failed ({exc}): {name}")
            time.sleep(1)
            continue
        fname = f"camp-{i:02d}-{slugify(name)}.webp"
        size = save_webp(raw, os.path.join(OUT_DIR, fname))
        manifest.append({
            "file": fname,
            "title": clean(desc, 90) or name,
            "credit": credit,
            "license": lic or "See source",
            "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")),
            "cat": "camp",
        })
        print(f"[ok] {fname} ({size // 1024} KB)  <- {name}")
        time.sleep(0.6)

    with open(os.path.join(OUT_DIR, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)
    print(f"\nwrote {len(manifest)} camping photos to {OUT_DIR}")


if __name__ == "__main__":
    main()
