// Content collections. Each Work item is one JSON file in src/content/work/ (file name = URL slug).
// Add a demo: copy src/content/work/_template.json.example, rename it, fill it in. See src/content/work/README.md.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/[^_]*.json', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),                       // card + popup heading, e.g. "DMV – Overlay + Endcard"
    client: z.string().optional(),          // brand name shown in the popup
    summary: z.string(),                     // 1–2 lines on the card
    description: z.string().optional(),      // longer text in the popup (falls back to summary)
    device: z.enum(['Mobile', 'Desktop', 'Tablet', 'CTV']), // pill on the card + device frame in the popup
    adType: z.array(z.string()).default([]),     // e.g. ["Interactive Ads", "Video Ads"] (also drives Quick Picks)
    platform: z.array(z.string()).default([]),   // e.g. ["CTV", "Mobile Web"]
    industry: z.array(z.string()).default([]),   // e.g. ["Healthcare"]
    features: z.array(z.string()).default([]),   // e.g. ["Overlay", "Endcard"]
    technology: z.array(z.string()).default([]), // e.g. ["HTML5", "VAST"]
    adSize: z.array(z.string()).default([]),     // e.g. ["300x250", "1920x1080"]
    tags: z.array(z.string()).default([]),       // small labels along the bottom of the card
    thumbnails: z.array(z.string()).default([]), // 1+ images in /public, e.g. "/work/dmv/thumb-1.jpg"
    demo: z
      .object({
        type: z.enum(['video', 'html5', 'url', 'image']),
        src: z.string(),                    // video file/CDN URL, /work/<slug>/index.html, ad-server test URL, or image
        poster: z.string().optional(),      // video poster image
        width: z.number().optional(),       // native size of an HTML5 banner / iframe (e.g. 300 x 250)
        height: z.number().optional(),
        audio: z.boolean().default(false),  // video has sound → show the sound button
      })
      .optional(),
    date: z.coerce.date(),                   // used by "Sort By: Newest"
    draft: z.boolean().default(false),       // true = only visible in `npm run dev`, never on the live site
  }),
});

export const collections = { work };
