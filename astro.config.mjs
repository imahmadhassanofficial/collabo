import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Change to the live domain before deploying (used for canonical + og:image URLs).
  site: 'https://collabollc.com',
  // Pages stay static; only /api/* routes (chat + lead) run as serverless functions.
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],
  // Keep markup as close to the Webflow output as possible.
  compressHTML: false,
});
