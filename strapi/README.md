# Arcline CMS (Strapi 5)

Headless CMS for the Arcline Astro theme. It is a standard Strapi 5 project (SQLite by default) with the theme's
content model and demo content.

## Content model

| Collection | API | Notes |
|---|---|---|
| Blog Post | `/api/blog-posts` | category (blog tabs), featured, author (relation), sections, stats, takeaways, tags, quote, SEO |
| Author | `/api/authors` | name, role, avatar — linked from blog posts |
| Case Study | `/api/case-studies` | filter category (tabs), sortOrder, result note, stats, collage, client quote, SEO |
| Service | `/api/services` | sortOrder, card visuals / animation, facts, challenges, brief card, SEO |

Schemas: `src/api/*/content-types/*/schema.json`. Shared components: `src/components/shared/*`, `src/components/service/*`.

## Run

```bash
npm install
cp .env.example .env      # replace every "tobemodified" with a random secret
npm run develop           # http://localhost:1337/admin
```

## Seed the demo content

`seed/data.json` and `seed/media/` hold the demo content. `scripts/seed.mjs` uploads the media through the Upload API
and creates, updates and publishes the entries through the **Strapi MCP server** (`/mcp`, enabled in
`config/server.ts`, see https://docs.strapi.io/cms/features/strapi-mcp-server). The MCP server cannot upload files or
change schemas, which is why media goes through the Upload API and the schemas are files in this repo.

1. Admin panel → *Settings → API Tokens* → create a **Full access** token.
2. Admin panel → *Settings → Admin Tokens* → create a token with Content Manager *read, create, update, publish*
   permissions on Author, Blog Post, Case Study and Service (plus Media Library *read*).
3. Run:
   ```bash
   STRAPI_URL=http://localhost:1337 STRAPI_UPLOAD_TOKEN=<full-access token> STRAPI_MCP_TOKEN=<admin token> npm run seed
   ```
   Add `--dry-run` to preview. Re-running updates entries in place (matched by slug, authors by name).

You can also connect an AI assistant to the same MCP endpoint to manage content, e.g. with Claude Code:

```bash
claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer <admin token>"
```

## Connect the Astro site

Create a **Read-only** API token and set `STRAPI_URL` and `STRAPI_API_TOKEN` in the theme's `.env`.

## Production

Use PostgreSQL or MySQL (`DATABASE_CLIENT` in `.env`, see `config/database.ts`) and a cloud upload provider so media
survives redeploys. Add a webhook (*Settings → Webhooks*) that triggers your site's deploy hook on publish so the
static Astro site rebuilds with the new content.
