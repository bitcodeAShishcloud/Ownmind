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
  /**
   * Named in the privacy policy under section 8 of the DPDP Act, 2023. A
   * grievance officer has to be a person a complaint can actually be sent to,
   * so the name and the address go on the page rather than being implied.
   */
  grievanceOfficer: {
    name: 'Ashish Gupta',
    email: 'privacy@sriprayagclasses.in',
  },
  /** Bumped whenever the categories or their meaning change. */
  consentVersion: '1.0',
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
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/data-deletion', label: 'Delete my data' },
  { href: '/terms', label: 'Terms of Service' },
] as const
