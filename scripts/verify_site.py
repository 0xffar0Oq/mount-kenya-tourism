import os
import re
import json
import xml.etree.ElementTree as ET

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
errors = []

print(f"=== Verifying Mount Kenya Tourism Site in {BASE_DIR} ===")

# 1. Verify files exist
required_files = [
    "index.html",
    "css/styles.css",
    "js/main.js",
    "robots.txt",
    "sitemap.xml",
    "assets/images/hero-peaks.jpg",
    "assets/images/the-temple.jpg",
    "assets/images/gorges-valley.jpg",
    "assets/images/giant-groundsels.jpg",
    "assets/images/senecio-flora.jpg",
    "assets/images/mintos-highland.jpg"
]

for rf in required_files:
    full_path = os.path.join(BASE_DIR, rf)
    if not os.path.exists(full_path):
        errors.append(f"Missing required file: {rf}")
    else:
        sz = os.path.getsize(full_path)
        if sz == 0:
            errors.append(f"Empty file: {rf}")
        else:
            print(f"  [OK] File exists ({sz/1024:.1f} KB): {rf}")

# 2. Verify JSON-LD in index.html
index_path = os.path.join(BASE_DIR, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    html_content = f.read()

json_ld_matches = re.findall(r'<script\s+type="application/ld\+json">([\s\S]*?)</script>', html_content)
if not json_ld_matches:
    errors.append("No JSON-LD structured data block found in index.html")
else:
    for i, jld in enumerate(json_ld_matches):
        try:
            data = json.loads(jld.strip())
            types = [item.get("@type") for item in data.get("@graph", [])]
            print(f"  [OK] JSON-LD block #{i+1} valid! Types found: {types}")
            for expected_type in ["Mountain", "FAQPage", "TouristInformationCenter", "BreadcrumbList"]:
                if expected_type not in types:
                    errors.append(f"Expected Schema.org type '{expected_type}' missing in JSON-LD")
        except Exception as e:
            errors.append(f"Invalid JSON in JSON-LD block #{i+1}: {e}")

# 3. Verify sitemap.xml
sitemap_path = os.path.join(BASE_DIR, "sitemap.xml")
try:
    tree = ET.parse(sitemap_path)
    root = tree.getroot()
    urls = root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url")
    print(f"  [OK] Sitemap XML parsed successfully. Found {len(urls)} URL entry.")
except Exception as e:
    errors.append(f"Sitemap XML parsing error: {e}")

# 4. Check for broken internal image links in HTML
img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html_content)
for src in img_srcs:
    if src.startswith("http") or src.startswith("//") or not src:
        continue
    img_full = os.path.join(BASE_DIR, src)
    if not os.path.exists(img_full):
        errors.append(f"Broken image reference in index.html: {src}")
    else:
        print(f"  [OK] Valid image reference: {src}")

# 5. Check SEO meta tags
for tag in ['<title>', '<meta name="description"', '<link rel="canonical"', '<meta property="og:title"', '<meta name="twitter:card"']:
    if tag.lower() not in html_content.lower():
        errors.append(f"Missing SEO tag in index.html: {tag}")
    else:
        print(f"  [OK] SEO tag verified: {tag}")

print("\n=== Validation Summary ===")
if errors:
    print(f"FAILED with {len(errors)} errors:")
    for err in errors:
        print(f"  - {err}")
    exit(1)
else:
    print("ALL CHECKS PASSED PERFECTLY! 100% Validated.")
