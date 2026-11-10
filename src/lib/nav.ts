// "Current page" helpers: Webflow marks links to the current page with `w--current` + aria-current="page".

/** Listing pages that are paginated (/blog-v1/2 …): their links stay current on every page. */
const PAGINATED = /^\/(blog-v1|blog-v2|case-studies)\/\d+$/;

function normalize(path: string): string {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return PAGINATED.test(clean) ? clean.replace(/\/\d+$/, '') : clean;
}

export function currentLink(url: URL) {
  const here = normalize(url.pathname);
  const isCurrent = (href: string | undefined) => !!href && href.startsWith('/') && normalize(href) === here;
  return {
    isCurrent,
    ariaCurrent: (href: string | undefined) => (isCurrent(href) ? ('page' as const) : undefined),
  };
}
