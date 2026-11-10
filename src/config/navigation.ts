// Header and footer menus. The Services dropdown is filled from the CMS (Strapi → Services).

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

/** Desktop menu: plain links around the two dropdowns ("Services" and "Pages"). */
export const mainLinksBefore: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
];
export const servicesIndexLink: NavLink = { label: 'All Services', href: '/services' };
export const mainLinksAfter: NavLink[] = [
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Blog', href: '/blog-v1' },
];

/** Mobile drawer: main links. */
export const mobileLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Blog', href: '/blog-v1' },
  { label: 'Contact', href: '/contact-v1' },
];

const home: NavGroup = {
  title: 'Home',
  links: [
    { label: 'Home V1', href: '/' },
    { label: 'Home V2', href: '/home-v2' },
    { label: 'Home V3', href: '/home-v3' },
  ],
};
const company: NavGroup = {
  title: 'Company',
  links: [
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Case Studies', href: '/case-studies' },
  ],
};
const blog: NavGroup = {
  title: 'Blog',
  links: [
    { label: 'Blog V1', href: '/blog-v1' },
    { label: 'Blog V2', href: '/blog-v2' },
    { label: 'Blog V3', href: '/blog-v3' },
  ],
};
const contact: NavGroup = {
  title: 'Contact',
  links: [
    { label: 'Contact V1', href: '/contact-v1' },
    { label: 'Contact V2', href: '/contact-v2' },
    { label: 'Contact V3', href: '/contact-v3' },
  ],
};
const utility: NavGroup = {
  title: 'Utility',
  links: [{ label: '404 Page', href: '/404' }],
};

/**
 * "Detail Pages" group: example CMS detail pages. Each entry names a preferred slug; when that entry doesn't exist
 * in your CMS the first entry of the collection is used instead (see Header.astro).
 */
export const detailLinks = {
  service: { label: 'Service Details', slug: 'business-strategy' },
  caseStudy: { label: 'Case Study Details', slug: 'enhancing-cross-selling' },
  blog: { label: 'Blog Details', slug: 'data-driven-success' },
};

/** "Pages" mega menu (desktop) — the "Detail Pages" group is inserted after these four. */
export const megaGroups: NavGroup[] = [home, company, blog, contact];
export const megaUtility: NavGroup = utility;
/** "Pages" section of the mobile drawer — "Detail Pages" is inserted before Utility. */
export const mobileGroups: NavGroup[] = [home, blog, contact];

export const megaFeature = {
  image: '/images/home-process-team.webp',
  srcset:
    '/images/home-process-team-p-500.webp 500w, /images/home-process-team-p-800.webp 800w, /images/home-process-team-p-1080.webp 1080w, /images/home-process-team.webp 1098w',
  title: 'Clarity for every stage of business growth',
  text: 'Tell us where your business is today, and we will map out what it takes to get where you want to go.',
};

/** Primary call to action (header buttons, mega menu). */
export const primaryCta: NavLink = { label: 'Start a Conversation', href: '/contact-v1' };

/** Footer link columns. */
export const footerColumns: NavGroup[] = [
  {
    title: 'Main Pages',
    links: [
      { label: 'Home V1', href: '/' },
      { label: 'Home V2', href: '/home-v2' },
      { label: 'Home V3', href: '/home-v3' },
      { label: 'Blog V1', href: '/blog-v1' },
      { label: 'Blog V2', href: '/blog-v2' },
      { label: 'Blog V3', href: '/blog-v3' },
    ],
  },
  {
    title: 'More Pages',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Contact V1', href: '/contact-v1' },
      { label: 'Contact V2', href: '/contact-v2' },
      { label: 'Contact V3', href: '/contact-v3' },
    ],
  },
  { title: 'Utility', links: [{ label: '404', href: '/404' }] },
];

/** Links in the footer's bottom row. */
export const footerLegalLinks: NavLink[] = [{ label: 'Not Found', href: '/404' }];
