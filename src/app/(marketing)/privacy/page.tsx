import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { site } from '@/lib/site'

const EFFECTIVE = '1 September 2026'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What OwnMind stores, what is never collected, how saved content is processed, and how to export or delete everything.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective={EFFECTIVE}
      summary={
        <>
          <p>
            {site.legalName} runs one service: a private library for things you save. This
            document describes exactly what that involves, in the plainest terms we can manage.
            The short version is that we hold the content you save and the email address you
            sign up with, we do not track you, and you can take all of it away at any time.
          </p>
        </>
      }
      sections={[
        {
          id: 'who-we-are',
          heading: 'Who we are',
          body: (
            <>
              <p>
                {site.legalName} is the operator of {site.name}, reachable at{' '}
                <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> and located in{' '}
                {site.location}.
              </p>
              <p>
                For the purposes of data protection law, {site.legalName} is the data controller
                for the personal data described in this policy.
              </p>
            </>
          ),
        },
        {
          id: 'what-we-collect',
          heading: 'What we collect',
          body: (
            <>
              <p>There are only two categories of data here, and both are needed to run the service.</p>
              <h3>Account data</h3>
              <ul>
                <li>Your email address, used to sign you in and to send service messages.</li>
                <li>
                  An optional display name. If you leave it blank we use your email address.
                </li>
                <li>
                  A hash of your password. The password itself is never stored or logged, and the
                  hash is built with a slow one way function (scrypt) using a unique random salt
                  per account.
                </li>
                <li>
                  A session token in a cookie, so you stay signed in. It is an opaque random
                  value, marked HttpOnly so scripts cannot read it.
                </li>
                <li>The date your account was created and your theme preference.</li>
              </ul>
              <h3>Content you save</h3>
              <ul>
                <li>Notes you write, exactly as you typed them.</li>
                <li>Links you save, with the page title, site name, domain, author and body text.</li>
                <li>Images you upload, stored as files on our own disk under a random filename.</li>
                <li>Generated titles, tags, colour values, text recognised in images and summaries.</li>
                <li>Links you make between items, and the rules of any spaces you create.</li>
                <li>The dates on which the above were created and changed.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'what-we-do-not-collect',
          heading: 'What we do not collect',
          body: (
            <>
              <p>
                The following are not merely unused. They are not present in the product at all,
                which means there is nothing to opt out of.
              </p>
              <ul>
                <li>No advertising identifiers, ad pixels or sponsored results.</li>
                <li>No third party analytics scripts, session recorders or tag managers.</li>
                <li>No cross site tracking pixels in the application or in email.</li>
                <li>No contacts, calendar, location or browsing history from your device.</li>
                <li>
                  No biometric data, no government identifiers and no special category data as
                  defined by law.
                </li>
              </ul>
              <p>
                We do not build a profile of you for advertising, and there is no mechanism in
                this codebase to export your library to anyone but you.
              </p>
            </>
          ),
        },
        {
          id: 'cookies',
          heading: 'Cookies and local storage',
          body: (
            <>
              <p>
                The service sets exactly one cookie, and it is required to keep you signed in.
              </p>
              <ul>
                <li>
                  <strong>ownmind_session</strong> holds an opaque random session token. It is
                  HttpOnly, SameSite=Lax, Secure in production, and expires after 30 days of
                  inactivity or is replaced on sign in. It contains no personal data.
                </li>
              </ul>
              <p>
                We also read one value from your browser&rsquo;s local storage, which records
                whether you chose light or dark mode. That preference stays on your device and is
                never sent to us. There are no advertising or tracking cookies, because there is
                nothing to track.
              </p>
            </>
          ),
        },
        {
          id: 'how-content-is-processed',
          heading: 'How saved content is processed',
          body: (
            <>
              <p>
                To label a save, {site.legalName} sends the content of that save to a third party
                language model provider. This is the one place where your data leaves our
                infrastructure, so it is described precisely.
              </p>
              <h3>What is sent</h3>
              <p>
                Either the text of the page or note, or the image itself. Alongside it we send
                generic instructions asking for a title, some tags and a short summary.
              </p>
              <h3>What is not sent</h3>
              <ul>
                <li>Your email address, display name or account identifier.</li>
                <li>Your IP address is visible to the provider as an ordinary HTTPS request, and is not included in the request body.</li>
                <li>Anything about other saves, other users, or anything else you have stored.</li>
                <li>Your IP address is not attached to the content we send.</li>
              </ul>
              <h3>Provider retention</h3>
              <p>
                The provider processes the request on our instructions and does not use your
                content to train its own models. Where a provider offers a zero retention mode,
                we use it. You can read the current provider and their terms in Settings, which
                states plainly whether labelling is switched on.
              </p>
              <h3>If labelling is switched off</h3>
              <p>
                If no model provider is configured, content is never sent anywhere. Labelling
                then uses local text analysis on our server, and the product remains usable.
              </p>
              <h3>Fetching a page you save</h3>
              <p>
                When you paste a link, our server requests that page directly from its owner in
                order to extract the text. That request is made by us, not by a third party
                analytics service, and the destination necessarily learns that an address
                requested it.
              </p>
            </>
          ),
        },
        {
          id: 'who-can-see-it',
          heading: 'Who can see your data',
          body: (
            <>
              <ul>
                <li>You, through your account, and through the export in Settings.</li>
                <li>
                  Nobody else using the service. There is no public profile, no shared link and
                  no social graph.
                </li>
                <li>
                  Our infrastructure providers, strictly to host the service: the hosting
                  provider, the database host, the object or file storage used for images, and
                  the payment processor for card details on paid plans. Each is bound by contract
                  to process data only on our instructions.
                </li>
                <li>
                  A public authority, if we are legally compelled to disclose it. If that ever
                  happens we will tell you, unless the law forbids us from doing so.
                </li>
              </ul>
              <p>
                Access for the operator is limited to what is needed to run and secure the
                service. Your saved content is not opened for curiosity.
              </p>
            </>
          ),
        },
        {
          id: 'how-long-we-keep-it',
          heading: 'How long we keep it',
          body: (
            <>
              <p>
                Your account and its content are kept for as long as your account exists. There
                is no scheduled deletion, no expiry and no archival copy kept after you delete.
              </p>
              <p>
                Server request logs, which exist to keep the service secure and to diagnose
                faults, are retained for a short rolling period of 30 days and then deleted.
                They are not used to profile you.
              </p>
            </>
          ),
        },
        {
          id: 'security',
          heading: 'Security',
          body: (
            <>
              <p>Reasonable measures we have taken, stated plainly:</p>
              <ul>
                <li>All traffic is served over HTTPS with HSTS.</li>
                <li>Passwords are hashed with scrypt and a per account random salt, and compared in constant time.</li>
                <li>Session tokens are 256 bit random values, stored server side, and can be invalidated by signing out.</li>
                <li>Every read and write is scoped to the signed in user, so one account cannot reach another.</li>
                <li>Uploads are written under random filenames and served only after their name is validated, which blocks path traversal.</li>
                <li>Deleting an account removes every record attached to it.</li>
              </ul>
              <p>
                No system is perfectly secure. If a breach affecting your data occurs, we will
                notify you and the relevant authority without undue delay.
              </p>
            </>
          ),
        },
        {
          id: 'your-rights',
          heading: 'Your rights',
          body: (
            <>
              <p>
                Wherever you live, we will honour the following, and most of them you can
                exercise yourself without contacting anyone.
              </p>
              <ul>
                <li>
                  <strong>Access and portability.</strong> Settings, Download my data produces a
                  JSON file of everything, at any time, with no request needed.
                </li>
                <li>
                  <strong>Correction.</strong> Edit any card directly, or write to us.
                </li>
                <li>
                  <strong>Erasure.</strong> Settings, Delete my account removes the account and
                  all attached data. It is immediate and irreversible.
                </li>
                <li>
                  <strong>Objection and restriction.</strong> Write to us and we will stop the
                  processing you object to.
                </li>
                <li>
                  <strong>Withdraw consent.</strong> Close the account. Processing that is
                  necessary to deliver the service stops with it.
                </li>
                <li>
                  <strong>Complain.</strong> You may complain to your local data protection
                  authority. We would rather you told us first.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'children',
          heading: 'Children',
          body: (
            <p>
              {site.name} is not directed at children under 13, and we do not knowingly collect
              data from anyone under 13. If you believe a child has created an account, write to
              us and we will remove it.
            </p>
          ),
        },
        {
          id: 'changes',
          heading: 'Changes to this policy',
          body: (
            <p>
              If this policy changes materially, we will update the effective date at the top and
              notify signed in users by email before the change takes effect. Continuing to use
              the service after that date means accepting the revised policy.
            </p>
          ),
        },
        {
          id: 'contact',
          heading: 'Contact',
          body: (
            <p>
              For anything in this document, write to{' '}
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. If your question is
              about a privacy complaint specifically, put that in the subject line and it will
              reach the right person.
            </p>
          ),
        },
      ]}
    />
  )
}
