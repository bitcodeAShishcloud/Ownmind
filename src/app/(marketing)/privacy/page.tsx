import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { site } from '@/lib/site'
import {
  ANALYTICS_RETENTION_DAYS,
  CONSENT_RETENTION_DAYS,
  SERVER_LOG_RETENTION_DAYS,
} from '@/lib/retention'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What OwnMind collects, why, how long it is kept, and how to exercise your rights under the Digital Personal Data Protection Act 2023.',
}

/** Months, for the sentences a person actually reads. */
function months(days: number): string {
  const value = Math.round(days / 30.44)
  return value === 1 ? 'one month' : `${value} months`
}

export default function PrivacyPage() {
  const officer = site.grievanceOfficer

  return (
    <LegalPage
      title="Privacy Policy"
      effective="18 October 2026"
      summary={
        <>
          <p>
            OwnMind is run by {site.legalName}. This document says what personal
            data we hold, why we hold it, how long we keep it, and what you can
            do about it. It is written to be read rather than skimmed past.
          </p>
          <p>
            The short version: we run no advertising, we sell nothing to anyone,
            and we do not follow you anywhere. There is no marketing category in
            our consent system because there is no marketing.
          </p>
          <p>
            This policy is written under the{' '}
            <strong>Digital Personal Data Protection Act, 2023</strong> (the
            DPDP Act) and the rules made under it.
          </p>
        </>
      }
      sections={[
        {
          id: 'what-is-personal-data',
          heading: 'What counts as personal data here',
          body: (
            <>
              <p>
                Under the DPDP Act, personal data is anything that identifies or
                is reasonably capable of being linked to a person. Taken
                literally that includes an IP address, so we treat the coarse
                statistics below as personal data and give you the same rights
                over them.
              </p>
            </>
          ),
        },
        {
          id: 'what-we-collect',
          heading: 'What we collect, and why',
          body: (
            <>
              <p>
                Everything optional requires your consent first. Nothing is
                collected before you choose, and you can change your mind
                afterwards.
              </p>

              <h3>Given to us by you, voluntarily</h3>
              <ul>
                <li>
                  <strong>Email address</strong>: to send you a sign in code and
                  to let you reach your own library. Needed to have an account.
                </li>
                <li>
                  <strong>Name</strong>: optional, only if you type one. Shown
                  in your own workspace.
                </li>
                <li>
                  <strong>Anything you save</strong>: the links, notes, images
                  and articles you put in your library. This is the product.
                </li>
                <li>
                  <strong>Messages you send us</strong>: if you use the contact
                  page or write to us directly.
                </li>
              </ul>

              <h3>Collected only with consent</h3>
              <ul>
                <li>
                  <strong>Analytics</strong>: which page was viewed, how far
                  down it was read, and which external link was followed.
                  Collected under the analytics category.
                </li>
                <li>
                  <strong>Approximate location</strong>: country, region and
                  city from network headers, plus coordinates rounded to about a
                  kilometre where available. Collected under the location
                  category.
                </li>
                <li>
                  <strong>Device information</strong>: browser, version,
                  operating system, screen and window size, language, time zone,
                  and mobile or desktop. Collected under the device category.
                </li>
              </ul>

              <h3>Never collected</h3>
              <ul>
                <li>Exact GPS coordinates. The browser geolocation API is not used anywhere in this project.</li>
                <li>Keystrokes, or the contents of anything you type into a form.</li>
                <li>Payment details. We never see them; card handling is out of scope.</li>
                <li>Your name or email inside analytics. Those tables have no column to hold one.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'consent',
          heading: 'How consent works',
          body: (
            <>
              <p>
                Consent is free, specific, informed, and as easy to withdraw as
                it was to give. Three rules govern it:
              </p>
              <ul>
                <li>
                  <strong>Nothing optional is on by default.</strong> Every
                  optional category starts switched off.
                </li>
                <li>
                  <strong>Refusing costs you nothing.</strong> The site is fully
                  usable with everything declined. There is no cookie wall.
                </li>
                <li>
                  <strong>The options look identical.</strong> Accept, reject and
                  manage are the same size, colour and weight, in the same order
                  every time. A design that makes refusal harder would be a dark
                  pattern and is not used here.
                </li>
              </ul>
              <p>
                We keep a record of each choice: the categories selected, the
                policy version in force, and the date and time. That record is
                how we can show consent was given, which section 5(2) of the Act
                requires. A record with no version and no timestamp would not be
                evidence of anything.
              </p>
              <p>
                If we change what a category means, the version changes with it
                and your previous choice stops applying. The banner returns and
                asks again rather than assuming the old answer still stands.
              </p>
            </>
          ),
        },
        {
          id: 'purpose-limitation',
          heading: 'We use it only for what it is for',
          body: (
            <>
              <p>
                Data collected for one purpose is not reused for another. Page
                view statistics are not used to build an advertising profile,
                because we have none. Location is not used to place you in a
                regional pricing tier. Device details are not used to detect
                fraud by fingerprinting devices.
              </p>
              <p>
                If we ever need your data for a new purpose, we will ask you
                again first rather than treat the original permission as
                covering it.
              </p>
            </>
          ),
        },
        {
          id: 'retention',
          heading: 'How long we keep it',
          body: (
            <>
              <p>
                Nothing is kept forever. The figures below are enforced by a
                scheduled job on the server, not by good intentions.
              </p>
              <ul>
                <li>
                  <strong>Analytics, location and device data</strong>:{' '}
                  {ANALYTICS_RETENTION_DAYS} days ({months(ANALYTICS_RETENTION_DAYS)}),
                  then deleted automatically.
                </li>
                <li>
                  <strong>Consent records</strong>:{' '}
                  {CONSENT_RETENTION_DAYS} days ({months(CONSENT_RETENTION_DAYS)}) from
                  the last time you changed your mind, then deleted automatically.
                </li>
                <li>
                  <strong>Server access logs</strong>:{' '}
                  {SERVER_LOG_RETENTION_DAYS} days, then rotated away by the
                  server&rsquo;s logrotate configuration.
                </li>
                <li>
                  <strong>Your account and its contents</strong>: until you
                  delete them or ask us to.
                </li>
                <li>
                  <strong>Sign in codes</strong>: 10 minutes, and single use.
                  They are deleted as soon as they expire or are spent.
                </li>
              </ul>
              <p>
                Deletion is a real delete: rows are removed from the database,
                not marked as hidden.
              </p>
            </>
          ),
        },
        {
          id: 'model-provider',
          heading: 'The language model provider',
          body: (
            <>
              <p>
                OwnMind reads each thing you save and labels it, so you can find
                it again by what you remember rather than by where you put it.
                That labelling needs a language model, which means the text and
                image details of something you saved may be sent to a{' '}
                <strong>language model provider</strong> for processing.
              </p>
              <p>
                This is our own processing of your own content, on our own
                instruction, for the purpose of running the product. It is not
                advertising, and no provider is permitted to use your content
                for its own training or to pass it on.
              </p>
              <p>
                <strong>As this site is currently configured, no language model
                provider is in use.</strong> Labelling runs locally using text
                analysis on our own server, and nothing you save leaves our
                infrastructure. We will update this section, and say so here
                first, before a provider is switched on.
              </p>
              <p>
                Only the saved content itself is ever sent, never your email,
                never your name, and never anything from the analytics tables.
              </p>
            </>
          ),
        },
        {
          id: 'sharing',
          heading: 'Who else sees it',
          body: (
            <>
              <p>
                Very few people, and none of them advertisers.
              </p>
              <ul>
                <li>
                  <strong>Nobody, for advertising.</strong> We run no ads, hold
                  no ad profile, and have no advertising partners.
                </li>
                <li>
                  <strong>Not sold or rented.</strong> We do not sell, rent,
                  trade or share personal data with anyone for money or for
                  anything else.
                </li>
                <li>
                  <strong>No cross-site tracking.</strong> Nothing we set follows
                  you to another site, and we read nothing another site sets.
                </li>
                <li>
                  <strong>Infrastructure providers only.</strong> Our hosting
                  and email providers process data solely to deliver the service,
                  on our instructions, and are not permitted to use it for their
                  own purposes.
                </li>
                <li>
                  <strong>Law enforcement.</strong> We will disclose data if
                  legally compelled, and will tell you unless the law forbids
                  it.
                </li>
                <li>
                  <strong>Cloudflare.</strong> Our domain is served through
                  Cloudflare, which handles network traffic and turns an IP
                  address into a country and city before it reaches us.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'security',
          heading: 'How we protect it',
          body: (
            <>
              <ul>
                <li>
                  <strong>HTTPS everywhere.</strong> All traffic is encrypted in
                  transit, and cookies carrying sessions are marked Secure.
                </li>
                <li>
                  <strong>Session cookies are httpOnly.</strong> Signing in sets
                  a cookie named <code>ownmind_session</code> holding a random
                  token. It is marked <code>httpOnly</code>, so scripts cannot
                  read it, and <code>Secure</code>, so it is never sent over an
                  unencrypted connection. That removes the most common way a
                  session is stolen.
                </li>
                <li>
                  <strong>No passwords stored.</strong> Signing in uses a
                  one-time code sent to your email, so there is no password
                  database to be breached. Codes expire in 10 minutes and work
                  once.
                </li>
                <li>
                  <strong>Rate limiting.</strong> Sign in codes are limited per
                  email and per address to stop one person being flooded or an
                  inbox being used to attack somebody else.
                </li>
                <li>
                  <strong>No identifiers in analytics tables.</strong> The
                  statistics tables are built so there is nothing to join back to
                  a person, not merely a promise not to join.
                </li>
                <li>
                  <strong>Secrets kept off the server filesystem where possible.</strong>{' '}
                  API keys live in environment files marked readable only by the
                  service account, and are never committed to source control.
                </li>
              </ul>
              <p>
                <strong>Breach notification.</strong> If a breach of personal
                data is likely to result in any risk to a person, we will notify
                the Data Protection Board of India and the affected individuals
                without undue delay, and in any case within the period the DPDP
                Act requires.
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
                Sections 11 to 14 of the DPDP Act give you the following. We
                apply them to personal data about visitors as well as account
                holders.
              </p>

              <h3>Access and review (section 11)</h3>
              <p>
                Ask what personal data we hold about you, get a copy of it, and
                get a summary of how it has been used. Sign in and your library
                is the fastest route; write to us for anything that sits behind
                it.
              </p>

              <h3>Correction (section 11)</h3>
              <p>
                Have inaccurate or incomplete personal data corrected. Your name
                can be changed from your library settings at any time. For
                anything else, write to us.
              </p>

              <h3>Erasure (section 12)</h3>
              <p>
                Ask us to delete personal data about you when we no longer need
                it, when we are unlawfully processing it, when the purpose is
                served, or when you withdraw consent. Use the{' '}
                <a href="/data-deletion">data deletion page</a> and it is done
                immediately and automatically.
              </p>

              <h3>Withdraw consent (section 6(6)))</h3>
              <p>
                Withdrawing consent is as easy as giving it:{' '}
                <strong>Cookie settings</strong> in the footer of any page. The
                change stops that category immediately. Withdrawal is not
                limited to withdrawing consent in advance, as the Act requires.
              </p>

              <h3>Nominate someone (section 15)</h3>
              <p>
                You may nominate another person to exercise these rights on your
                behalf in the event of your death or incapacity. Tell us in
                writing at{' '}
                <a href={`mailto:${officer.email}`}>{officer.email}</a>.
              </p>

              <h3>Nominee for the grievance officer</h3>
              <p>
                You may nominate another person to receive complaints on your
                behalf for the purposes of section 15. Write to us to register
                one.
              </p>

              <h3>Complaining to the Board (section 19)</h3>
              <p>
                If you are not satisfied with our response, you may complain to
                the{' '}
                <strong>
                  Data Protection Board of India, 6th Floor, Senapati Bapat
                  Marg, Mahalaxmi, Mumbai 400013
                </strong>{' '}
                , first through our grievance officer, and if the matter is not
                resolved to your satisfaction within{' '}
                <strong>30 days</strong>, to the Board.
              </p>
            </>
          ),
        },
        {
          id: 'children',
          heading: 'Children',
          body: (
            <>
              <p>
                This service is not directed at children, and we do not
                knowingly collect personal data from anyone under 18.
              </p>
              <p>
                We do not use age verification, because we do not believe it
                makes a meaningful difference here. If we learn that data came
                from a child under 18, we delete it. The parent or guardian of
                such a child may write to us at any time to ask for the same
                erasure.
              </p>
              <p>
                Where a child needs an account, a parent or legal guardian
                provides the consent. To register a child, the parent writes to{' '}
                <a href={`mailto:${officer.email}`}>{officer.email}</a> stating
                that they are the parent or guardian and consenting on the
                child&rsquo;s behalf. We will confirm this in writing before the
                account is used.
              </p>
            </>
          ),
        },
        {
          id: 'grievance-officer',
          heading: 'Grievance Officer',
          body: (
            <>
              <p>
                Named under section 35 of the DPDP Act. Complaints, requests and
                questions about this policy go to:
              </p>
              <p className="not-prose mt-4 rounded-[6px] border border-line bg-bg-alt p-4">
                <span className="block font-medium">{officer.name}</span>
                <span className="mt-1 block text-sm text-muted">Grievance Officer</span>
                <a
                  href={`mailto:${officer.email}`}
                  className="mt-2 block break-all text-sm text-accent-ink underline underline-offset-2"
                >
                  {officer.email}
                </a>
              </p>
              <p className="mt-4">
                We acknowledge every complaint within 7 days and resolve it
                within 30 days. If you are not satisfied with the outcome, you
                may complain to the Data Protection Board of India.
              </p>
            </>
          ),
        },
        {
          id: 'changes',
          heading: 'If this policy changes',
          body: (
            <>
              <p>
                The version number at the top of this page changes whenever the
                substance does. If a change affects what you consented to, your
                stored consent is treated as no consent and you are asked again
                rather than being carried forward on an old answer.
              </p>
              <p>
                Material changes are announced on the site before they take
                effect.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}