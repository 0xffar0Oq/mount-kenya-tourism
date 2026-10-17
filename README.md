# Mount Kenya Expeditions & Ecotourism Website

A modern, responsive, SEO-optimised **static** website for Mount Kenya (Kirinyaga)
trekking, ecotourism and expedition planning. No build step is required to serve it —
everything is plain HTML/CSS/JS, deployable to GitHub Pages or any static host.

- **Design language:** "Alpine Field Journal × Cinematic Noir" — dark theme with
  flame-orange, acid-emerald and violet accents (Fraunces / Archivo / JetBrains Mono).
- **Real satellite backdrop:** an Esri World Imagery mosaic sits behind the page, and
  sections are translucent "clear glass" so the terrain reads through the copy.

---

## ✨ Features

- **Live satellite map backdrop:** a stitched Esri World Imagery mosaic
  (`assets/images/map-satellite.webp`) behind every section, with a light readability
  scrim and text-shadows.
- **Interactive topographic map:** full-bleed route map with zoom/pan, animated route
  highlights and waypoint telemetry (altitude, oxygen).
- **Parallax photo totems:** fixed left/right photo rails that run the whole page,
  drift with scroll/pointer, and **cycle through the archive** automatically.
- **Depth-stack photo reel:** scroll-driven 3D parallax reel flying through the archive
  (hidden for `prefers-reduced-motion` users, who keep the full grid).
- **122-photo archive:** 100 gallery + 22 camp/people photos, category-tagged
  (Summit, Routes, Flora, Tarns, **Camp Life**), lazy-loaded grid with a fullscreen
  lightbox, each still discoverable via an image sitemap.
- **Route Explorer:** dynamic trail profiles for Sirimon, Chogoria, Naromoru and Burguret.
- **Interactive Expedition Cost Estimator:** real-time USD & KES pricing with a
  multi-step checkout wizard.
- **Climber's gear checklist:** interactive readiness tracker with `localStorage`.
- **12-month climate advisor:** seasonal rainfall / temperature guidance.
- **Ambient elevation canvas:** 60fps contour-wave hero backdrop.
- **Transparent "glass" panels:** hero overlay and estimator panels are translucent
  (`backdrop-filter`) instead of solid black.
- **Performance:** responsive images (640px WebP thumbnails + `srcset`/`sizes`,
  full-res only in the lightbox), WebP throughout, self-hosted latin fonts,
  minified CSS/JS — initial transfer ~1.7 MB.
- **SEO:** Schema.org JSON-LD (`Mountain`, `NationalPark`, `FAQPage`, `TouristTrip`,
  `TravelAgency`, `BreadcrumbList`, `ItemList`, `Review`…), Open Graph, Twitter Cards,
  a 128-image XML sitemap, `robots.txt`, and a web app manifest.

---

## 📂 Project Structure

```
├── index.html                 # Single-page site
├── .nojekyll                  # Disables Jekyll on GitHub Pages
├── site.webmanifest           # PWA manifest (icons, theme colour)
├── sitemap.xml                # XML sitemap incl. 128 <image:image> entries
├── robots.txt                 # Crawler directives + sitemap reference
├── css/
│   ├── styles.css             # Source design system
│   ├── styles.min.css         # Minified (loaded by the page)
│   ├── fonts.css              # Self-hosted @font-face (latin)
│   └── fonts.min.css
├── js/
│   ├── main.js                # Map, routes, gallery/reel, calculator, lightbox, hero
│   ├── site.js                # Reveals, counters, marketing behaviours
│   ├── payments.js            # Checkout wizard / pricing engine
│   └── *.min.js               # Minified (loaded by the page)
├── assets/
│   ├── fonts/                 # 5 self-hosted WOFF2 (Archivo, Fraunces, JetBrains Mono)
│   ├── icons/                 # favicon.svg / .ico, apple-touch-icon, 192 / 512
│   └── images/
│       ├── map-satellite.webp         # Esri satellite mosaic used as the backdrop
│       ├── hero-peaks.webp/.jpg       # LCP hero + Open Graph fallback
│       ├── og-image.jpg               # 1200×630 social card
│       ├── the-temple, gorges-valley, giant-groundsels,
│       │   senecio-flora, mintos-highland (.webp/.jpg)
│       ├── topo-backdrop.svg          # (legacy) giant topographic SVG
│       ├── gallery/                   # 100 WebP + 100 -thumb + manifest.json
│       └── camping/                   # 22 WebP + 22 -thumb + manifest.json
└── scripts/                   # Maintenance tooling (see below)
```

---

## 🛠️ Scripts

| Script | Purpose |
| --- | --- |
| `scripts/fetch_gallery.py` | Fetch ~100 CC-licensed photos from Wikimedia Commons → WebP + `gallery/manifest.json` |
| `scripts/fetch_camping.py` | Fetch camp/people photos → WebP + `camping/manifest.json` |
| `scripts/fetch_map.py` | Download & stitch the Esri World Imagery satellite mosaic |
| `scripts/optimize_images.py` | Re-encode archive images and generate `-thumb.webp` variants |
| `scripts/gen_sitemap.py` | Regenerate `sitemap.xml` with an image entry per photo |
| `scripts/minify.py` | Rebuild `*.min.css` / `*.min.js` with esbuild |
| `scripts/package_zip.py` | Build a static deploy bundle (`.zip`) |
| `scripts/verify_site.py` | Validate structure, SEO tags, JSON-LD and asset paths |

### Editing workflow
Edit the **sources**, then regenerate the artifacts the page actually loads:

```bash
python3 scripts/minify.py          # after editing css/*.css or js/*.js
python3 scripts/gen_sitemap.py     # after adding/removing photos
python3 scripts/verify_site.py     # sanity-check before committing
```

The page loads `css/styles.min.css`, `css/fonts.min.css` and `js/*.min.js`, so run
`minify.py` whenever you change the unminified sources.

### Rebuilding the photo archive

```bash
python3 scripts/fetch_gallery.py     # 100 gallery photos + manifest
python3 scripts/fetch_camping.py     # 22 camping photos + manifest
python3 scripts/optimize_images.py   # re-encode + write thumbnails
python3 scripts/gen_sitemap.py       # refresh the image sitemap
```

The archive is driven entirely by `assets/images/gallery/manifest.json` and
`assets/images/camping/manifest.json`; the site degrades gracefully to the featured
set if a manifest is missing.

---

## 🚀 Deploying for Free on GitHub Pages

### Method 1 — Web interface (drag & drop)
1. Create a **Public** repository (e.g. `mount-kenya-tourism`).
2. Build the bundle with `python3 scripts/package_zip.py` and unzip it.
3. Upload all files/folders to the repo (drag & drop).
4. **Settings → Pages → Build and deployment**: Source `Deploy from a branch`,
   Branch `main`, Folder `/ (root)`, **Save**.
5. Live at `https://<username>.github.io/<repository>/`.

### Method 2 — Git CLI
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```
Then enable Pages under **Settings → Pages** (`main` / `/ (root)`).

### Custom cache headers
GitHub Pages can't set custom headers. On Cloudflare Pages / Netlify, add immutable
caching for `/assets/*` to maximise repeat-visit performance.

---

## 📷 Photography & Imagery Credits

- **Satellite imagery:** Esri, Maxar, Earthstar Geographics, and the GIS User Community
  (Esri World Imagery).
- **Photographs:** sourced under Creative Commons from Wikimedia Commons contributors —
  per-image credit and licence are stored in the `manifest.json` files
  (e.g. Franco Pecchio, Mehmet Karatay, Dwergenpaartje, Ray in Manila).
