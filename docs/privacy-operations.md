# Privacy operations

How the consent system and first party analytics are actually run. The
[Privacy Policy](/privacy) is what a visitor reads; this is what you read when
something breaks at 3am.

## What collects what

| Category | What is collected | Where it lands | Default |
|---|---|---|---|
| necessary | `ownmind_session`, `ownmind_pending_auth`, `cc_consent` | cookies / localStorage | on |
| preferences | `ownmind-theme` | localStorage | off |
| analytics | `pageview`, `scroll_50`, `outbound_click` | `analytics_events` | off |
| location | country, region, city, rounded coordinates | `analytics_events` | off |
| device | browser, OS, screen, viewport, language, timezone, mobile/desktop | `analytics_events` | off |

There is no marketing category and no code path that could create one.

## The one rule that matters

Nothing is sent that the visitor has not allowed **for that category**. This is
enforced in three independent places, so a bug in one does not leak:

1. `src/lib/analytics-client.ts` — `granted()` re-reads localStorage on every
   send, so withdrawal takes effect on the next event rather than the next page
   load.
2. `start()` tears down every listener before attaching new ones, so a
   withdrawn category cannot keep its old handler alive.
3. `src/app/api/track/route.ts` validates the shape of what arrives. It cannot
   tell whether the person consented, so this is a backstop against malformed
   data, not a substitute for the client check.

## Retention

Numbers live in `src/lib/retention.ts` and nowhere else. The policy page and
the dashboard import them, so the published figure and the enforced figure
cannot drift apart.

| What | Kept | Enforced by |
|---|---|---|
| `analytics_events` | 365 days | `ownmind-retention.timer` |
| `consent_logs` | 365 days from `last_seen_at` | `ownmind-retention.timer` |
| expired `otp_codes`, `pending_auth` | immediate | same job |
| nginx access logs | 90 days | `/etc/logrotate.d/ownmind-nginx` |

```bash
systemctl list-timers ownmind-retention.timer   # when it next runs
systemctl start ownmind-retention.service      # run it now
npm run retention                              # same, from the shell
journalctl -u ownmind-retention -n 50          # what it did
```

The job is idempotent. Every statement is a delete bounded by a timestamp, so a
second run a minute later removes nothing and does not error. That is
deliberate: a cron job that fails on an empty table eventually gets switched
off.

## The dashboard

`/admin/privacy`, closed by `OWNMIND_ADMIN_TOKEN`.

```bash
# generate one
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Set it in `/etc/ownmind/env` and restart. **If it is unset the dashboard is
closed**, not open. A dashboard left unlocked because an environment variable
was forgotten would publish every visitor's city and reading habits.

The page is `force-dynamic` on purpose. The public pages are static, and a build
can evaluate `process.env`: a dashboard that read the token at build time would
freeze the answer the build machine happened to have.

## Turning it off in an emergency

```bash
# stop collection, keep the dashboard readable
sed -i 's/^OWNMIND_ADMIN_TOKEN=/#OWNMIND_ADMIN_TOKEN=/' /etc/ownmind/env
# or remove the site key, which drops the whole gate to Cloudflare's test keys
sed -i 's/^OWNMIND_TURNSTILE_SITE_KEY=/#OWNMIND_TURNSTILE_SITE_KEY=/' /etc/ownmind/env
systemctl restart ownmind
```

To see what the site has actually collected:

```bash
node -e "
const { DatabaseSync } = require('node:sqlite');
const d = new DatabaseSync('/var/lib/ownmind/ownmind.db');
console.log('events :', d.prepare('select count(*) c from analytics_events').get().c);
console.log('consent:', d.prepare('select count(*) c from consent_logs').get().c);
"
```

## Adding a category

1. Add it to `OPTIONAL_CATEGORIES` in `src/lib/consent.ts` and describe it in
   `CATEGORY_COPY`.
2. Add a migration for its column or its own table.
3. Gate its collector on `granted('newcategory')` in `analytics-client.ts`.
4. Add a retention decision to `retention.ts`.
5. List the storage key in `/cookie-policy`.
6. **Bump `consentVersion` in `site.ts`.** Without that, everyone keeps the
   choice they made before the category existed and is never asked about it.

## Adding a third party tool

Stop and ask first. Anything that loads from another origin before consent, or
that sets its own cookie, changes the answer to "no ads, no third party
trackers" on the policy page. If the answer is yes, the policy and the cookie
policy both change before the tool ships, not after.