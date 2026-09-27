# OwnMind

A private place for everything you save. Links, notes, screenshots and articles go into one
box, get labelled automatically, and come back when you search. No folders, no tags, no filing.

---

## Running it

```bash
npm install
cp .env.example .env.local     # optional, OwnMind runs with no configuration
npm run dev                    # http://localhost:3000
```

Everything works with no environment variables at all. Without a model configured, labelling
falls back to local text analysis on the server.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | All four test suites, in order |
| `npm run test:data` | Data layer, search, links, spaces, recall, cascade deletes |
| `npm run test:smoke` | Public pages, metadata, auth gating, content rules |
| `npm run test:auth` | Signed in routes and APIs end to end against a running server |
| `npm run test:design` | Palette, shape, motion, semantics, accessibility, performance |
| `npm run favicon` | Regenerate and verify `favicon.ico` from the brand mark |

The last three need a server running on port 3000. `npm test` assumes that.

## How it is built

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router, Turbopack | Server Components, route handlers, static marketing pages |
| Language | TypeScript, strict | |
| Data | `node:sqlite` | Built into Node, so no native module to compile and no codegen |
| Search | SQLite FTS5 | Full text over titles, text, tags, summaries, URLs and domains, kept in sync by triggers |
| Styling | Tailwind v4 | Design tokens live in `globals.css` as CSS variables |
| Icons | Lucide | SVG only, no icon font, no emoji |
| Fonts | `next/font` | Self hosted, no third party font request |
| Auth | scrypt plus database sessions | Opaque 256 bit tokens, `HttpOnly`, revocable |

There is no ORM. The schema is plain SQL in `src/lib/db.ts` and the database file is a single
portable file.

### Layout

```
src/
  app/
    (marketing)/       public pages, all statically prerendered
    (auth)/            sign in and sign up
    (workspace)/       the signed in library, server rendered per request
    api/               save, search, export, media
  components/          presentational pieces
  lib/
    db.ts              connection, migrations, schema
    cards.ts           the whole card domain, including search
    session.ts         sessions and the signed in user
    password.ts        scrypt hashing
    enrich.ts          decides kind, title, tags, summary
    ai.ts              optional model calls, all fail soft
    extract.ts         page fetching and readability style extraction
    media.ts           upload storage with strict name validation
    actions/           server actions, each re-checking auth
scripts/               test suites and the favicon generator
```

### Notes on a few decisions

**No ORM and no native modules.** `node:sqlite` is part of Node 22 and later. That removes
`better-sqlite3` and its prebuilt binaries, and removes the codegen step entirely.

**Search is one index over everything.** A note, a bookmark, a screenshot and an article are the
same row with a different `kind`. That is what lets a single query cover a screenshot's OCR text
and a paragraph of prose at the same time. FTS5 is maintained by triggers on the `cards` table,
so it cannot drift from the data.

**Spaces are saved searches, not folders.** A space stores a rule and its membership is rebuilt
from that rule. Tag something later and it appears in the matching space with no action from you.
There is nothing to file and nothing to maintain.

**Labelling degrades.** `enrich.ts` produces a usable result from local heuristics first. If a
model is configured, it is asked to do better and the answer is merged over the top. If the call
fails or no key is set, nothing changes and the product stays usable.

**The product route is `/library`, not `/app`.** Next 16 silently excludes a route at `/app` from
the build, because it collides with the app directory name. `/library` is a better URL anyway.

**Marketing pages read no cookies.** Reading the session in a layout forces every page under it
to render per request. The public pages are fully static, and the sign in page redirects an
already authenticated visitor to their library instead.

## Design rules this project holds itself to

These are enforced by `npm run test:design` and `npm run test:smoke`, not just by intention.

- No purple, anywhere. The accent is a single brick red, `#b4462a`.
- No gradients on backgrounds or controls.
- No circular or pill buttons. Controls are 6px radius with a 1px border.
- No emoji. All icons are inline SVG.
- No em dashes in any copy.
- No stock photography, no AI generated images, no third party image hosts. Product visuals are
  drawn with the real design tokens.
- No fake testimonials, user counts, or metrics sections.
- No vague hero copy. The headline states what the thing does.
- No third party analytics, ad pixels, or external scripts of any kind.
- Transitions are limited to colour, border and opacity. No scroll triggered reveals, no parallax,
  and `prefers-reduced-motion` is respected.
- No "made with AI" badge, anywhere.

## Launch checklist

Everything below is done except the items that need a real account, a real domain, or a decision
that is not ours to make.

- [x] Privacy policy at `/privacy`
- [x] Terms of service at `/terms`
- [x] Custom favicon (`favicon.ico` at 16, 32 and 48px, plus an SVG icon)
- [x] Open Graph and Twitter metadata
- [x] `robots.txt` and `sitemap.xml`
- [x] Dark and light mode, no flash on load
- [x] Self hosted fonts
- [x] JSON export and account deletion
- [x] Password reset, with single use tokens that sign out every device
- [x] Responsive down to a small phone
- [ ] **Set the real domain.** Update `name`, `domain`, `url` and the contact addresses in
      `src/lib/site.ts`. Metadata, `robots.txt`, the sitemap, the legal pages and the footer all
      read from there.
- [ ] **Fill in the registered operator details.** The privacy policy and terms currently use
      `site.legalName` and `site.location`. Put the real registered entity, address and company
      number in before taking payment.
- [ ] **Review the legal text with a lawyer.** It is written to be accurate about what the code
      does, which is not the same as being enforceable advice in your jurisdiction.
- [ ] **Configure outbound email.** Password reset works today, but with no
      `OWNMIND_MAIL_API_KEY` the link is only written to the server log, so nobody would
      actually receive it. In development the link is printed to the console, which is how
      the flow is tested.
- [ ] **Add payment processing.** The pricing page is written and links to signup, but no payment
      provider is wired up. Do not take money until plans are actually enforced server side.
- [ ] **Verify the AI disclosure matches reality.** `/privacy` and `/faq` state whether labelling
      is enabled, and the settings page reads it from `isAiConfigured()`. Re read both once a
      provider is chosen.
- [ ] **Build the browser extension.** `/api/save` exists and is ready for it. The marketing pages
      currently state plainly that there is no extension yet.
- [ ] **Confirm the retention claim.** The privacy policy says server logs are kept 30 days. That
      has to match the host or proxy configuration in production.

## Honest limitations

Stated on `/how` as well, because a product page that overstates itself is worse than one that
does not.

- No browser extension yet. Saving from another page means copying the link across.
- No native mobile apps. The site is responsive and works on a phone.
- No PDF analysis and no video upload. The schema has room for both, neither is implemented.
- No public API and no team or shared spaces. Sharing is deliberately out of scope while sharing
  means moderation and a feed.
- The page extractor is a density heuristic, not a full Readability port. It is good on articles,
  newsletters and documentation, which is what people actually save, and it will miss some pages.
- Accounts are email and password only. There is no social sign in, so the password is the
  only way in, and a reset email depends on outbound mail being configured.

## Licence

Private. All rights reserved.
