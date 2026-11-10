// Demo content used when no Strapi instance is configured (STRAPI_URL empty).
// It reads the same dataset that seeds Strapi (strapi/seed/data.json) and returns entries in Strapi's REST response
// shape, so every page and card works unchanged. Images are served from /demo-media/ (copied from strapi/seed/media
// by the demo-media integration in astro.config.mjs). Set STRAPI_URL to use your own CMS instead.
import seed from '../../strapi/seed/data.json';

type SeedMedia = { file: string; alt?: string };
type Collection = 'blogPosts' | 'caseStudies' | 'services';

let nextId = 1;

function media(m: SeedMedia) {
  return { id: nextId++, url: `/demo-media/${m.file}`, alternativeText: m.alt ?? '', width: null, height: null, formats: null };
}

/** Replace seed media refs ({ file, alt }) with Strapi-like media objects. */
function convert(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(convert);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.file === 'string' && Object.keys(obj).every((k) => k === 'file' || k === 'alt')) return media(obj as SeedMedia);
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, convert(v)]));
  }
  return value;
}

type Row = Record<string, unknown>;

const authors: Row[] = seed.authors.map((author, i) => ({
  id: i + 1,
  documentId: `demo-author-${i + 1}`,
  ...(convert(author) as Row),
}));
const SORT: Record<Collection, (a: Row, b: Row) => number> = {
  blogPosts: (a, b) => String(b.publishedDate).localeCompare(String(a.publishedDate)),
  caseStudies: (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
  services: (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
};

/** All demo entries of a collection, in the same order the Strapi queries in cms.ts use. */
export function demoEntries<T>(collection: Collection): T[] {
  const entries: Row[] = (seed[collection] as unknown[]).map((entry, i) => {
    const row: Row = { id: i + 1, documentId: `demo-${collection}-${i + 1}`, ...(convert(entry) as Row) };
    // Blog posts reference their author by name in the seed file.
    if (collection === 'blogPosts') row.author = authors.find((a) => a.name === row.author) ?? null;
    return row;
  });
  return entries.sort(SORT[collection]) as T[];
}
