import os
import zipfile

SOURCE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_ZIP = os.path.abspath(os.path.join(SOURCE_DIR, "..", "mount-kenya-preview.zip"))

# Directories that should never ship in the deploy bundle.
SKIP_DIRS = {".git", "scripts", "__pycache__", "node_modules"}

print(f"Creating static deploy bundle: {OUTPUT_ZIP}")
count = 0
with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(SOURCE_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            full = os.path.join(root, name)
            rel = os.path.relpath(full, SOURCE_DIR)
            zipf.write(full, arcname=rel)
            count += 1

zip_size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
print(f"Bundled {count} files -> {OUTPUT_ZIP} ({zip_size_mb:.2f} MB)")
