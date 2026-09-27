import { PageHeader, Section } from '@/components/page-header'
import { site } from '@/lib/site'

export const metadata = {
  title: 'Questions',
  description:
    'How OwnMind labels what you save, what it stores, what it does not do, and how to get your data out.',
  alternates: { canonical: '/faq' },
}

const GROUPS: Array<{ heading: string; items: Array<{ q: string; a: string }> }> = [
  {
    heading: 'Saving things',
    items: [
      {
        q: 'Do I have to choose a folder or a category?',
        a: 'No. There is no folder field anywhere in the product. You put something in the box and the labelling happens on the way in.',
      },
      {
        q: 'What happens to the text of a page I save?',
        a: 'The menus, adverts, cookie banners and scripts are removed and the readable body is kept, along with the title, author and site name. On paid plans that text is stored in full so the article still opens if the original is taken down.',
      },
      {
        q: 'Can I correct a title or a tag that was wrong?',
        a: 'Yes. Every card has an edit form for the title, the tags and the text. Your version wins and stays won.',
      },
      {
        q: 'Is there a browser extension?',
        a: 'Not yet. Saving from another page means copying the link into the box. The extension is being built, and we would rather say so than list it as a feature.',
      },
      {
        q: 'What size images can I add?',
        a: 'Images are resized and compressed in your browser before they are uploaded, so a phone photo arrives at a sensible size. Very large files are rejected with a message rather than failing silently.',
      },
    ],
  },
  {
    heading: 'Finding things',
    items: [
      {
        q: 'What if I do not remember any words from a page?',
        a: 'Search for something you do remember. If it was an image, search the colour, since every image card carries the dominant colour as a tag. If it was text on a screenshot, that text is searchable too.',
      },
      {
        q: 'How is this different from just using browser bookmarks?',
        a: 'Browser bookmarks are a tree of links that you have to file by hand. OwnMind has no tree, stores the content rather than only the address, and indexes the words, colours and concepts inside what you saved.',
      },
      {
        q: 'Why did a search for a common word return too much?',
        a: 'Narrow it. Use tag: and kind: to push the search towards one meaning, and put a minus in front of a word to push it away.',
      },
      {
        q: 'Does search work on words in images?',
        a: 'When image labelling is enabled, any legible text in a screenshot is transcribed and added to the index, so you can search a word you only ever saw inside a picture.',
      },
    ],
  },
  {
    heading: 'Your data',
    items: [
      {
        q: 'Who can see what I save?',
        a: 'You. There are no public profiles, no sharing links and no way for another user to reach your library.',
      },
      {
        q: 'Do you use analytics or tracking?',
        a: 'No third party analytics scripts and no advertising pixels are present in the application. Server logs are kept for a short period for security and to diagnose faults.',
      },
      {
        q: 'What is sent to the model provider?',
        a: 'Only the content of the thing being labelled, so either its text or the image. Your email address, your name and your IP address are not part of that request. Requests go out over HTTPS.',
      },
      {
        q: 'Can I export everything?',
        a: 'Yes. Settings has a download button that produces one JSON file containing every card, tag, summary, link and space. It is immediate and needs no request.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Settings, at the bottom. You type your email to confirm, and the account and everything attached to it is removed.',
      },
    ],
  },
  {
    heading: 'Billing',
    items: [
      {
        q: 'What happens if I cancel?',
        a: 'Nothing is deleted. Your library stays readable on the free plan and you keep exporting. You lose the extra storage and the longer articles stored in full.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Within 30 days of a charge, on request. Email the support address.',
      },
      {
        q: 'Do you offer a student discount?',
        a: 'Write to the support address with proof of enrolment and we will sort it.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Questions"
        title="The things people ask before they trust a tool with their saved reading"
        lede="If something here is unclear, or the answer you need is missing, write and ask."
      />

      <Section>
        <div className="flex flex-col gap-12">
          {GROUPS.map((group) => (
            <div key={group.heading}>
              <h2 className="text-2xl">{group.heading}</h2>
              <dl className="mt-5 flex max-w-3xl flex-col divide-y divide-line border-y border-line">
                {group.items.map((item) => (
                  <div key={item.q} className="py-5">
                    <dt className="text-[0.9375rem] font-semibold">{item.q}</dt>
                    <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-3xl rounded-[6px] border border-line bg-bg-alt p-6">
          <h2 className="text-lg">Still not answered?</h2>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
            Write to{' '}
            <a
              href={`mailto:${site.supportEmail}`}
              className="text-accent-ink underline underline-offset-2"
            >
              {site.supportEmail}
            </a>
            . You will get an answer from whoever wrote the code, usually within a day or two.
          </p>
        </div>
      </Section>
    </>
  )
}
