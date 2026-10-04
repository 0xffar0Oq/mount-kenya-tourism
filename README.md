# Mount Kenya Expeditions & Ecotourism Website

A modern, responsive, and fully SEO-optimized static website for Mount Kenya expeditions, ecotourism, and trekking.

---

## 🚀 How to Host for Free on GitHub Pages

You can publish this website live on the web for free in under 2 minutes:

### Method 1: Using GitHub Web Interface (Drag & Drop)
1. Go to [github.com](https://github.com) and create a **New Repository** (e.g., `mount-kenya-tourism`).
2. Make sure the repository visibility is set to **Public**.
3. Unzip `mount-kenya-github-pages.zip` on your computer.
4. Click **"uploading an existing file"** on your GitHub repository page.
5. Drag and drop all the unzipped files and folders (`index.html`, `css/`, `js/`, `assets/`, `.nojekyll`, `sitemap.xml`, `robots.txt`) into GitHub.
6. Commit the files.
7. Go to **Settings** > **Pages** (in the left sidebar).
8. Under **Build and deployment** > **Branch**:
   - Source: `Deploy from a branch`
   - Branch: `main` (or `master`), Folder: `/ (root)`
   - Click **Save**.
9. Your site will be live at: `https://<your-username>.github.io/<repository-name>/`!

---

### Method 2: Using Git CLI
```bash
# Inside the unzipped directory:
git init
git add .
git commit -m "Initial commit for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```
Then enable GitHub Pages under **Settings** > **Pages** > **Deploy from a branch** (`main` / `/ (root)`).

---

## 📂 Project Structure

```
├── index.html              # Main website entry point
├── .nojekyll               # Disables Jekyll processing on GitHub Pages
├── sitemap.xml             # XML sitemap for Google Search Console
├── robots.txt              # Search engine crawler directives
├── css/
│   └── styles.css          # Vanilla CSS design system (dark alpine theme)
├── js/
│   └── main.js             # Vanilla JS interactive engine (Map, routes, calculator, checklist)
└── assets/
    └── images/             # High-resolution Mount Kenya photography
        ├── hero-peaks.jpg
        ├── the-temple.jpg
        ├── gorges-valley.jpg
        ├── giant-groundsels.jpg
        ├── senecio-flora.jpg
        └── mintos-highland.jpg
```

---

## ✨ Features Included
- **Interactive Topographic Mountain Map:** SVG relief contours, zoom/pan controls, route highlight animations, and waypoint telemetry (altitude, oxygen saturation).
- **Ambient Elevation Canvas:** Responsive 60fps contour wave interaction in hero backdrop.
- **Route Explorer:** Dynamic trail profiles for Sirimon, Chogoria, Naromoru, and Burguret.
- **Expedition Cost Estimator:** Real-time pricing calculator for USD & KES.
- **Climber's Gear Checklist:** Interactive packing readiness tracker with local storage persistence.
- **12-Month Climate Advisor:** Seasonal rainfall and temperature guide.
- **Fullscreen Lightbox Gallery:** High-resolution photography with keyboard navigation.
- **SEO Ready:** Schema.org JSON-LD structured data (`Mountain`, `FAQPage`, `TouristInformationCenter`), Open Graph, and Twitter Cards.

---

## 📷 Photography Credits
Images sourced under Creative Commons from Wikimedia Commons contributors:
- Franco Pecchio (CC BY 2.0)
- Mehmet Karatay (CC BY-SA 2.5)
- Dwergenpaartje (CC BY-SA 4.0)
- Ray in Manila (CC BY 2.0)
