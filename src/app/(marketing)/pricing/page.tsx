import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { PageHeader, Section } from '@/components/page-header'
import { site } from '@/lib/site'

export const metadata = {
  title: 'Pricing',
  description:
    'What each OwnMind plan costs, what it includes, and the full feature comparison. No adverts on any plan.',
  alternates: { canonical: '/pricing' },
}

type Tier = {
  name: string
  price: string
  cadence: string
  summary: string
  cta: string
  href: string
  featured?: boolean
  includes: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Shelf',
    price: 'Free',
    cadence: 'forever',
    summary: 'A working private library with no card and no expiry.',
    cta: 'Create an account',
    href: '/signup',
    includes: [
      'Unlimited notes, links and images',
      'Automatic titles, tags and summaries',
      'Full text search across everything you saved',
      'Spaces and manual links between items',
      'Pinning and Recall',
      'JSON export and account deletion',
    ],
  },
  {
    name: 'Stack',
    price: '£4',
    cadence: 'per month, billed yearly',
    summary: 'For people with a large archive and heavier reading.',
    cta: 'Start with Stack',
    href: '/signup',
    featured: true,
    includes: [
      'Everything in Shelf',
      '25 GB of image storage',
      'Unlimited article text, kept in full',
      'Offline reading of saved articles',
      'Priority image processing',
    ],
  },
  {
    name: 'Attic',
    price: '£8',
    cadence: 'per month, billed yearly',
    summary: 'For archives big enough that storage and processing matter.',
    cta: 'Start with Attic',
    href: '/signup',
    includes: [
      'Everything in Stack',
      '250 GB of image storage',
      'Batch labelling of an existing library',
      'Scheduled Recall digests by email',
      'Priority support',
    ],
  },
]

const MATRIX: Array<{ label: string; values: Array<string | boolean> }> = [
  { label: 'Unlimited notes, links and images', values: [true, true, true] },
  { label: 'Automatic titles, tags and summaries', values: [true, true, true] },
  { label: 'Full text search', values: [true, true, true] },
  { label: 'Spaces and manual links', values: [true, true, true] },
  { label: 'Pinning and Recall', values: [true, true, true] },
  { label: 'JSON export', values: [true, true, true] },
  { label: 'Image storage', values: ['2 GB', '25 GB', '250 GB'] },
  { label: 'Article text stored in full', values: [false, true, true] },
  { label: 'Offline reading of saved articles', values: [false, true, true] },
  { label: 'Batch labelling of an existing library', values: [false, false, true] },
  { label: 'Scheduled Recall digests', values: [false, false, true] },
  { label: 'Adverts', values: [false, false, false] },
  { label: 'Your data sold or shared', values: [false, false, false] },
]

const FAQS = [
  {
    q: 'Is the free plan really free, or is it a trial?',
    a: 'Free forever, with no card. It is not a countdown. The paid plans exist for storage and processing headroom, not to unlock the ability to search your own notes.',
  },
  {
    q: 'What exactly does the model provider see?',
    a: 'The text of what you saved, or the image itself, and nothing about your account. No email address, no name, no IP history is included in the request. The privacy policy has the full description.',
  },
  {
    q: 'Can I get my data out?',
    a: 'Yes, from Settings, as one JSON file, with no request to make and no waiting period.',
  },
  {
    q: 'What happens to my saves if I stop paying?',
    a: 'Nothing is deleted. Your library stays readable on the free plan, and you can export it whenever you like. You lose the extra storage and the longer articles stored in full.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes, within 30 days of a charge, no questions asked. Write to the support address and it is done.',
  },
  {
    q: 'Can I pay by invoice or card?',
    a: 'Card and invoice for annual billing. Email the support address if you need an invoice with a VAT number.',
  },
]

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="One subscription. No adverts on any plan."
        lede={
          <>
            {site.legalName} is funded by people paying for it, so there is no free tier built to
            become a trap and no feature held back to force an upgrade. Search your own notes is
            never a paid feature.
          </>
        }
      />

      <Section>
        <ul className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <li
              key={tier.name}
              className={`panel flex flex-col p-6 ${
                tier.featured ? 'border-ink' : ''
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg">{tier.name}</h2>
                {tier.featured ? <span className="eyebrow">Most chosen</span> : null}
              </div>

              <p className="mt-3 font-display text-3xl">{tier.price}</p>
              <p className="mt-0.5 text-sm text-muted">{tier.cadence}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{tier.summary}</p>

              <Link
                href={tier.href}
                className={`btn mt-5 h-10 ${tier.featured ? 'btn-primary' : 'btn-outline'}`}
              >
                {tier.cta}
              </Link>

              <ul className="mt-6 flex flex-col gap-2 border-t border-line pt-5">
                {tier.includes.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                    <Check
                      size={15}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-accent"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-2xl text-sm text-muted">
          Prices are shown in pounds and include VAT. Monthly billing is available at a higher
          rate. Nothing on this page is charged automatically until you choose a plan and confirm.
        </p>
      </Section>

      <Section alt>
        <h2 className="text-2xl">The full comparison</h2>

        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <caption className="sr-only">Feature comparison across the three OwnMind plans</caption>
            <thead>
              <tr>
                <th scope="col" className="w-1/2 border-b border-line py-2.5 pr-4 text-left font-medium">
                  Feature
                </th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.name}
                    scope="col"
                    className="border-b border-line py-2.5 text-left font-medium"
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th scope="row" className="py-2.5 pr-4 text-left font-normal text-ink-2">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={index} className="py-2.5 text-ink-2">
                      {typeof value === 'string' ? (
                        value
                      ) : value ? (
                        <>
                          <Check
                            size={15}
                            strokeWidth={2}
                            className="text-accent"
                            aria-label="Included"
                          />
                          <span className="sr-only">Included</span>
                        </>
                      ) : (
                        <>
                          <Minus
                            size={15}
                            strokeWidth={2}
                            className="text-muted"
                            aria-label="Not included"
                          />
                          <span className="sr-only">Not included</span>
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <h2 className="text-2xl">Questions about paying</h2>
        <dl className="mt-6 flex max-w-3xl flex-col divide-y divide-line border-y border-line">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-5">
              <dt className="text-[0.9375rem] font-semibold">{faq.q}</dt>
              <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{faq.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-muted">
          More detail on the{' '}
          <Link href="/faq" className="text-accent-ink underline underline-offset-2">
            FAQ page
          </Link>
          .
        </p>
      </Section>
    </>
  )
}
