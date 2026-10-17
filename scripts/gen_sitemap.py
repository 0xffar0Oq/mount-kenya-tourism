#!/usr/bin/env python3
"""Regenerate sitemap.xml with an image sitemap for every archive photo.

Reads the gallery + camping manifests and emits one <image:image> per photo
(plus the curated hero/route shots). Run after adding photos.

Usage: python3 scripts/gen_sitemap.py
"""
from __future__ import annotations
import html
import json
import os
import re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://0xffar0oq.github.io/mount-kenya-tourism/"
MANIFESTS = [
    ("assets/images/gallery/manifest.json", "assets/images/gallery/"),
    ("assets/images/camping/manifest.json", "assets/images/camping/"),
]
CURATED = [
    ("assets/images/hero-peaks.jpg", "Mount Kenya Peaks - Batian, Nelion and Point Lenana",
     "Panoramic sunrise over Mount Kenya's highest peaks."),
    ("assets/images/the-temple.jpg", "The Temple Crag and Lake Michaelson, Chogoria Route",
     "Volcanic cliff of The Temple above glacial Lake Michaelson."),
    ("assets/images/gorges-valley.jpg", "Gorges Valley on the Chogoria Approach",
     "Vast glacial Gorges Valley along the Chogoria trail."),
    ("assets/images/giant-groundsels.jpg", "Giant Groundsels (Dendrosenecio) Afro-alpine Zone",
     "Prehistoric giant groundsels in the Afro-alpine moorland."),
    ("assets/images/senecio-flora.jpg", "Senecio battiscombei Tree Groundsel",
     "Endemic tree groundsel adapted to high UV and alpine temperatures."),
    ("assets/images/mintos-highland.jpg", "Afro-alpine Plateau near Minto's Hut",
     "High plateau dotted with giant groundsels by the tarns."),
]


def esc(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s or "")
    return html.escape(s.strip(), quote=True)


def clean_title(t: str) -> str:
    t = re.sub(r"<[^>]+>", "", t or "").strip()
    return t[:200] if t else "Mount Kenya"


def img_block(loc: str, title: str, caption: str) -> str:
    return (
        "    <image:image>\n"
        f"      <image:loc>{esc(loc)}</image:loc>\n"
        f"      <image:title>{esc(title)}</image:title>\n"
        f"      <image:caption>{esc(caption)}</image:caption>\n"
        "    </image:image>\n"
    )


def main() -> int:
    images = []
    for path, folder in MANIFESTS:
        full = os.path.join(ROOT, path)
        if not os.path.exists(full):
            continue
        for m in json.load(open(full)):
            f = m.get("file")
            if not f:
                continue
            title = clean_title(m.get("title", ""))
            images.append((BASE + folder + f, title, title))

    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
             '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
             "  <url>",
             f"    <loc>{BASE}</loc>",
             f"    <lastmod>{date.today().isoformat()}</lastmod>",
             "    <changefreq>weekly</changefreq>",
             "    <priority>1.0</priority>"]
    for loc, title, cap in CURATED:
        parts.append(img_block(BASE + loc, title, cap).rstrip("\n"))
    for loc, title, cap in images:
        parts.append(img_block(loc, title, cap).rstrip("\n"))
    parts += ["  </url>", "</urlset>", ""]
    open(os.path.join(ROOT, "sitemap.xml"), "w").write("\n".join(parts))
    print(f"sitemap.xml: {len(CURATED)} curated + {len(images)} archive images")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
