/**
 * Single source of truth for brand, domain and contact details.
 * Change the name here and it updates across metadata, the footer and legal pages.
 */

export const site = {
  name: 'OwnMind',
  legalName: 'OwnMind',
  tagline: 'A private place for everything you save.',
  domain: 'sriprayagclasses.in',
  url: 'https://sriprayagclasses.in',
  contactEmail: 'hello@sriprayagclasses.in',
  supportEmail: 'support@sriprayagclasses.in',
  /** Shown in the footer. Replace with a real location before launch. */
  location: 'Remote, India',
  foundedYear: 2026,
} as const

export const heroCopy = {
  /** Specific, outcome first. No vague promises. */
  headline: 'Save anything. Find it by what you remember.',
  sub: 'OwnMind keeps your links, notes, screenshots and articles in one private place. It reads each one, pulls out the details, and hands them back the moment you search. No folders. No tags. No filing.',
  primaryCta: 'Start saving',
  secondaryCta: 'See how it works',
} as const

export const navLinks = [
  { href: '/how', label: 'How it works' },
  { href: '/why', label: 'Why OwnMind' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
] as const

export const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
] as const
