# Collabo website: notes for Claude

Astro 5 site (static pages + two Vercel API routes), rebuilt from the Webflow export. Run `npm run dev` to preview and `npm run build` to check.

## Adding or updating a Work demo (the most common job)
Read `src/content/work/README.md` first. In short:
- One demo = one JSON file in `src/content/work/<slug>.json`. Schema: `src/content.config.ts` (the build fails on a wrong field).
- Pick the demo format from what you're given:
  - an ad tag (`<div class="celtra-ad-v3">…`, `<script src=…>`) → `"type": "tag"`, paste the tag into `"tag"`, set `width`/`height` from the ad size,
    and put any platform preview link in `previewUrl`
  - a link to a hosted banner `…/index.html` → `"type": "html5"` with its size
  - a Collabo ad-server test link (`sdk.collabollc.com/servlet/testing?id=965…`) or a VAST tag → `"type": "vast"` with
    `"mid": 965` (or `"src"`: the VAST tag URL); keep the test link as `previewUrl` and add a 16:9 `poster`
  - a link to any other whole demo page → `"type": "url"`, `"frame": "browser"`, `width`/`height` = the page's size
  - an MP4 → `"type": "video"`; a JPG/PNG → `"type": "image"` (put files in `public/work/<slug>/`)
- Write `title` ("Brand – Format"), `summary` (1–2 lines), `description` (what it is and how to interact), and fill the filter
  fields from what the demo shows. Ask if the brand or year isn't clear.
- Make a 1200 × 825 cover image in `public/work/<slug>/thumb-1.jpg` (a screenshot of the ad on a dark background works well).
- New demos start with `"draft": true`. Publish by setting `false`.
- Check it at `/work` (popup) and `/work/<slug>` (full preview page).

## Where things live
- Pages: `src/pages/` (`work/[slug].astro` = full preview page). Shared layout: `src/layouts/WebflowLayout.astro`.
- Demo player (device frames, mock site for ad tags, video player): `public/js/demo-player.js`.
- Page transitions: `src/components/shared/BarbaRouter.astro` (Barba.js). Page scripts re-run after each page change.
  Inline scripts must be safe to run more than once.
- Phone styles: `src/styles/mobile.css`. SEO/schema: `src/components/seo/SiteSchema.astro`.
- Chat bot: `src/pages/api/chat.ts` + `src/lib/chat-knowledge.ts`. Forms: `src/pages/api/lead.ts` (Resend).

## Rules
- Keep the brand: dark night-sky backgrounds, Zodiak headings, Be Vietnam Pro text, coral `#ed6673` buttons, logo gradient
  `#26aeee → #5a4fe0 → #9b2ec2 → #ed6673`.
- Run `npm run build` after changes and fix any error before finishing.
