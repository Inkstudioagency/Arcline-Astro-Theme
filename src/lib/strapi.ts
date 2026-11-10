// Server-only Strapi v5 REST client. Imported from .astro frontmatter only, never from client scripts,
// so the API token never reaches the browser bundle.

const STRAPI_URL = (import.meta.env.STRAPI_URL || '').replace(/\/$/, '');
const TOKEN = import.meta.env.STRAPI_API_TOKEN;

/** False when no STRAPI_URL is set: the site then builds from the bundled demo content (see ./demo-content.ts). */
export const isStrapiConfigured = STRAPI_URL !== '';

type Query = Record<string, string | number | boolean>;

interface StrapiList<T> {
  data: T[];
  meta: { pagination: { page: number; pageCount: number; total: number } };
}

function requireUrl(): string {
  if (!STRAPI_URL) {
    throw new Error(
      'STRAPI_URL is not set. Copy .env.example to .env and point it at your Strapi instance (see README → CMS setup).',
    );
  }
  return STRAPI_URL;
}

export async function strapiFetch<T>(path: string, query: Query = {}): Promise<T> {
  const url = new URL(`/api/${path}`, requireUrl());
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  let res: Response;
  try {
    res = await fetch(url, { headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {} });
  } catch (error) {
    throw new Error(`Could not reach Strapi at ${STRAPI_URL} (${(error as Error).message}). Is it running?`);
  }
  if (!res.ok) {
    throw new Error(`Strapi responded ${res.status} for ${url.pathname}${url.search}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch every published entry of a collection, following Strapi's pagination. */
export async function getAll<T>(collection: string, query: Query = {}): Promise<T[]> {
  const entries: T[] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const res = await strapiFetch<StrapiList<T>>(collection, {
      'pagination[page]': page,
      'pagination[pageSize]': 100,
      ...query,
    });
    entries.push(...res.data);
    pageCount = res.meta.pagination.pageCount;
    page += 1;
  } while (page <= pageCount);
  return entries;
}

/** Absolute URL for a Strapi upload (local provider returns relative URLs, cloud providers absolute ones). */
export function strapiAssetUrl(url: string): string {
  if (/^https?:\/\//.test(url) || url.startsWith('/demo-media/')) return url;
  return `${requireUrl()}${url}`;
}
