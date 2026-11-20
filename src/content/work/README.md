# Work (CMS)

One JSON file = one demo. The file name is its link: `florida-lottery-scratch-interstitial.json` →
- a card on `/work` (click → popup with the live demo)
- its own full preview page `/work/florida-lottery-scratch-interstitial`

## Add a demo
1. Copy `_template.json.example` to `<slug>.json` (lowercase words with dashes, e.g. `brand-format.json`).
2. Fill in the text fields and filters (see the template).
3. Add a cover image (or two) to `public/work/<slug>/thumb-1.jpg` and list it in `thumbnails`.
   Card images are about 1200 × 825 (landscape). 2+ images make the card a slider.
4. Set `demo` with ONE of the formats below.
5. `"draft": true` keeps it out of the live site (it still shows in `npm run dev`). Set `false` to publish.

## Demo formats (`demo`)

### 1. Ad tag (Celtra, Collabo ad server, any third-party tag)
Paste the tag exactly as the platform gives it. It plays live on a sample website in a phone, tablet and desktop
(the visitor can switch), like the platform's own preview. Add the platform's preview link for the "Open original preview" button.
```json
"demo": {
  "type": "tag",
  "tag": "<div class=\"celtra-ad-v3\"> … </div>",
  "width": 300, "height": 600,
  "devices": ["Mobile", "Tablet", "Desktop"],
  "previewUrl": "https://digital-remedy.celtra.com/preview/…"
}
```
Tip: in JSON, every `"` inside the tag must be written as `\"` (Claude does this for you).

### 2. Hosted HTML5 banner (clients.collabollc.com, or a zip)
A banner's `index.html`. Either link to where it's hosted, or unzip it into `public/work/<slug>/` and use `/work/<slug>/index.html`.
Shown live on the sample website like a tag.
```json
"demo": { "type": "html5", "src": "https://clients.collabollc.com/…/index.html", "width": 300, "height": 250 }
```

### 3. Demo page / ad-server test page (a whole page)
For pages that already include their own layout or player, e.g. hosted interstitial demos or `sdk.collabollc.com/servlet/testing?id=…`.
Shown live in a browser window (`"frame": "browser"`) or a device (`"frame": "device"`, uses the card's `device`).
`width`/`height` = the page size it was built for.
```json
"demo": { "type": "url", "src": "https://sdk.collabollc.com/servlet/testing?id=965&auth=…", "frame": "browser", "width": 1280, "height": 960 }
```

### 4. Video (MP4)
On the ad-server CDN or in `public/work/<slug>/demo.mp4`. Plays muted with our player; `"audio": true` adds a sound button.
```json
"demo": { "type": "video", "src": "/work/<slug>/demo.mp4", "poster": "/work/<slug>/thumb-1.jpg", "audio": true }
```

### 5. Image (JPG/PNG mockup)
```json
"demo": { "type": "image", "src": "/work/<slug>/mockup.jpg" }
```

## Filters
Ad Type, Platform, Industry, Features, Technology, Device and Ad Size are built automatically from the fields.
Quick Picks use `adType`: "Interactive Ads", "Video Ads", "Rich Media Ads", "Gamified Ads".

## Removed demo content
The made-up `sample-*.json` demos and the old placeholder entries (dignity-health, duthie-overlay-custom, kids-vaccine-overlay,
self-empowered-minds-overlay) are no longer loaded (see `src/content.config.ts`). Their files, and `public/work/samples/`,
`public/work/dignity-health/`, can be deleted.
