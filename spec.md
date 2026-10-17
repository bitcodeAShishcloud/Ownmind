# OwnMind Multi-Page Auth with OTP + CAPTCHA

## What
Implement a multi-step authentication flow for OwnMind where signup spans exactly 3 pages and signin spans exactly 2 pages, with OTP verification and CAPTCHA fully operational for both.

## Requirements
- Signup page 1: Name + CAPTCHA → validate and store temporarily → redirect to email page
- Signup page 2: Email → auto-send OTP via Resend → verify OTP → redirect to password page
- Signup page 3: Password + OTP verify → create account → session → redirect to /library
- Signin page 1: Email + CAPTCHA → auto-send OTP via Resend → redirect to verify page
- Signin page 2: Password + OTP verify → verify credentials → session → redirect to /library
- OTP codes are 6-digit numeric, single use, expire after 10 minutes, stored in SQLite
- CAPTCHA is self-hosted math challenge with HMAC-signed tokens (no third-party scripts)
- Pending auth state between pages stored in `pending_auth` table keyed by token
- Session cookie has `domain: 'sriprayagclasses.in'` for www/non-www sharing
- All pages use existing OwnMind design system (brick red #b4462a, 6px radius, Tailwind v4)

## Technical Constraints
- Framework: Next.js 16, App Router, Turbopack, React 19
- Database: node:sqlite (built-in, WAL mode)
- Language: TypeScript, strict
- Mail: Resend API (OWNMIND_MAIL_API_KEY configured)
- Domain: sriprayagclasses.in (SSL already active)
- No third-party analytics, ad pixels, or external scripts

## Out of Scope
- Payments/Stripe integration
- Social sign-in (Google, GitHub, etc.)
- PDF/video analysis
- Browser extension
- Team/shared spaces
