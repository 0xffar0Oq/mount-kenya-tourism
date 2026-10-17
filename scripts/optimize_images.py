#!/usr/bin/env python3
"""Re-encode gallery/camping WebP images and generate thumbnails.

- Full images capped to MAX_EDGE, re-encoded at FULL_Q  (replaces the file).
- Thumbnails (MAX_EDGE_THUMB, THUMB_Q) written alongside as "<name>-thumb.webp".
- Idempotent-ish: skips files whose full variant is already small enough and
  whose thumb already exists, unless --force is passed.

Usage:  python3 scripts/optimize_images.py [--force]
"""
from __future__ import annotations
import argparse
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = [
    os.path.join(ROOT, "assets", "images", "gallery"),
    os.path.join(ROOT, "assets", "images", "camping"),
]
MAX_EDGE = 1600
FULL_Q = 74
MAX_EDGE_THUMB = 640
THUMB_Q = 64
FULL_BUDGET = 180 * 1024  # bytes; skip re-encode if already under


def scaled_to(im: Image.Image, max_edge: int) -> Image.Image:
    w, h = im.size
    m = max(w, h)
    if m <= max_edge:
        return im
    r = max_edge / m
    return im.resize((max(1, round(w * r)), max(1, round(h * r))), Image.LANCZOS)


def thumb_path(full: str) -> str:
    base, _ = os.path.splitext(full)
    return base + "-thumb.webp"


def process(full: str, force: bool, thumbs_only: bool) -> tuple[int, int, int, int]:
    before = os.path.getsize(full)
    tp = thumb_path(full)
    need_full = (force and not thumbs_only) or (not thumbs_only and before > FULL_BUDGET)
    need_thumb = force or not os.path.exists(tp)
    if not need_full and not need_thumb:
        return before, before, (os.path.getsize(tp) if os.path.exists(tp) else 0), 0

    with Image.open(full) as src:
        src.load()
        im = src.convert("RGB") if src.mode not in ("RGB", "RGBA") else src
        if need_full:
            im2 = scaled_to(im, MAX_EDGE)
            im2.save(full, "WEBP", quality=FULL_Q, method=5)
        if need_thumb:
            th = scaled_to(im, MAX_EDGE_THUMB)
            th.save(tp, "WEBP", quality=THUMB_Q, method=5)

    after = os.path.getsize(full)
    tsize = os.path.getsize(tp) if os.path.exists(tp) else 0
    return before, after, tsize, (before - after)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--thumbs-only", action="store_true")
    args = ap.parse_args()

    tot_before = tot_after = tot_thumb = 0
    n = 0
    for d in DIRS:
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if not name.endswith(".webp") or name.endswith("-thumb.webp"):
                continue
            f = os.path.join(d, name)
            b, a, t, saved = process(f, args.force, args.thumbs_only)
            tot_before += b
            tot_after += a
            tot_thumb += t
            n += 1
            if saved > 20 * 1024:
                print(f"  {b//1024:>4}KB -> {a//1024:>4}KB (+thumb {t//1024}KB)  {name[:56]}")

    print(f"\nProcessed {n} images")
    print(f"  full: {tot_before/1e6:.1f}MB -> {tot_after/1e6:.1f}MB")
    print(f"  thumbs added: {tot_thumb/1e6:.1f}MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
