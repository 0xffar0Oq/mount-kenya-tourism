#!/usr/bin/env python3
"""Regenerate minified CSS/JS with esbuild. Run after editing sources.

Edits go in css/styles.css, css/fonts.css, js/{main,site,payments}.js; the
site loads the .min.* files. This script rebuilds them.

Usage: python3 scripts/minify.py
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JOBS = [
    ("css/styles.css", "css/styles.min.css"),
    ("css/fonts.css", "css/fonts.min.css"),
    ("js/main.js", "js/main.min.js"),
    ("js/site.js", "js/site.min.js"),
    ("js/payments.js", "js/payments.min.js"),
]


def find_esbuild() -> list[str]:
    local = shutil.which("esbuild")
    if local:
        return [local]
    npx = shutil.which("npx")
    if npx:
        return [npx, "--yes", "esbuild"]
    sys.exit("esbuild not found (install it or use npx)")


def main() -> int:
    cmd = find_esbuild()
    for src, out in JOBS:
        subprocess.run(cmd + [src, "--minify", "--outfile=" + out], cwd=ROOT, check=True)
        a = os.path.getsize(os.path.join(ROOT, src))
        b = os.path.getsize(os.path.join(ROOT, out))
        print(f"  {src}  {a//1024}KB -> {out}  {b//1024}KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
