#!/usr/bin/env python3
"""Fetch ~100 CC-licensed Mount Kenya photos from Wikimedia Commons.

Downloads 1600px thumbs via the Commons API, re-encodes them as WebP
for the site, and writes a manifest consumed by the gallery/parallax reel.
"""

import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

import requests
from PIL import Image, ImageOps

API = "https://commons.wikimedia.org/w/api.php"
UA = "MountKenyaTourismSite/1.0 (static site build; contact via repo)"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "gallery")
MANIFEST = os.path.join(OUT_DIR, "manifest.json")
TARGET = 100
MAX_WEBP_KB = 220

CATEGORIES = [
    "Category:Mount Kenya",
    "Category:Mount Kenya National Park",
    "Category:Mount Kenya National Park and Resource Forest",
    "Category:Flora of Mount Kenya",
    "Category:Lake Michaelson",
    "Category:Lake Alice (Kenya)",
    "Category:Glaciers of Mount Kenya",
    "Category:Dendrosenecio",
    "Category:Sirimon Route",
    "Category:Chogoria",
    "Category:Mount Kenya extinct glaciers",
    "Category:Batian",
    "Category:Nelion",
    "Category:Point Lenana",
    "Category:Shipton's Camp",
    "Category:Mackinder's Camp",
    "Category:Moorland of Mount Kenya",
    "Category:Lewis Glacier",
    "Category:Gregory Glacier",
    "Category:Views of Mount Kenya",
    "Category:Gorges Valley",
    "Category:Rivers of Mount Kenya",
]

SEARCHES = []

BAD_TITLE = re.compile(
    r"map|logo|diagram|chart|coat[_ ]of[_ ]arms|flag|locator|"
    r"survey|plate|sketch|drawing|plan\b|elevation|graph|icon|"
    r"stamp|banknote|poster|collage|montage|screenshot",
    re.I,
)

# Wildlife, other parks, historic book scans, portraits and artworks are not
# on-brand for a Mount Kenya scenic gallery.
OFF_TOPIC = re.compile(
    r"lewa|elgon|kilimanjaro|moroto|gilgil|reconnaissance|railway|"
    r"chile|patagon|torres del paine|glaciar|seno |balmaceda|perito|"
    r"moreno|fjord|calvo|pingo|ultima esperanza|"
    r"\biss\d|view of earth|satellite|skysat|copernicus|african glacier|"
    r"flickr|gopr|2du kenya109|с\.ф\.|kulyk|"
    r"ivory trader|secretary|"
    r"elephant|rhino|cheetah|giraffe|kudu|zebra|ostrich|jackal|"
    r"impala|lion|buffalo|hyena|baboon|monkey|bird|vulture|"
    r"gallen-kallela|painting|portrait|photo of|"
    r"\bgrade\b|panoramio|book|scan|188|189|190|191|192|193|194",
    re.I,
)

# Search-sourced files must belong to a specifically Mount Kenya category.
KEEP_CATEGORY = re.compile(
    r"mount kenya|batian|nelion|point lenana|lenana|"
    r"michaelson|lake alice|chogoria|sirimon|naromoru|"
    r"dendrosenecio|giant lobelia|afro-alpine|afroalpine",
    re.I,
)

headers = {"User-Agent": UA}


def api_get(params, retries=5):
    params = dict(params, format="json", formatversion="2")
    url = API + "?" + urllib.parse.urlencode(params)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                wait = 4 * (attempt + 1)
                print(f"    rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            raise


def collect_candidates():
    candidates = {}
    seen_ids = set()

    def add_pages(pages, source):
        for p in pages or []:
            title = p.get("title", "")
            pid = p.get("pageid")
            if not pid or pid in seen_ids:
                continue
            if not title.lower().startswith("file:"):
                continue
            if BAD_TITLE.search(title) or OFF_TOPIC.search(title):
                continue
            ii = (p.get("imageinfo") or [{}])[0]
            if ii.get("mime") not in ("image/jpeg", "image/png"):
                continue
            w, h = ii.get("width", 0), ii.get("height", 0)
            if w < 900 or h < 600:
                continue
            meta = ii.get("extmetadata") or {}

            def meta_val(key):
                v = (meta.get(key) or {}).get("value", "")
                return re.sub(r"<[^>]+>", "", v).strip()

            lic = meta_val("LicenseShortName")
            if not lic or "fair" in lic.lower() or "non-free" in lic.lower():
                continue
            thumb = ii.get("thumburl")
            if not thumb:
                continue
            seen_ids.add(pid)
            candidates[pid] = {
                "pageid": pid,
                "trusted": source.startswith("Category:"),
                "title": title[5:].rsplit(".", 1)[0].replace("_", " "),
                "thumb": thumb,
                "page": (ii.get("descriptionurl") or "").split("?")[0],
                "credit": meta_val("Artist") or "Wikimedia Commons contributor",
                "license": lic,
                "source": source,
            }

    for cat in CATEGORIES:
        try:
            data = api_get(
                {
                    "action": "query",
                    "generator": "categorymembers",
                    "gcmtitle": cat,
                    "gcmtype": "file",
                    "gcmlimit": "120",
                    "prop": "imageinfo",
                    "iiprop": "url|size|mime|extmetadata",
                    "iiurlwidth": "1280",
                }
            )
            add_pages((data.get("query") or {}).get("pages"), cat)
            print(f"  scanned {cat}: {len(candidates)} candidates so far")
        except Exception as e:
            print(f"  ! category {cat} failed: {e}")
        time.sleep(1.5)

    for q in SEARCHES:
        try:
            data = api_get(
                {
                    "action": "query",
                    "list": "search",
                    "srsearch": q,
                    "srnamespace": "6",
                    "srlimit": "60",
                }
            )
            titles = [p["title"] for p in (data.get("query") or {}).get("search", [])]
            if not titles:
                continue
            data = api_get(
                {
                    "action": "query",
                    "titles": "|".join(titles[:50]),
                    "prop": "imageinfo",
                    "iiprop": "url|size|mime|extmetadata",
                    "iiurlwidth": "1280",
                }
            )
            add_pages((data.get("query") or {}).get("pages"), f"search:{q}")
            print(f"  searched '{q}': {len(candidates)} candidates so far")
        except Exception as e:
            print(f"  ! search '{q}' failed: {e}")
        time.sleep(1.5)

    return list(candidates.values())


def filter_by_category(candidates):
    """Keep curated category files, and verify search-sourced files belong to
    at least one Mount Kenya related category."""
    kept = [c for c in candidates if c.get("trusted")]
    untrusted = [c for c in candidates if not c.get("trusted")]
    ids = [c["pageid"] for c in untrusted]
    cats_by_id = {}
    for i in range(0, len(ids), 20):
        batch = ids[i : i + 20]
        try:
            data = api_get(
                {
                    "action": "query",
                    "pageids": "|".join(str(x) for x in batch),
                    "prop": "categories",
                    "cllimit": "max",
                }
            )
            for p in (data.get("query") or {}).get("pages", []):
                cats_by_id[p["pageid"]] = [c["title"] for c in p.get("categories", [])]
        except Exception as e:
            print(f"  ! category check failed for batch: {e}")
        time.sleep(1.2)

    for c in untrusted:
        cats = cats_by_id.get(c["pageid"], [])
        if any(KEEP_CATEGORY.search(t) for t in cats):
            kept.append(c)
    print(
        f"  category filter: {len(candidates) - len(untrusted)} curated + "
        f"{len(kept) - (len(candidates) - len(untrusted))} verified = {len(kept)}"
    )
    return kept


def slugify(text, max_len=48):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:max_len].rstrip("-") or "photo"


