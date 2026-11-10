// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

/**
 * Without STRAPI_URL the site uses the bundled demo content (src/lib/demo-content.ts). Its images live in
 * strapi/seed/media (the same files the Strapi seeder uploads): this integration serves them at /demo-media/ in dev
 * and copies them into the build output.
 * @returns {import('astro').AstroIntegration}
 */
function demoMedia() {
  const mediaDir = fileURLToPath(new URL('./strapi/seed/media/', import.meta.url));
  const enabled = !env.STRAPI_URL;
  const types = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif' };
  return {
    name: 'demo-media',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        if (!enabled) return;
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'demo-media-dev-server',
                configureServer(server) {
                  server.middlewares.use('/demo-media', (req, res, next) => {
                    const file = path.join(mediaDir, decodeURIComponent((req.url || '').split('?')[0]));
                    if (!file.startsWith(mediaDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
                    res.setHeader('Content-Type', types[/** @type {keyof typeof types} */ (path.extname(file).toLowerCase())] || 'application/octet-stream');
                    fs.createReadStream(file).pipe(res);
                  });
                },
              },
            ],
          },
        });
      },
      'astro:build:done': ({ dir, logger }) => {
        if (!enabled) return;
        const out = fileURLToPath(new URL('./demo-media/', dir));
        fs.cpSync(mediaDir, out, { recursive: true });
        logger.info('No STRAPI_URL set: built with the bundled demo content (strapi/seed).');
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs, Open Graph URLs and the sitemap. Set SITE_URL in .env / your host.
  site: env.SITE_URL || 'https://example.com',
  trailingSlash: 'ignore',
  // The 404 page is left out of the sitemap.
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(new URL(page).pathname) }), demoMedia()],
  // Keep the original stylesheets as separate files rather than inlining them.
  build: { inlineStylesheets: 'never' },
  vite: {
    // The Strapi project lives in ./strapi with its own dependencies; keep Vite away from it.
    server: { watch: { ignored: ['**/strapi/**'] } },
    // Hex hashes keep asset names like `/_astro/BaseLayout.3f2a9c1d.css`.
    build: { rollupOptions: { output: { hashCharacters: 'hex' } } },
  },
});
