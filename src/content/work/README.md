# Work (CMS)

One JSON file = one demo on `/work`. The file name becomes its link: `dmv-overlay-endcard.json` → `/work#dmv-overlay-endcard`.

## Add a demo
1. Copy `_template.json.example` to `<slug>.json` (lowercase, dashes).
2. Put its images in `public/work/<slug>/` and list them in `thumbnails` (first one is the card cover; 2+ images make the card a slider).
3. Set `demo`:
   - `video` – MP4 on your ad-server CDN (or `/work/<slug>/demo.mp4`). Set `"audio": true` if it has sound (starts muted, sound button shown).
   - `html5` – unzip the banner into `public/work/<slug>/` and point `src` to its `index.html`; set `width`/`height` (e.g. 300 × 250).
   - `url` – an ad-server test URL. Shown in the popup if the server allows embedding, with an "Open live demo" button either way.
   - `image` – a static JPG/PNG.
4. Leave `"draft": true` until the demo is ready — drafts only show in `npm run dev`.

Filters (Ad Type, Platform, Industry, Features, Technology, Device, Ad Size) are built automatically from these fields.
Quick Picks use `adType`: "Interactive Ads", "Video Ads", "Rich Media Ads", "Gamified Ads".

## Sample demos
Files named `sample-*.json` (media in `public/work/samples/`) are fake brands made to preview the page. They are drafts, so they only show in `npm run dev`.
Delete them (both the JSON files and `public/work/samples/`) once Chris's real demos are in.
