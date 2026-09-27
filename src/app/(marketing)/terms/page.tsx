import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { site } from '@/lib/site'

const EFFECTIVE = '1 September 2026'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The agreement covering your use of OwnMind: your account, your content, acceptable use, billing, liability and termination.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      effective={EFFECTIVE}
      summary={
        <>
          <p>
            These terms cover your use of {site.name}. In plain terms: you keep ownership of
            everything you save, you agree not to use the service to break the law or to harm
            others, and we will run the service with reasonable care and tell you if we change
            it.
          </p>
        </>
      }
      sections={[
        {
          id: 'agreement',
          heading: 'The agreement',
          body: (
            <>
              <p>
                These terms, together with the{' '}
                <a href="/privacy">privacy policy</a>, form the agreement between you and{' '}
                {site.legalName} for your use of {site.name}. By creating an account you accept
                them. If you do not accept them, do not create an account.
              </p>
              <p>
                We may update these terms. Material changes will be announced by email to
                registered accounts at least 14 days before they take effect. Continuing to use
                the service after that date constitutes acceptance.
              </p>
            </>
          ),
        },
        {
          id: 'accounts',
          heading: 'Accounts and eligibility',
          body: (
            <>
              <p>
                You must be at least 13 years old to create an account, and 18 or older to hold a
                paid plan. If you are under 18 you need a parent or guardian to agree to these
                terms on your behalf.
              </p>
              <p>You are responsible for:</p>
              <ul>
                <li>Keeping your sign in details confidential, and telling us if you think they have been exposed.</li>
                <li>
                  Everything done through your account, including by a browser extension
                  installed on a device you control.
                </li>
                <li>Keeping your email address current, since it is how we reach you.</li>
              </ul>
              <p>
                We may suspend or close an account where there is a serious breach of these
                terms, a legal requirement, or a genuine security risk. Where we can, we will
                tell you first and let you export your data.
              </p>
            </>
          ),
        },
        {
          id: 'your-content',
          heading: 'Your content',
          body: (
            <>
              <h3>You keep ownership</h3>
              <p>
                Everything you save remains yours. We claim no ownership of your notes, links,
                images, tags or summaries, and we do not assert any intellectual property right
                over them.
              </p>
              <h3>You give us a narrow licence</h3>
              <p>
                To operate the service for you, you grant us a worldwide, non-exclusive,
                royalty free licence to store, back up, process, display and transmit the content
                you save, and to include it in search results for you and nobody else. That
                licence exists only for as long as your account does, and it ends when you delete
                the content or close the account.
              </p>
              <h3>You must have the right to save it</h3>
              <p>
                Save only material you have the right to store. We are not a publisher and we
                grant you no rights in the work of others. Do not save material you obtained in
                breach of copyright, paywalls, or terms that forbid automated collection.
              </p>
              <h3>Removal</h3>
              <p>
                We may remove content that we are legally required to remove, or that is found to
                be unlawful. We will tell you when we do this unless the law prevents it.
              </p>
            </>
          ),
        },
        {
          id: 'acceptable-use',
          heading: 'Acceptable use',
          body: (
            <>
              <p>You agree not to:</p>
              <ul>
                <li>Use the service to store or distribute anything unlawful, or to harass, harm or defraud anyone.</li>
                <li>Attempt to access another account, or probe, scan or test the vulnerability of the infrastructure without our written permission.</li>
                <li>Circumvent rate limits, plan limits, or any technical measure we put in place.</li>
                <li>Resell, sublicense or provide the service to others as a competing product.</li>
                <li>Scrape, crawl or harvest the service for a commercial dataset.</li>
                <li>Transmit malware, or deliberately overload the service with automated requests.</li>
                <li>Misrepresent your identity, or claim affiliation with us without permission.</li>
              </ul>
              <p>
                Automated saving from a browser extension or an API is welcome, provided you stay
                within a normal personal rate and do not use it to build someone else&rsquo;s
                product.
              </p>
            </>
          ),
        },
        {
          id: 'billing',
          heading: 'Plans, billing and cancellation',
          body: (
            <>
              <p>
                The free plan requires no payment. Paid plans are billed in advance, monthly or
                yearly, through our payment processor. Prices and what each plan includes are on
                the pricing page.
              </p>
              <ul>
                <li>
                  <strong>Renewal.</strong> A paid plan renews automatically until cancelled. We
                  charge a few days before the period ends and will remind you by email.
                </li>
                <li>
                  <strong>Cancellation.</strong> Cancel at any time from your account. Access
                  continues to the end of the period you have already paid for.
                </li>
                <li>
                  <strong>What happens to your data.</strong> Cancelling does not delete
                  anything. Your library stays readable on the free plan, and you keep the export
                  button.
                </li>
                <li>
                  <strong>Refunds.</strong> We refund any charge made in the last 30 days on
                  request. Write to us and it is done.
                </li>
                <li>
                  <strong>Price changes.</strong> We will give at least 30 days notice by email
                  before changing prices, and the change applies from your next renewal.
                </li>
                <li>
                  <strong>Taxes.</strong> Prices include VAT where applicable. Where tax is
                  added at checkout it is shown before you confirm.
                </li>
              </ul>
              <p>
                We do not charge for anything without your confirmation, and a plan is never
                renewed at a higher tier unless you asked for it.
              </p>
            </>
          ),
        },
        {
          id: 'availability',
          heading: 'Availability and changes',
          body: (
            <p>
              {site.name} is provided on an as available basis. We aim to keep it running, but we
              do not guarantee uninterrupted access, and we may change, suspend or retire
              features. If we retire something you rely on, we will tell you and give you a
              reasonable window to export your data first.
            </p>
          ),
        },
        {
          id: 'third-parties',
          heading: 'Third party services',
          body: (
            <p>
              {site.name} relies on infrastructure and, for labelling, on a language model
              provider. Their services are provided under their own terms, and we do not
              control them. Your use of them is between you and them. Where a third party service
              fails, our liability to you remains as set out below.
            </p>
          ),
        },
        {
          id: 'warranties',
          heading: 'Disclaimers',
          body: (
            <>
              <p>
                The service is provided as is. To the fullest extent permitted by law we
                disclaim all implied warranties, including merchantability, fitness for a
                particular purpose and non-infringement.
              </p>
              <p>
                We do not warrant that the service will be uninterrupted, that automated
                labelling will be accurate, or that saving and reading a page will always
                succeed. Pages change, sites go down, and no extraction tool is perfect. Always
                keep your own copy of anything important.
              </p>
            </>
          ),
        },
        {
          id: 'liability',
          heading: 'Limitation of liability',
          body: (
            <>
              <p>
                To the maximum extent permitted by law, {site.legalName} is not liable for any
                indirect, incidental, special, consequential or punitive loss, nor for any loss
                of profits, data, goodwill or business opportunity arising from your use of the
                service.
              </p>
              <p>
                Our total aggregate liability to you for all claims in any twelve month period is
                limited to the greater of the amount you paid us in that period and{' '}
                {'GBP 20'}. This does not apply to death or personal injury caused by
                negligence, to fraud, or to anything else that cannot lawfully be limited.
              </p>
            </>
          ),
        },
        {
          id: 'indemnity',
          heading: 'Indemnity',
          body: (
            <p>
              You agree to indemnify {site.legalName} against claims, losses and reasonable costs
              arising from your use of the service, your breach of these terms, or your
              infringement of any third party right, including by saving material you had no right
              to store.
            </p>
          ),
        },
        {
          id: 'termination',
          heading: 'Ending the agreement',
          body: (
            <>
              <p>Either of us can end this agreement at any time.</p>
              <p>
                You can close your account at any time from Settings. Closing it deletes the
                account and all attached data, which cannot be undone, so export first if you
                want a copy.
              </p>
              <p>
                We can suspend or terminate for serious breach, legal requirement or security
                risk as described in the accounts section. Where practical we will give notice
                and a chance to export first.
              </p>
              <p>
                Clauses that by their nature should survive termination do so, including
                ownership of your content, the licence you granted, disclaimers, liability and
                governing law.
              </p>
            </>
          ),
        },
        {
          id: 'law',
          heading: 'Governing law',
          body: (
            <p>
              These terms are governed by the laws of England and Wales, and the courts of
              England and Wales have exclusive jurisdiction, without affecting any mandatory
              consumer protections available to you where you live.
            </p>
          ),
        },
        {
          id: 'general',
          heading: 'General',
          body: (
            <>
              <ul>
                <li>If a clause is found unenforceable, the rest of these terms still apply.</li>
                <li>Neither of us may transfer this agreement without the other&rsquo;s consent, except as part of a sale of the business.</li>
                <li>Your use of the service is subject to these terms and the privacy policy, and nothing else forms part of the agreement.</li>
                <li>Headings are for navigation only and do not affect interpretation.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'contact-terms',
          heading: 'Contact',
          body: (
            <p>
              Write to{' '}
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with any question
              about these terms, or to give formal notice. Include your account email address so
              we can find you.
            </p>
          ),
        },
      ]}
    />
  )
}
