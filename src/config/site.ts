// Site-wide settings. Edit these to rebrand the theme.
// Contact details are placeholders (example.com / fictional 555 number) — replace them with your own.

export const site = {
  /** Brand name used in titles, Open Graph and aria labels. */
  name: 'Arcline',
  /** Legal / footer name. */
  legalName: 'Arcline Advisory',
  /** Production URL (also set SITE_URL in .env so canonical URLs and the sitemap use it). */
  url: 'https://example.com',
  defaultTitle: 'Arcline - Consulting Astro Theme',
  defaultDescription:
    'Arcline is a consulting Astro theme for strategy firms and advisors, with service pages, case studies, a blog and contact layouts built to win new clients.',
  /** Default Open Graph image (root-relative or absolute). */
  ogImage: '/images/arcline-open-graph.webp',

  email: 'hello@example.com',
  /** Shown as written; `phoneHref` is used for the tel: link. */
  phone: '+1 555 010 0000',
  phoneHref: '+15550100000',
  location: 'New York, USA',
  /** Linked from the contact form's consent checkbox. Point it at your privacy policy page. */
  privacyPolicy: '#',

  tagline: 'Clarity, applied — from question to result.',
  summary:
    'Arcline Advisory helps ambitious organizations turn complex challenges into focused strategy, stronger operations and measurable growth.',
  copyright: '© 2026 Arcline Advisory. A fictional firm for template purposes.',

  /** Root-domain links only. Point them at your own profiles. */
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/', icon: 'linkedin' },
    { label: 'X', href: 'https://x.com/', icon: 'x' },
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: 'instagram' },
  ] as const,

  newsletter: {
    title: 'The Arcline Brief',
    text: 'One considered note a month on strategy, operations and growth. No noise.',
    success: 'Thanks for subscribing. The next Arcline Brief is on its way.',
    error: 'Something went wrong. Please check your email and try again.',
  },
};

export type SocialIcon = (typeof site.social)[number]['icon'];
