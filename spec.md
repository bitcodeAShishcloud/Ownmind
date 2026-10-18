# Drop passwords, use Cloudflare Turnstile

Two changes to how people get in. They touch the same files, so they belong
together.

## One: no passwords anywhere

Signing up asks for a name and an address, sends a code, and the code is the
whole proof. Nobody picks a password, so nobody can forget one, so there is no
password to reset.

**Sign up, two pages:**

1. `/signup` — name and the challenge
2. `/signup/email` — address and the code, both visible from the first paint.
   Accepting the code creates the account and signs in.

**Sign in, one page:**

1. `/signin` — address, the challenge, and the code. Accepting the code signs
   in.

There is no password screen anywhere. Delete `/signup/password`,
`/signin/password`, and the step actions that fed them.

The check that already proves an address on sign-in stays: no account, no
mail. That is what keeps the form from being used to fill an inbox.

### The schema

`users.password_hash` is `not null`. Accounts created by this flow have no
password, so a migration makes the column nullable. Existing rows keep their
hash and nobody has to do anything — they sign in with a code like everyone
else, and the stored hash just sits there unread.

Do not drop the column. Dropping it discards hashes nobody needs and buys
nothing.

### What goes

- `src/app/(auth)/forgot-password/` and `src/app/(auth)/reset-password/`, with
  their page files
- `src/lib/actions/reset.ts`
- `src/components/forgot-password-form.tsx` and `src/components/reset-password-form.tsx`
- The `password_resets` table from the schema
- Any link to those two pages, anywhere

`hashPassword` and `verifyPassword` go with them if nothing else uses them.
Check first — `delete-account` or similar may still need one.

### The rules that stay

- The address comes from the saved step, never from the form.
- The pending row is deleted when the flow finishes, either way.
- Expired rows, codes and rate-limit windows must not pile up.
- One code, typed once. No page asks for it twice.
- The flow token stays in its cookie. Nothing in the URL, nothing in a hidden
  field.

## Two: Cloudflare Turnstile replaces the arithmetic

The current challenge is `What is A + B?` with a signed token. A script
solves that instantly and the token replays for its whole lifetime.

Turnstile is free, needs no account to try, and is built for exactly this.
Swap it in.

- Render the widget in a client component, themed to match the panel around it,
  sized so it does not jump the layout.
- Verify the response server-side against the Turnstile siteverify endpoint
  before anything else happens in the action. A client that skips the widget
  has no token, and is refused.
- The token is single-use and short-lived. That removes the hand-rolled
  attempt counting and the token table.
- Delete `src/lib/captcha.ts`.

### Keys

Turnstile gives two: a site key for the browser and a secret for the server.
Both come from env vars.

Until real keys exist, default to Cloudflare's own published test keys, which
accept everything and need no account. They are a placeholder, not a defence —
say so plainly wherever they are set, and fail loudly in the log so nobody
mistakes a working form for a protected one. Swapping in real keys is two env
values and no code.

### The design audit

`scripts/audit-design.mjs` asserts no third-party script on the landing page.
Turnstile is confined to the auth pages, so it must never appear on the
landing page. If the audit starts failing because of it, allowlist that one
host explicitly and narrowly rather than widening the rule.

## Rules

- `npm run build`, `typecheck`, `lint`, `test:data`, `test:design` all green.
- The challenge is verified on the server on every path that sends a code.
  Never trust that the client rendered it.
- Rate limits on sending stay exactly as they are.
- No new pages, settings, or features beyond this.

## Out of scope

- Session passkeys or WebAuthn.
- One-time links instead of codes.
- Changing how sessions or the library work.