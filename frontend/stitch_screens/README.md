# Stitch Screens & Prototypes: Pixel Prize Web Portal

> **Project Title:** Pixel Prize Web Portal  
> **Stitch Project ID:** `1851368840572862260`  
> **Location:** Hosted inside [`frontend/stitch_screens/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens)

This directory contains the visual mockups and complete HTML/Tailwind prototypes exported from the Google Stitch project.

---

## 1. Inventory of Downloaded Screens & Assets

| # | Screen ID | Title / Concept | Screenshot Image | HTML Code | Type |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **01** | `1737755896155215932` | Reference Image 1 | [`01_ref_image_1.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/01_ref_image_1.png) | — | Uploaded Design Reference |
| **02** | `1737755896155213986` | Reference Image 2 | [`02_ref_image_2.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/02_ref_image_2.png) | — | Uploaded Design Reference |
| **03** | `94e47d9069094f1eb1cc17def519d74d` | Fine-Art Portrait: Artisan in Moody Studio | [`03_portrait_artisan.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/03_portrait_artisan.png) | — | Category Asset (`PORTRAIT`) |
| **04** | `06a08d1f2e4c4604a904a6b18161d1ea` | Milky Way Astro over Patagonia Peaks | [`04_milky_way_astro.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/04_milky_way_astro.png) | — | Category Asset (`NIGHT` / `LANDSCAPE`) |
| **05** | `484e164e5d914618b6f0688af68ec989` | Snow Leopard on Himalayan Ridge | [`05_snow_leopard_wildlife.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/05_snow_leopard_wildlife.png) | — | Category Asset (`WILDLIFE`) |
| **06** | `2faa35055ec84d44b7c0f21ae42ebaee` | Dew Drops on Spider Web Macro | [`06_dew_spider_web_macro.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/06_dew_spider_web_macro.png) | — | Category Asset (`MACRO`) |
| **07** | `96929aecded147b89a74647fa853ac93` | PIXEL PRIZE – The Photo Hall (Desktop) | [`07_pixel_prize_desktop.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/07_pixel_prize_desktop.png) | [`07_pixel_prize_desktop.html`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/07_pixel_prize_desktop.html) | Full Desktop UI Prototype |
| **08** | `0cdac67c0bf648da8f2e113176262885` | PIXEL PRIZE – The Photo Hall (Mobile) | [`08_pixel_prize_mobile.png`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/08_pixel_prize_mobile.png) | [`08_pixel_prize_mobile.html`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/08_pixel_prize_mobile.html) | Responsive Mobile UI Prototype |

---

## 2. Key Design Tokens Extracted from Stitch Prototypes

The HTML prototypes in [`07_pixel_prize_desktop.html`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/07_pixel_prize_desktop.html) and [`08_pixel_prize_mobile.html`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/08_pixel_prize_mobile.html) introduce a distinct, high-impact aesthetic:

* **Theme Direction:** Darkroom with retro-futuristic telemetry overlays and technical grid lines (`grid-bg`).
* **Typography:**
  - `Pixelify Sans` (`font-pixel`): Hero brand wordmark.
  - `Space Grotesk` (`font-headline-*`): Expressive headlines and score readouts (`44px`, tracking `-0.05em`).
  - `JetBrains Mono` (`font-body-*`): Clean, monospace body text and technical specifications.
  - `Space Mono` (`font-label-telemetry`): Live telemetry tickers, status tags (`10px`, uppercase, tracking `0.14em`).
* **Color Palette Highlights:**
  - `surface-container-lowest`: `#0d0e0d` (Deepest canvas)
  - `background`: `#131413` (Base dark surface)
  - `primary-container`: `#aff755` / `#94da3a` (High-visibility electric lime telemetry accent)
  - `surface-container-high`: `#292a29` (Card backgrounds)
  - `on-surface-variant`: `#c1cab1` (Muted labels and EXIF data)

---

## 3. How to Use in the Next.js Frontend

When building components in `frontend/src/`:
1. Use the HTML structure from [`07_pixel_prize_desktop.html`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/07_pixel_prize_desktop.html) as the component layout reference for the Hall/Gallery and Leaderboard.
2. Incorporate the telemetry bar (`SYS::STREAMING`, `JURY SPEED: 0.82S`) and genre filter buttons (`[ALL]`, `[LANDSCAPE]`, `[STREET]`, `[PORTRAIT]`, `[WILDLIFE]`, etc.).
3. Use the generated category images (`03_portrait_artisan.png`, `04_milky_way_astro.png`, `05_snow_leopard_wildlife.png`, `06_dew_spider_web_macro.png`) as realistic competition mock assets in `frontend/public/images/`.
