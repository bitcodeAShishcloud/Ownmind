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

## Approximate location

The location category resolves the network address on our own server against a
MaxMind GeoLite2 City database held at:

```
/var/lib/ownmind/geoip/GeoLite2-City.mmdb
```

Cloudflare's `cf-*` headers are consulted first and act as a fallback. In
practice that means country resolves from the edge and city comes from MaxMind,
because the free Cloudflare plan does not send a usable `cf-ipcity`.

**Nothing is sent anywhere to be looked up.** The address is read, looked up in a
local file, and the address itself is not stored. Only city, region and country
come out.

### Setup

```bash
# 1. Free account and key: https://www.maxmind.com/en/geolite2/signup
#    Read them off https://www.maxmind.com/en/accounts/current/license-key

# 2. Put both values in .env alongside everything else, mode 600
OWNMIND_MAXMIND_ACCOUNT_ID=YOUR_ACCOUNT_ID
OWNMIND_MAXMIND_LICENSE_KEY=YOUR_LICENSE_KEY
# 3. Fetch, ~50 MB. Reads .env itself and writes /etc/GeoIP.conf (mode 600)
#    for geoipupdate, which reads nothing else.
npm run fetch-geoip

# 4. Restart so the reader picks it up
systemctl restart ownmind
curl -s https://sriprayagclasses.in/api/geo
```

Downloads go through MaxMind's own `geoipupdate`, not a hand written
request. An earlier version of this page described a direct download URL;
MaxMind changed how that authenticates and the old endpoint now refuses every
request, valid key or not. `geoipupdate` is what their documentation points
at and keeps working when they change things again.

Without the key or the file, `/api/geo` returns all nulls and the site is
unaffected. Nothing throws, and no visitor sees an error.

### Keeping it current

```bash
systemctl list-timers ownmind-geoip.timer    # next run
systemctl start ownmind-geoip.service        # update now
journalctl -u ownmind-geoip -n 20
```

MaxMind publishes twice weekly. A stale database shows up as a city that does
not resolve, not as a wrong city.

The download lands in a temporary directory and is renamed onto the live file.
Rename on one filesystem is atomic, so a running reader sees the whole old
database or the whole new one, never a half written file.

### Rotating the key

A newly generated key is not accepted by `geoipupdate` straight away. Right
after rotating, expect:

```
401 {"code":"AUTHORIZATION_INVALID","error":"Your account ID or license key could not be authenticated."}
```

That is propagation delay, not a mistake, and it clears on its own in a few
minutes. The obvious way to tell the difference: a direct `HEAD` against the
documented download endpoint will return 200 for a key that `geoipupdate` is
still refusing.

```bash
curl -o /dev/null -I -L -w '%{http_code}\n' \
  -u "ACCOUNT_ID:THE_NEW_KEY" \
  'https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz'
```

200 means the key is fine and only the update path has not caught up. Wait,
then run `npm run fetch-geoip`.

Two things to know about rotating:

- Regenerating does **not** invalidate the previous key. Both work until the
  old one is deleted, so removing it is a separate step.
- Keep the previous key working until the new one has been proven with a real
  download. The weekly job is the thing that breaks otherwise, and it fails
  quietly once a week rather than loudly once.

### Licence

The key lives in `/root/Ownmind/.env` and is never committed. The database is
gitignored. MaxMind's GeoLite2 terms require the product to be attributed, which
the Cookie Policy does.

## Changing a secret

Everything lives in `.env`, and `npm run env` is the one command for it. It
never prints a value, only whether one is set and how long it is, so a key can
be rotated from the terminal rather than pasted into a chat.

```bash
npm run env                       # list every key, values hidden
npm run env -- check               # what is missing
npm run env -- set OWNMIND_ADMIN_TOKEN=<new>
npm run env -- set KEY=value KEY2=value
npm run env -- set OWNMIND_MAIL_FROM="OwnMind <no-reply@example.com>"
npm run env -- unset OWNMIND_AI_API_KEY
npm run env -- path                # where the file is
```

Setting a value rewrites just that line, so the comments in the file survive. The
file stays mode 600. Restart the service afterwards:

```bash
systemctl restart ownmind
```

Order matters when rotating MaxMind. See below.

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

Set it in `/root/Ownmind/.env` and restart. **If it is unset the dashboard is
closed**, not open. A dashboard left unlocked because an environment variable
was forgotten would publish every visitor's city and reading habits.

The page is `force-dynamic` on purpose. The public pages are static, and a build
can evaluate `process.env`: a dashboard that read the token at build time would
freeze the answer the build machine happened to have.

## Turning it off in an emergency

```bash
# stop collection, keep the dashboard readable
sed -i 's/^OWNMIND_ADMIN_TOKEN=/#OWNMIND_ADMIN_TOKEN=/' /root/Ownmind/.env
# or remove the site key, which drops the whole gate to Cloudflare's test keys
sed -i 's/^OWNMIND_TURNSTILE_SITE_KEY=/#OWNMIND_TURNSTILE_SITE_KEY=/' /root/Ownmind/.env
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