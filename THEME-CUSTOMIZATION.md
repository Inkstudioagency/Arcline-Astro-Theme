# Customizing Arcline

## 1. Brand and contact details

Edit `src/config/site.ts`:

| Key | Used in |
|---|---|
| `name`, `legalName` | page titles, Open Graph, logo alt text, aria labels |
| `defaultTitle`, `defaultDescription`, `ogImage` | fallback SEO for pages without their own values |
| `email`, `phone` / `phoneHref`, `location` | footer and contact pages |
| `privacyPolicy` | link in the contact form's consent checkbox |
| `tagline`, `summary`, `copyright` | footer |
| `social` | footer icons (`linkedin`, `x`, `instagram` icons are included in `src/components/ui/SocialIcon.astro`) |
| `newsletter` | footer newsletter copy and messages |

Logos: replace `public/images/arcline-logo-white.svg`, `arcline-logo-dark.svg` and `arcline-footer-wordmark.svg`.
Favicons: `public/images/favicon*.png`, `webclip*.png`.

## 2. Navigation

`src/config/navigation.ts` holds every menu: the desktop links, the "Pages" mega menu groups and feature card, the
mobile drawer, the footer columns and the primary call to action. The **Services** dropdown and the **Detail Pages**
links are filled from the CMS automatically.

Links to the current page get the `w--current` class and `aria-current="page"` at build time (`src/lib/nav.ts`).

## 3. Colors, type and spacing

All styles are plain CSS in `src/styles/`:

- `arcline.webflow.css` — the design system. Its first block defines the design tokens as CSS custom properties
  (colors, font sizes, radii, spacing). Change a token there and it updates everywhere.
- `custom.css` — loaded last; put your own overrides here.
- `webflow.css` / `normalize.css` — base layer for the layout primitives; leave unchanged.

Breakpoints: desktop (default), `max-width: 991px` (tablet), `767px` (mobile landscape), `479px` (mobile portrait),
plus large-screen steps at 1280 / 1440 / 1920px.

The typeface is Inter Display (self-hosted, `public/fonts/`, declared with `@font-face` in `arcline.webflow.css`).

## 4. Pages and sections

Every page in `src/pages/` is a short list of section components:

```astro
<BaseLayout title="About | Arcline" description="…" wfPage="…">
  <AboutHero />
  <AboutStory />
  …
  <Cta />
</BaseLayout>
```

Sections live in `src/components/sections/<page>/`. Edit their text directly, reorder them, or reuse a section on
another page. `Cta.astro` (the closing call-to-action band) is shared; pass `secondaryHref` / `secondaryLabel` to
change its second button.

> **Keep `wfPage` and the `data-*` attributes.** Scroll reveals, split-text headings, counters and hover effects are
> driven by the interaction runtime in `public/js/webflow.js`, which finds each page's animations by its `wfPage` id
> and targets elements through attributes such as `data-wf-target`, `reveal-anim-*`, `hero-title` or `data-counter`.
> When you add a new page, copy the `wfPage` id of the page whose animations you want.

Buttons: `<Button href="/contact-v1" variant="primary">Label</Button>` — variants `primary`, `secondary`, `light`,
`blue`, `dark`, `outline`, `outline-light`. Text links with an arrow: `<LinkButton href="…">Label</LinkButton>`.

## 5. CMS content

See the README's *CMS setup* for installing Strapi and seeding the demo content. In the Strapi admin:

- **Blog Post** — `category` drives the category tabs on the blog pages; tick `featured` on the post to show in the
  Blog V1 hero card. Posts are listed newest first (`publishedDate`).
- **Author** — linked from each blog post.
- **Case Study** — `filterCategory` drives the case-study tabs; `sortOrder` sets the order everywhere.
- **Service** — `sortOrder` sets the order; `cardAnimation` is the path or URL of a Lottie JSON shown on the Home V1 and
  Services cards (bundled ones are in `public/documents/`). Leave it empty to show the `cardVisual` image instead.

Every type has an optional **SEO** component to override the page title and meta description.

Data access is in `src/lib/cms.ts` (typed queries, one fetch per collection per build) and `src/lib/strapi.ts` (REST
client). Cards are in `src/components/cards/`.

**Publishing:** the site is static. Add a webhook in Strapi (*Settings → Webhooks*, events *entry.publish*,
*entry.update*, *entry.unpublish*) that calls your host's deploy hook so the site rebuilds after content changes.

**Production Strapi:** switch `DATABASE_CLIENT` to `postgres` or `mysql` in `strapi/.env` and configure a cloud upload
provider (S3, Cloudinary…) so media survives redeploys. If your media is served from another domain, nothing changes in
Astro: `src/lib/cms.ts` handles absolute and relative media URLs.

## 6. Forms

Set `PUBLIC_FORM_ENDPOINT` in `.env` to any service that accepts a JSON POST (Formspree, Web3Forms, Basin, Getform, a
serverless function…). `src/scripts/forms.ts` sends the form fields plus `form` (form name) and `page` (path), then shows
the form's success or error message. The hidden `_gotcha` field is a honeypot and is never sent.

## 7. Animations and smooth scrolling

- `src/scripts/site.js` — Lenis smooth scrolling, number counters (`data-counter`), slider blur, Lottie playback on
  scroll and the GSAP section motion (stacked service cards, value cards, growing stats photo, pinned service steps).
- All motion respects `prefers-reduced-motion`.
- To turn smooth scrolling off, remove the Lenis block at the top of `site.js` and the two Lenis tags in
  `src/layouts/BaseLayout.astro`.

## 8. SEO

`src/components/global/SEO.astro` renders the title, description, canonical URL, Open Graph and Twitter tags. Set
`SITE_URL` in `.env` so canonical URLs and the sitemap (`/sitemap-index.xml`) use your domain. `robots.txt` is generated
by `src/pages/robots.txt.ts`.
