import type { Metadata } from 'next'
import Link from 'next/link'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Reach OwnMind for support, a privacy request, or a complaint to the grievance officer.',
}

const OFFICER = site.grievanceOfficer

export default function ContactPage() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-18">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 text-[2rem] leading-tight sm:text-[2.25rem]">Talk to us</h1>
          <div className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
            <p>
              A person reads every message. There is no ticket queue and no
              chatbot, which means a reply can take a day or two but it will be
              an answer.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl gap-12 px-5 py-14 sm:px-6 lg:grid lg:grid-cols-[minmax(0,15rem)_1fr]">
        <nav aria-label="On this page" className="mb-10 lg:mb-0">
          <p className="eyebrow">On this page</p>
          <ol className="mt-3 flex flex-col gap-1.5">
            {[
              ['support', 'Product support'],
              ['privacy-requests', 'Privacy requests'],
              ['complaints', 'Complaints'],
              ['response-times', 'How fast we reply'],
            ].map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`} className="text-sm text-ink-2 hover:text-accent-ink">
                  <span className="mr-1.5 font-mono text-xs text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose-legal max-w-none">
          <section id="support" className="scroll-mt-24">
            <h2>Product support</h2>
            <p>
              Something not working, or a question about what OwnMind does? Write
              to <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>{' '}
              and describe what you were trying to do and what happened instead.
              If it involved a code, include roughly when you asked for it, not
              the code itself.
            </p>
            <p>
              Sign in problems are usually worth checking against{' '}
              <Link href="/faq">the FAQ</Link> first, which covers the common
              cases including codes that do not arrive.
            </p>
          </section>

          <section id="privacy-requests" className="scroll-mt-24">
            <h2>Privacy requests</h2>
            <p>
              To ask what we hold about you, to correct it, or to have it
              deleted, write to{' '}
              <a href={`mailto:${OFFICER.email}`}>{OFFICER.email}</a> with the
              word <strong>Privacy request</strong> in the subject. We respond
              within 7 days.
            </p>
            <p>
              To delete an account and everything in it right now, the{' '}
              <Link href="/data-deletion">data deletion page</Link> does it
              immediately, without waiting for us.
            </p>
            <p>
              Read the <Link href="/privacy">Privacy Policy</Link> for what is
              collected and the <Link href="/cookie-policy">Cookie Policy</Link>{' '}
              for every key we use.
            </p>
          </section>

          <section id="complaints" className="scroll-mt-24">
            <h2>Complaints to the grievance officer</h2>
            <p>
              If you believe we have mishandled your data, you may complain to
              our Grievance Officer:
            </p>
            <div className="mt-4 rounded-[6px] border border-line bg-bg-alt p-4">
              <p className="block font-medium">{OFFICER.name}</p>
              <p className="mt-1 text-sm text-muted">Grievance Officer</p>
              <a
                href={`mailto:${OFFICER.email}`}
                className="mt-2 block break-all text-sm text-accent-ink underline underline-offset-2"
              >
                {OFFICER.email}
              </a>
            </div>
            <p className="mt-4">
              This role exists because section 35 of the DPDP Act requires a
              named person to receive complaints, not a shared inbox. Every
              complaint reaches that person.
            </p>
          </section>

          <section id="response-times" className="scroll-mt-24">
            <h2>How fast we reply</h2>
            <ul>
              <li>
                <strong>Privacy requests and complaints</strong>: acknowledged
                within 7 days, resolved within 30 days. The Act requires this and
                we publish it so it can be held to.
              </li>
              <li>
                <strong>Breach notification</strong>: to the Data Protection
                Board and affected people, without undue delay.
              </li>
              <li>
                <strong>Everything else</strong>: usually a couple of days.
              </li>
            </ul>
            <p>
              If a request is not resolved to your satisfaction within 30 days,
              you may complain to the Data Protection Board of India.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}