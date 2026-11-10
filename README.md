# Arcline — Consulting & Advisory Astro Theme

Arcline is a polished theme for strategy firms, consultancies and independent advisors. It ships three home page
layouts, an about page, a services overview, case studies, three blog layouts, three contact layouts and dynamic
detail pages for services, case studies and articles — all driven by [Strapi](https://strapi.io) as a headless CMS.

**Live demo:** [arcline-astro-theme.vercel.app](https://arcline-astro-theme.vercel.app)

## Tech stack

- **Astro 7** — static output, no UI framework, minimal client JavaScript
- **Strapi 5** — headless CMS (blog posts + authors, case studies, services), project included in [`strapi/`](./strapi)
- **Plain CSS** — the original stylesheets in `src/styles/` (global, unscoped); add your own rules to `custom.css`
- **Interactions** — GSAP 3 (ScrollTrigger, SplitText), Lenis smooth scrolling and a small interaction runtime for
  dropdowns, tabs, sliders, Lottie and scroll animations (`public/js/`)
- `@astrojs/sitemap`, generated `robots.txt`, per-page SEO / Open Graph tags

## Pages

| Route | Description |
|---|---|
| `/`, `/home-v2`, `/home-v3` | Three home page layouts |
| `/about` | Company story, mission, approach, values, numbers, team |
| `/services` and `/service/[slug]` | Services overview and one page per service (CMS) |
| `/case-studies` and `/case-study/[slug]` | Filterable, paginated case studies and detail pages (CMS) |
| `/blog-v1`, `/blog-v2`, `/blog-v3` and `/blog/[slug]` | Three blog layouts (category tabs, pagination) and articles (CMS) |
| `/contact-v1`, `/contact-v2`, `/contact-v3` | Three contact layouts with a working form |
| `/404` | Not found page |

## Getting started

Requirements: Node.js 22.12 or newer and npm.

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:4321
```

Without `STRAPI_URL` the site builds from the **bundled demo content** (`strapi/seed/data.json` + `strapi/seed/media`),
so you can explore the theme before setting up the CMS.

| Command | Action |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check the project (`astro check`) |

## CMS setup (Strapi)

The Strapi project lives in [`strapi/`](./strapi) with its own `package.json`.

1. **Install and start Strapi**
   ```bash
   cd strapi
   npm install
   cp .env.example .env     # then replace every "tobemodified" value with a random secret
   npm run develop          # http://localhost:1337/admin — create your admin account
   ```
2. **Create tokens** in the admin panel:
   - *Settings → API Tokens*: a **Full access** token (used once for seeding uploads) and a **Read-only** token (for Astro).
   - *Settings → Admin Tokens*: an admin token with Content Manager permissions (read, create, update, publish) for
     Author, Blog Post, Case Study and Service — used by the Strapi MCP server.
3. **Seed the demo content** (optional):
   ```bash
   STRAPI_URL=http://localhost:1337 STRAPI_UPLOAD_TOKEN=<full-access token> STRAPI_MCP_TOKEN=<admin token> npm run seed
   ```
   The seeder uploads the images through the Upload API and creates, updates and publishes the entries through the
   [Strapi MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server) (`/mcp`, enabled in
   `strapi/config/server.ts`). It is idempotent: run it again to update the entries in place.
4. **Connect Astro** — in the theme's `.env`:
   ```
   STRAPI_URL=http://localhost:1337
   STRAPI_API_TOKEN=<read-only token>
   ```

### Content model

| Type | Used by | Notes |
|---|---|---|
| **Blog Post** | home pages, blog listings, `/blog/[slug]` | Category (tabs), featured flag (Blog V1 hero card), sections, stats, takeaways, tags, quote. Newest first. |
| **Author** | blog cards and articles | Name, role, avatar. Each blog post links to one author (relation). |
| **Case Study** | home pages, `/case-studies`, service pages, `/case-study/[slug]` | Filter category (tabs), result note, stats, collage, client quote. Ordered by `sortOrder`. |
| **Service** | home pages, `/services`, header menu, contact form, `/service/[slug]` | Card visuals, facts, challenges, brief card. Ordered by `sortOrder`. |

Reusable components: `shared.headline`, `shared.statement`, `shared.stat`, `shared.text-item`, `shared.titled-text`,
`shared.quote`, `shared.seo`, `service.brief`.

The site is generated statically: after publishing changes in Strapi, rebuild the site (for example with a Strapi
webhook that calls your host's deploy hook).

## Forms

The contact and newsletter forms POST JSON to `PUBLIC_FORM_ENDPOINT` (Formspree, Web3Forms, Basin, a serverless
function…) and show the original success / error messages. A hidden honeypot field filters simple spam bots. Without an
endpoint, submitting shows the error message.

## Customization

- **Brand, contact details, social links, newsletter copy:** `src/config/site.ts`
- **Header and footer menus:** `src/config/navigation.ts` (the Services dropdown lists your CMS services)
- **Pages:** `src/pages/` — each page is a list of section components from `src/components/sections/`
- **CMS cards:** `src/components/cards/` · **Buttons and forms:** `src/components/ui/`
- **Styles:** `src/styles/arcline.webflow.css` holds the design tokens (CSS custom properties at the top) and all
  component styles; put your own overrides in `src/styles/custom.css`
- **Images and fonts:** `public/images/`, `public/fonts/` (Inter Display)

See [THEME-CUSTOMIZATION.md](./THEME-CUSTOMIZATION.md) for details.

## Project structure

```
├── public/            fonts, images, videos, Lottie files (documents/), interaction scripts (js/)
├── src/
│   ├── components/
│   │   ├── global/    Header, Footer, SEO
│   │   ├── sections/  page sections (one folder per page) + Cta
│   │   ├── cards/     CMS cards (blog, case study, service)
│   │   └── ui/        Button, LinkButton, ContactForm, NewsletterForm, Pagination
│   ├── config/        site.ts, navigation.ts
│   ├── layouts/       BaseLayout.astro
│   ├── lib/           strapi.ts (REST client), cms.ts (types + queries), demo-content.ts, nav.ts
│   ├── scripts/       site.js (smooth scroll, counters, section motion), forms.ts
│   ├── styles/        normalize.css, webflow.css, arcline.webflow.css, custom.css
│   └── pages/
└── strapi/            Strapi 5 project: schemas, config, seed data + seed script
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `STRAPI_URL` | build | Strapi base URL. Empty = bundled demo content |
| `STRAPI_API_TOKEN` | build | Read-only API token (never exposed to the browser) |
| `SITE_URL` | build | Public URL for canonical links, Open Graph and the sitemap |
| `PUBLIC_FORM_ENDPOINT` | browser | Form submission endpoint |

## Credits

- Typeface: Inter Display by Rasmus Andersson (SIL Open Font License)
- Animation: [GSAP](https://gsap.com) (free under the GreenSock standard license), [Lenis](https://lenis.darkroom.engineering) (MIT)
- All names, companies, people and figures in the demo content are fictional.

## License

MIT — see [LICENSE](./LICENSE).
