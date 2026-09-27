import Link from 'next/link'
import { PageHeader, Section } from '@/components/page-header'
import { site } from '@/lib/site'

export const metadata = {
  title: 'Why OwnMind',
  description:
    'Why OwnMind has no folders, no ads, no social features and no public sharing, and what the operator gets to keep.',
  alternates: { canonical: '/why' },
}

const GIVEN_UP = [
  {
    thing: 'Folders and tags',
    why: 'You already know that filing takes longer than finding. A tool that makes you maintain a taxonomy is asking for work before it returns any.',
  },
  {
    thing: 'Social features',
    why: 'A public library turns private saving into a performance. Sharing would also mean moderation, ranking and a reason to keep you here, which is the opposite of the point.',
  },
  {
    thing: 'Advertising',
    why: 'Ads pay for themselves by watching you. This app knows what you read, what you save and what you are researching. That is not something to hand to an ad network.',
  },
  {
    thing: 'Analytics scripts',
    why: 'There are none in this application. We do not need to know which button you hovered, and neither does anyone else.',
  },
  {
    thing: 'Vanity numbers',
    why: 'No user counter, no testimonial wall, no logo strip. Until there are real customers willing to be named, a made up number is just a lie with a rounded font.',
  },
  {
    thing: 'A folder-shaped mind',
    why: 'Your memory is not organised by category. It is organised by resemblance, colour, mood and the situation you saved something in. The index follows that, not a folder tree.',
  },
]

export default function WhyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Why OwnMind"
        title="A private place to put things, run by the person who uses it"
        lede={
          <>
            Most tools that hold your saved material want something in return: attention,
            advertising inventory, a network effect, or your data. This one is built so that it
            does not need any of it.
          </>
        }
      />

      <Section>
        <h2 className="text-2xl">What we gave up, and why</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          Every one of these would have made the product easier to grow. None of them make it
          better to use.
        </p>

        <dl className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {GIVEN_UP.map((item) => (
            <div key={item.thing}>
              <dt className="font-sans text-[0.9375rem] font-semibold">{item.thing}</dt>
              <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{item.why}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section alt>
        <h2 className="text-2xl">What you actually get to keep</h2>
        <div className="mt-4 flex max-w-2xl flex-col gap-4 text-[0.9375rem] leading-relaxed text-ink-2">
          <p>
            Your notes, links, images, tags, summaries and the connections you made between
            items are yours. Not licensed back to you on request, yours.
          </p>
          <p>
            Settings has a button that exports the lot as a single JSON file. It works without
            asking anyone. If this service disappeared tomorrow, you would still have the text
            and the structure.
          </p>
          <p>
            Deleting your account removes the account and every row attached to it. There is no
            retention period and no soft delete holding a second copy.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/privacy" className="btn btn-outline h-10 px-5">
            Privacy policy
          </Link>
          <Link href="/terms" className="btn btn-outline h-10 px-5">
            Terms of service
          </Link>
        </div>
      </Section>

      <Section>
        <h2 className="text-2xl">Who is behind it</h2>
        <div className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          <p>
            {site.legalName} is a small independent project, based in {site.location}. It is
            funded by subscriptions rather than investors, which is the practical reason there
            is no growth target attached to your data.
          </p>
          <p className="mt-3">
            If something is wrong, write to{' '}
            <a href={`mailto:${site.supportEmail}`} className="text-accent-ink underline underline-offset-2">
              {site.supportEmail}
            </a>
            . You will get a reply from the person who wrote the code.
          </p>
        </div>
      </Section>

      <Section alt>
        <h2 className="text-2xl">The trade, stated plainly</h2>
        <div className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
          <p>
            A single person running a service with no ads and no data selling still has hosting,
            storage and a model provider to pay for. Subscriptions are how that gets covered.
            There is no free tier that is engineered to become a paid one later, and no feature
            held back to force an upgrade.
          </p>
          <p className="mt-3">
            What the paid plans add is capacity and the more expensive labelling work, not the
            ability to find your own notes. See the{' '}
            <Link href="/pricing" className="text-accent-ink underline underline-offset-2">
              pricing page
            </Link>{' '}
            for the exact split.
          </p>
        </div>
      </Section>
    </>
  )
}
