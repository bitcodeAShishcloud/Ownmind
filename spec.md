# Rebuild the sign-up and sign-in pages

## Why

The current version of these pages works, but five things about it are wrong.
Fix all five.

## The five problems

### 1. The middle page hides half its own form

`/signup/email` renders the email field, and when the code is sent the same
URL quietly swaps to the code field. One page, two layouts, decided at runtime
by whether a code was sent. The first and last pages are real navigations; this
one is not. People cannot tell what the page wants from them.

Every page should be one step, reachable by its own address, showing
everything it will ever ask for as soon as it loads. No swapping.

### 2. Nothing stops the code from being sent over and over

`sendOtpCode` has no limit on how often it runs, and nothing checks that the
address belongs to a real account before mailing it. Anyone can point the site
at an address they do not own and fill that inbox with mail, as fast as the
server will go.

Send limits, per address and per caller, before any mail goes out.

### 3. The CAPTCHA is close to free to beat

The challenge is `What is A + B?` with a signed token that is good for five
minutes and can be replayed as many times as the attacker likes. There is no
attempt count. A script solves it in microseconds.

Tokens must be single-use, capped after a few wrong answers, and regenerated
every time the page renders. The arithmetic should not always be addition.

### 4. The step token is in the address bar

`pending_auth.token` travels as `?token=…`. That lands in browser history, in
the `Referer` header of anything the page loads, and in the access log. It is
the key to the whole sign-up attempt.

It belongs in a cookie the server reads. Nothing in the URL, nothing in the
form, no hidden field.

### 5. The pages do not look like the rest of the site

The forms use classes and buttons that appear nowhere else in OwnMind. Compare
with `src/components/forgot-password-form.tsx`, which is the standard to match:
`panel p-6` from the auth layout, `h1.text-2xl`, the `mt-1.5 mb-6 text-sm
text-muted` subtitle, the `rounded-[6px] border border-accent/40 bg-accent-wash`
error block, `btn btn-primary w-full` with a `Loader2` spinner while pending,
and the centred `text-sm text-muted` link at the bottom. Match it exactly.

## Target shape

**Sign up, three pages, one step each:**

1. `/signup` — name and CAPTCHA. Submit checks both, saves the name, sends them on.
2. `/signup/email` — email and the 6-digit code, both visible at once. A
   secondary button sends the code; the main button checks it. On success, move on.
3. `/signup/password` — password. Submit creates the account and signs in.

**Sign in, two pages, one step each:**

1. `/signin` — email, CAPTCHA and the 6-digit code, all visible at once.
2. `/signin/password` — password. Submit signs in.

The code is typed once. The password screen only appears after the code has
been accepted.

## Rules

- No token in the URL, the form, or a hidden field. The server reads it from a
  cookie set by the previous step.
- Each step re-reads its state from the database. Never trust what the form or
  the URL says about who someone is or where they are.
- The pending row is deleted the moment the flow finishes, on success and on
  failure alike.
- Prune expired pending rows whenever a new flow starts.
- Expired rows, codes and rate-limit windows must not accumulate.
- Keep `npm run build`, `typecheck`, `lint`, `test:data`, `test:design` green.
- Nothing outside `src/lib/{db,otp,captcha,session}.ts`,
  `src/lib/actions/auth.ts`, `src/components/auth-form.tsx` and the pages
  under `src/app/(auth)/` should change.

## Out of scope

- Delivering the mail. Resend still returns 403 because the domain is not
  verified in the dashboard. Codes are written to the database and that is
  enough to test against.
- Two-factor recovery codes, backup codes, remember-this-device.
- Any new page, setting, or feature beyond these five fixes.