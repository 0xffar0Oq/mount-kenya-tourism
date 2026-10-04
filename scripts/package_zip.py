import os
import zipfile

SOURCE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_ZIP = os.path.abspath(os.path.join(SOURCE_DIR, "..", "mount-kenya-github-pages.zip"))

# Files and directories to package directly for GitHub Pages root
INCLUDE_PATTERNS = [
    "index.html",
    ".nojekyll",
    "README.md",
    "sitemap.xml",
    "robots.txt",
    "css/styles.css",
    "js/main.js",
    "assets/images/hero-peaks.jpg",
    "assets/images/the-temple.jpg",
    "assets/images/gorges-valley.jpg",
    "assets/images/giant-groundsels.jpg",
    "assets/images/senecio-flora.jpg",
    "assets/images/mintos-highland.jpg"
]

print(f"Creating GitHub Pages bundle: {OUTPUT_ZIP}")
with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
    for rel_path in INCLUDE_PATTERNS:
        full_path = os.path.join(SOURCE_DIR, rel_path)
        if os.path.exists(full_path):
            zipf.write(full_path, arcname=rel_path)
            size_kb = os.path.getsize(full_path) / 1024
            print(f"  + Added: {rel_path} ({size_kb:.1f} KB)")
        else:
            print(f"  ! Warning: {rel_path} not found!")

zip_size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
print(f"\nSuccessfully generated {OUTPUT_ZIP} ({zip_size_mb:.2f} MB)")
