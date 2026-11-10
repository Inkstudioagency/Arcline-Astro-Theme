// Typed access to the Strapi collections (Blog posts + Authors, Case studies, Services) plus render helpers.
// Every getter is memoised, so a static build fetches each collection once.
// Without STRAPI_URL the getters return the bundled demo content (./demo-content.ts) instead.
import { getAll, isStrapiConfigured, strapiAssetUrl } from './strapi';
import { demoEntries } from './demo-content';

// ---------- Types (mirror strapi/src/**/schema.json) ----------

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
}

export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  formats?: Record<string, StrapiMediaFormat> | null;
}

/** shared.headline: the big detail-page title, with the last words set in the accent style. */
export interface Headline {
  lead: string;
  accent: string;
}

/** shared.statement: a sentence with one highlighted phrase. */
export interface Statement {
  start: string;
  accent: string;
  end: string;
}

/** shared.stat */
export interface Stat {
  value: string;
  label: string;
}

/** shared.text-item */
export interface TextItem {
  text: string;
}

/** shared.titled-text */
export interface TitledText {
  title: string;
  text: string;
}

/** shared.quote */
export interface Quote {
  text: string;
  authorName: string | null;
  authorRole: string | null;
  authorPhoto: StrapiMedia | null;
}

/** service.brief: the small "brief" card on the service hero. */
export interface ServiceBrief {
  title: string;
  tag: string;
  label: string;
  value: string;
  status: string;
}

/** shared.seo */
export interface Seo {
  metaTitle: string | null;
  metaDescription: string | null;
}

interface Entry {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  headline: Headline | null;
  statement: Statement | null;
  seo: Seo | null;
}

export interface Author {
  id: number;
  documentId: string;
  name: string;
  role: string | null;
  avatar: StrapiMedia | null;
}

export interface BlogPost extends Entry {
  excerpt: string | null;
  mainImage: StrapiMedia | null;
  category: string;
  author: Author | null;
  readTime: string | null;
  /** Calendar date, YYYY-MM-DD. Posts are listed newest first. */
  publishedDate: string;
  featured: boolean;
  intro: string | null;
  sections: TitledText[];
  stats: Stat[];
  takeaways: TextItem[];
  tags: TextItem[];
  overviewImage: StrapiMedia | null;
  quote: string | null;
}

export interface CaseStudy extends Entry {
  caseNumber: number;
  /** Manual display order (1 = first). */
  sortOrder: number;
  industry: string | null;
  client: string | null;
  summary: string | null;
  resultLabel: string | null;
  resultValue: string | null;
  resultChange: string | null;
  mainImage: StrapiMedia | null;
  featureImage: StrapiMedia | null;
  filterCategory: string;
  intro: string | null;
  sectionTitle: string | null;
  sectionText: string | null;
  stats: Stat[];
  collage: StrapiMedia[] | null;
  services: string | null;
  timeline: string | null;
  team: string | null;
  overviewImage: StrapiMedia | null;
  quote: Quote | null;
}

export interface Service extends Entry {
  number: number;
  /** Manual display order (1 = first). */
  sortOrder: number;
  summary: string | null;
  heroSummary: string | null;
  cardVisual: StrapiMedia | null;
  cardVisualLight: StrapiMedia | null;
  /** Path or URL of a Lottie JSON shown on the Home V1 / Services cards (falls back to cardVisual). */
  cardAnimation: string | null;
  /** Accessible description of the animation. */
  cardAnimationLabel: string | null;
  heroPhoto: StrapiMedia | null;
  typicalDuration: string | null;
  team: string | null;
  engagementModel: string | null;
  idealFor: string | null;
  challenges: TitledText[];
  brief: ServiceBrief | null;
}

// ---------- Queries ----------

const memo = new Map<string, Promise<unknown>>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!memo.has(key)) memo.set(key, load());
  return memo.get(key) as Promise<T>;
}

/** Blog posts, newest first. Authors are populated with their avatar. */
export const getBlogPosts = () =>
  cached('blog-posts', async () =>
    isStrapiConfigured
      ? getAll<BlogPost>('blog-posts', {
          'populate[mainImage]': true,
          'populate[overviewImage]': true,
          'populate[author][populate][avatar]': true,
          'populate[headline]': true,
          'populate[statement]': true,
          'populate[sections]': true,
          'populate[stats]': true,
          'populate[takeaways]': true,
          'populate[tags]': true,
          'populate[seo]': true,
          sort: 'publishedDate:desc',
        })
      : demoEntries<BlogPost>('blogPosts'),
  );

/** Case studies in their manual display order. */
export const getCaseStudies = () =>
  cached('case-studies', async () =>
    isStrapiConfigured
      ? getAll<CaseStudy>('case-studies', {
          'populate[mainImage]': true,
          'populate[featureImage]': true,
          'populate[overviewImage]': true,
          'populate[collage]': true,
          'populate[headline]': true,
          'populate[statement]': true,
          'populate[stats]': true,
          'populate[quote][populate][authorPhoto]': true,
          'populate[seo]': true,
          sort: 'sortOrder:asc',
        })
      : demoEntries<CaseStudy>('caseStudies'),
  );

/** Services in their manual display order. */
export const getServices = () =>
  cached('services', async () =>
    isStrapiConfigured
      ? getAll<Service>('services', { populate: '*', sort: 'sortOrder:asc' })
      : demoEntries<Service>('services'),
  );

// ---------- List helpers ----------

/** Entries whose `field` equals `value` (the category tabs on the blog and case study pages). */
export function whereEquals<T, K extends keyof T>(entries: T[], field: K, value: T[K]): T[] {
  return entries.filter((entry) => entry[field] === value);
}

/** The entry with the given slug, or the first entry when it doesn't exist. */
export function bySlugOrFirst<T extends { slug: string }>(entries: T[], slug: string): T | undefined {
  return entries.find((entry) => entry.slug === slug) ?? entries[0];
}

// ---------- URLs ----------

export const blogUrl = (post: { slug: string }) => `/blog/${post.slug}`;
export const caseStudyUrl = (entry: { slug: string }) => `/case-study/${entry.slug}`;
export const serviceUrl = (entry: { slug: string }) => `/service/${entry.slug}`;

// ---------- Media ----------

/** Absolute URL of a Strapi media file (undefined when the field is empty). */
export function mediaSrc(media: StrapiMedia | null | undefined): string | undefined {
  return media?.url ? strapiAssetUrl(media.url) : undefined;
}

/** `srcset` from the responsive formats Strapi generated (see strapi/config/plugins.ts → breakpoints) plus the original. */
export function mediaSrcset(media: StrapiMedia | null | undefined): string | undefined {
  if (!media?.url) return undefined;
  const candidates = Object.values(media.formats ?? {})
    .filter((f) => f?.url && f.width)
    .map((f) => ({ url: f.url, width: f.width }));
  if (media.width) candidates.push({ url: media.url, width: media.width });
  if (candidates.length < 2) return undefined;
  return candidates
    .sort((a, b) => a.width - b.width)
    .map((c) => `${strapiAssetUrl(c.url)} ${c.width}w`)
    .join(', ');
}

/** Alt text stored on the media file in Strapi. */
export function mediaAlt(media: StrapiMedia | null | undefined): string {
  return media?.alternativeText ?? '';
}

// ---------- Formatting ----------

/** "September 12, 2026" (the format the template uses). Dates are calendar dates (YYYY-MM-DD). */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Two-digit numbers ("01") for case and service numbers. */
export function pad2(value: number | null | undefined): string {
  return value == null ? '' : String(value).padStart(2, '0');
}
