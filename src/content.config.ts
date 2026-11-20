// Content collections. Each Work item is one JSON file in src/content/work/ (file name = URL slug).
// Add a demo: copy one of src/content/work/_template-*.json.example, rename it, fill it in. See src/content/work/README.md.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Placeholder entries from the original site (no demo, dummy text). Removed from the site; safe to delete the files.
const REMOVED = ['dignity-health.json', 'duthie-overlay-custom.json', 'kids-vaccine-overlay.json', 'self-empowered-minds-overlay.json'];

const work = defineCollection({
  // Not loaded: files starting with "_" (templates) and the old placeholder/sample entries listed in REMOVED.
  // Those files can be deleted from src/content/work/ (and public/work/samples/) — they're no longer used.
  loader: glob({ pattern: ['**/[^_]*.json', '!**/sample-*.json', ...REMOVED.map((f) => `!${f}`)], base: './src/content/work' }),
  schema: z.object({
    title: z.string(),                       // card + popup heading, e.g. "DMV – Overlay + Endcard"
    client: z.string().optional(),          // brand name shown in the popup
    summary: z.string(),                     // 1–2 lines on the card
    description: z.string().optional(),      // longer text in the popup (falls back to summary)
    device: z.enum(['Mobile', 'Desktop', 'Tablet', 'CTV']), // pill on the card + default device frame for the demo
    adType: z.array(z.string()).default([]),     // e.g. ["Interactive Ads", "Video Ads"] (also drives Quick Picks)
    platform: z.array(z.string()).default([]),   // e.g. ["CTV", "Mobile Web"]
    industry: z.array(z.string()).default([]),   // e.g. ["Healthcare"]
    features: z.array(z.string()).default([]),   // e.g. ["Overlay", "Endcard"]
    technology: z.array(z.string()).default([]), // e.g. ["HTML5", "VAST"]
    adSize: z.array(z.string()).default([]),     // e.g. ["300x250", "1920x1080"]
    tags: z.array(z.string()).default([]),       // small labels along the bottom of the card
    thumbnails: z.array(z.string()).default([]), // 1+ images in /public, e.g. "/work/dmv/thumb-1.jpg"
    // The demo in its real format. Shown live in the popup and on the full preview page /work/<slug>.
    demo: z
      .object({
        // tag   – an ad tag (Celtra, Collabo ad server, …): paste it in "tag"; shown on a mock site in phone/tablet/desktop
        // html5 – a hosted HTML5 banner: "src" = its index.html (yours in /public/work/<slug>/ or on clients.collabollc.com)
        // url   – a whole demo page (hosted demo page, ad-server test page): shown in a browser/device frame
        // video – MP4 (ad-server CDN or /work/<slug>/demo.mp4)
        // image – JPG/PNG mockup
        type: z.enum(['tag', 'html5', 'url', 'video', 'image']),
        src: z.string().optional(),         // html5 / url / video / image source
        tag: z.string().optional(),         // type "tag": the full ad tag HTML exactly as the platform gives it
        width: z.number().optional(),       // tag/html5: ad size (e.g. 300 x 600). url: the page's viewport if not the device default
        height: z.number().optional(),
        devices: z.array(z.enum(['Mobile', 'Tablet', 'Desktop'])).optional(), // tag/html5: which device previews to offer (default Mobile + Desktop)
        frame: z.enum(['device', 'browser', 'none']).optional(), // url/video/image: device bezel (from "device"), browser window, or no frame
        poster: z.string().optional(),      // video poster image
        audio: z.boolean().default(false),  // video has sound → show the sound button
        previewUrl: z.string().optional(),  // the platform's own preview link (e.g. Celtra) → "Open original preview" button
      })
      .refine((d) => (d.type === 'tag' ? !!d.tag : !!d.src), { message: 'demo needs "tag" for type tag, otherwise "src"' })
      .optional(),
    date: z.coerce.date(),                   // used by "Sort By: Newest"
    draft: z.boolean().default(false),       // true = only visible in `npm run dev`, never on the live site
  }),
});

export const collections = { work };