def entry(c, fname):
    """Trim an internal candidate down to the public manifest shape."""
    return {
        "file": fname,
        "title": c["title"],
        "credit": c["credit"],
        "license": c["license"],
        "page": c["page"],
    }


def save_webp(img, path):
    """Save as WebP, stepping quality down until under size cap."""
    img = ImageOps.exif_transpose(img).convert("RGB")
    if img.width > 1400:
        ratio = 1400 / img.width
        img = img.resize((1400, max(1, int(img.height * ratio))), Image.LANCZOS)
    for quality in (80, 74, 68, 62, 56):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=quality, method=4)
        if buf.tell() <= MAX_WEBP_KB * 1024 or quality == 56:
            with open(path, "wb") as f:
                f.write(buf.getvalue())
            return buf.tell()
    return 0


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Collecting candidates from Wikimedia Commons...")
    candidates = collect_candidates()
    print(f"Total candidates: {len(candidates)}")
    candidates = filter_by_category(candidates)

    # Diversify: round-robin across sources so one category cannot dominate.
    by_source = {}
    for c in candidates:
        by_source.setdefault(c["source"], []).append(c)
    ordered = []
    while any(by_source.values()):
        for src in list(by_source.keys()):
            bucket = by_source[src]
            if bucket:
                ordered.append(bucket.pop(0))
        if all(not b for b in by_source.values()):
            break

    manifest = []
    session = requests.Session()
    session.headers.update({"User-Agent": UA})

    def write_manifest():
        with open(MANIFEST, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=1, ensure_ascii=False)
        return os.path.getsize(MANIFEST)

    for c in ordered:
        if len(manifest) >= TARGET:
            break
        idx = len(manifest) + 1
        fname = f"{idx:03d}-{slugify(c['title'])}.webp"
        path = os.path.join(OUT_DIR, fname)
        if os.path.exists(path) and os.path.getsize(path) > 8 * 1024:
            manifest.append(entry(c, fname))
            write_manifest()
            print(f"  = {fname} (cached)", flush=True)
            continue
        try:
            content = None
            for attempt in range(4):
                r = session.get(c["thumb"], timeout=60)
                if r.status_code == 429:
                    print(f"    download rate limited, waiting {5*(attempt+1)}s...", flush=True)
                    time.sleep(5 * (attempt + 1))
                    continue
                r.raise_for_status()
                content = r.content
                break
            if content is None:
                raise ValueError("rate limited")
            img = Image.open(io.BytesIO(content))
            size = save_webp(img, path)
            if size <= 0:
                raise ValueError("encoding failed")
            manifest.append(entry(c, fname))
            write_manifest()
            print(f"  + {fname} ({size/1024:.0f} KB)  <- {c['title'][:60]}", flush=True)
        except Exception as e:
            print(f"  ! skip {c['title'][:60]}: {e}", flush=True)
        time.sleep(0.6)

    write_manifest()
    total_mb = sum(
        os.path.getsize(os.path.join(OUT_DIR, m["file"])) for m in manifest
    ) / 1024 / 1024
    print(f"\nDone: {len(manifest)} images, {total_mb:.1f} MB total")
    print(f"Manifest: {os.path.relpath(MANIFEST)}")
    if len(manifest) < 40:
        sys.exit(1)


if __name__ == "__main__":
    main()
