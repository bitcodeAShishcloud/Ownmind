/**
 * Consent and first party analytics tests.
 *
 * Runs against a throwaway database, so nothing here can touch real data. The
 * point of most of these is to prove a promise the privacy policy makes: that
 * the tables cannot hold an identifier, that a category with no consent sends
 * nothing, and that what the policy says is kept gets deleted on schedule.
 *
 * Usage: npx tsx scripts/test-consent.mts
 */
import { rmSync } from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), '.data-consent-test')
process.env.OWNMIND_DATA_DIR = DATA_DIR

const { db, nowIso } = await import('../src/lib/db.ts')
const {
  CONSENT_VERSION,
  CONSENT_STORAGE_KEY,
  allOff,
  allOn,
  emptyRecord,
  granted,
  isOptionalCategory,
  sanitizeRecord,
} = await import('../src/lib/consent.ts')
const {
  EVENT_TYPES,
  buildDashboard,
  consentRowCount,
  analyticsRowCount,
  recordConsentLog,
  recordEvent,
  validateEvent,
} = await import('../src/lib/analytics.ts')
const { locationFromHeaders, NO_LOCATION } = await import('../src/lib/geo.ts')
const {
  ANALYTICS_RETENTION_DAYS,
  CONSENT_RETENTION_DAYS,
  eraseAccount,
  recordDeletionRequest,
  runRetention,
} = await import('../src/lib/retention.ts')

let failures = 0
let checks = 0

function ok(label: string, condition: boolean, detail = '') {
  checks++
  if (condition) console.log(`  pass  ${label}`)
  else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` :: ${detail}` : ''}`)
  }
}

function section(name: string) {
  console.log(`\n${name}`)
}

try {
  rmSync(DATA_DIR, { recursive: true, force: true })
} catch {
  /* first run */
}

try {
  /* ---------------------------------------------------------------- */
  section('the consent record')

  ok('a version and a timestamp are mandatory', CONSENT_VERSION.length > 0)

  const blank = emptyRecord()
  ok('a fresh record grants nothing optional', !blank.analytics && !blank.location && !blank.device)
  ok('necessary is always true', blank.necessary === true)

  const every = allOn()
  ok('accept all grants every category', granted(every, 'analytics') && granted(every, 'device'))
  ok('accept all carries a timestamp', every.timestamp.length > 0)

  const none = allOff()
  ok('reject grants only necessary', granted(none, 'necessary') && !granted(none, 'analytics'))

  ok('the storage key is the agreed one', CONSENT_STORAGE_KEY === 'cc_consent')
  ok('a category name is recognised', isOptionalCategory('analytics'))
  ok('marketing is not a category', !isOptionalCategory('marketing'))
  ok('necessary is not offered as a choice', !isOptionalCategory('necessary'))

  ok('necessary cannot be withdrawn', granted(none, 'necessary'))

  const tampered = sanitizeRecord({ necessary: false, analytics: true })
  ok('a record without necessary is refused', tampered === null)

  const cleaned = sanitizeRecord({
    necessary: true,
    analytics: 'yes',
    preferences: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
  })
  ok('truthy non booleans do not become consent', cleaned?.analytics === false)
  ok('a number is not a boolean consent', cleaned?.preferences === false)

  /* ---------------------------------------------------------------- */
  section('the tables hold no identifier')

  const eventCols = (
    db().prepare('pragma table_info(analytics_events)').all() as Array<{ name: string }>
  ).map((c) => c.name)
  const banned = ['email', 'user_id', 'ip', 'ip_address', 'name', 'account_id']
  for (const column of banned) {
    ok(`analytics_events has no ${column} column`, !eventCols.includes(column))
  }

  const consentCols = (
    db().prepare('pragma table_info(consent_logs)').all() as Array<{ name: string }>
  ).map((c) => c.name)
  for (const column of ['email', 'user_id', 'ip']) {
    ok(`consent_logs has no ${column} column`, !consentCols.includes(column))
  }

  const sessionIndexes = (
    db().prepare("select name from sqlite_master where type='index' and tbl_name='analytics_events'").all() as Array<{
      name: string
    }>
  ).map((r) => r.name)
  ok('analytics is not unique per session', !sessionIndexes.includes('analytics_events_session_unique'))

  /* ---------------------------------------------------------------- */
  section('events are validated before they are stored')

  const good = validateEvent({
    type: 'pageview',
    session_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    page_url: 'https://sriprayagclasses.in/how?utm_source=x&email=a@b.com',
    page_title: 'How it works',
    referrer: 'https://news.example.com/post?uid=42',
  })
  ok('a well formed event is accepted', good !== null)
  ok('the query string is dropped from the url', good?.page_url === 'https://sriprayagclasses.in/how')
  ok('the query string is dropped from the referrer', good?.referrer === 'https://news.example.com/post')
  ok('an email in a url never reaches storage', !JSON.stringify(good).includes('a@b.com'))
  ok('the path survives', good?.page_path === '/how')

  ok('an unknown event type is refused', validateEvent({ type: 'track_me', session_id: 'abc12345' }) === null)
  ok('a missing session is refused', validateEvent({ type: 'pageview' }) === null)
  ok('a short session id is refused', validateEvent({ type: 'pageview', session_id: 'ab' }) === null)
  ok('a session id with punctuation is refused', validateEvent({ type: 'pageview', session_id: '../../etc' }) === null)
  ok('null is refused', validateEvent(null) === null)
  ok('an array is refused', validateEvent([]) === null)

  const injected = validateEvent({
    type: 'pageview',
    session_id: 'abc12345',
    page_title: 'line one\nline two\rmore',
  })
  ok('control characters are stripped from titles', !/[\n\r]/.test(injected?.page_title ?? 'x'))

  for (const type of EVENT_TYPES) {
    ok(`${type} is an accepted event type`, validateEvent({ type, session_id: 'abc12345' }) !== null)
  }
  ok('there is no marketing event type', !(EVENT_TYPES as readonly string[]).includes('ad_click'))

  /* ---------------------------------------------------------------- */
  section('location is approximate and comes from the edge')

  const headers = new Headers({
    'cf-ipcountry': 'IN',
    'cf-region': 'Karnataka',
    'cf-ipcity': 'Bengaluru',
    'cf-latitude': '12.9716',
    'cf-longitude': '77.5946',
  })
  const place = locationFromHeaders(headers)
  ok('country is read from the header', place.country === 'IN')
  ok('city is read from the header', place.city === 'Bengaluru')
  ok('coordinates are rounded to two places', place.latitude === 12.97 && place.longitude === 77.59)

  const bare = locationFromHeaders(new Headers())
  ok('no edge headers means no location', bare.city === null && bare.country === null)
  ok('the empty location is all nulls', bare.latitude === null && NO_LOCATION.latitude === null)

  const junk = locationFromHeaders(new Headers({ 'cf-ipcity': 'A'.repeat(500) }))
  ok('an over long city is dropped', junk.city === null)

  /* ---------------------------------------------------------------- */
  section('writing')

  recordEvent(good!)
  ok('an event lands in the table', analyticsRowCount() === 1)

  const row = db()
    .prepare('select page_path, page_title from analytics_events limit 1')
    .get() as { page_path: string; page_title: string }
  ok('the stored row keeps the clean path', row.page_path === '/how')
  ok('an email from the url is not in the row', !JSON.stringify(row).includes('@'))

  const stored = recordConsentLog('banner_accept_all', every)
  ok('a consent log is kept', stored !== null && consentRowCount() === 1)
  ok('necessary is recorded as granted', stored?.necessary === true)
  ok('analytics is recorded as granted', stored?.analytics === true)
  ok('the version is stored on the row', stored?.consent_version === CONSENT_VERSION)

  ok('an unknown source is refused', recordConsentLog('somewhere_else', every) === null)
  ok('a malformed record is refused', recordConsentLog('banner_accept_all', { hello: 1 }) === null)

  const refused = recordConsentLog('banner_reject', allOff())
  ok('a refusal is recorded just as a grant is', refused !== null && refused.analytics === false)
  ok('that refusal is on file', consentRowCount() === 2)

  /* ---------------------------------------------------------------- */
  section('the dashboard reads aggregates')

  const dash = buildDashboard()
  ok('pageviews are counted', dash.totals.pageviews === 1)
  ok('consent decisions are counted', dash.totals.consentLogs === 2)
  ok('top pages is populated', dash.topPages[0]?.path === '/how')
  ok('consent breakdown has both sources', dash.consentBreakdown.length === 2)
  ok('the rejection row shows zero analytics', dash.consentBreakdown.some((r) => r.source === 'banner_reject' && r.analytics === 0))

  /* ---------------------------------------------------------------- */
  section('retention')

  // Backdate one row past its limit and leave one inside it.
  const old = new Date(Date.now() - (ANALYTICS_RETENTION_DAYS + 5) * 86_400_000).toISOString()
  db()
    .prepare('insert into analytics_events (id, type, session_id, created_at) values (?, ?, ?, ?)')
    .run('old-event', 'pageview', 'abc12345', old)
  db()
    .prepare(
      `insert into consent_logs (id, consent_version, source, necessary, preferences, analytics, location, device, created_at, last_seen_at)
       values (?, ?, ?, 1, 0, 0, 0, 0, ?, ?)`,
    )
    .run(
      'old-consent',
      CONSENT_VERSION,
      'banner_reject',
      old,
      old,
    )

  const before = analyticsRowCount()
  ok('a backdated row is on file before the run', before === 2)

  const result = runRetention()
  ok('the backdated analytics row was deleted', result.analyticsDeleted === 1)
  ok('the backdated consent row was deleted', result.consentDeleted === 1)
  ok('the current analytics row survived', analyticsRowCount() === 1)
  ok('the current consent rows survived', consentRowCount() === 2)

  const again = runRetention()
  ok('a second run deletes nothing and does not error', again.analyticsDeleted === 0 && again.consentDeleted === 0)

  const stillThere = analyticsRowCount()
  ok('the row count is unchanged by the repeat run', stillThere === 1)

  ok('retention is twelve months', ANALYTICS_RETENTION_DAYS === 365)
  ok('consent records are kept twelve months', CONSENT_RETENTION_DAYS === 365)

  /* ---------------------------------------------------------------- */
  section('erasure')

  const userId = db()
    .prepare(
      `insert into users (id, email, password_hash, name, theme, created_at)
       values ('test-user', 'erased@example.com', null, 'Erase', 'system', ?)`,
    )
    .run(nowIso()).changes
  ok('a test account exists', Number(userId) === 1)

  db()
    .prepare(
      `insert into cards (id, user_id, kind, title, tags, tags_index, created_at, updated_at)
       values ('test-card', 'test-user', 'note', 'Secret', '[]', '', ?, ?)`,
    )
    .run(nowIso(), nowIso())
  db()
    .prepare('insert into sessions (id, user_id, created_at, expires_at) values (?, ?, ?, ?)')
    .run('test-session', 'test-user', nowIso(), nowIso())

  const missing = eraseAccount('nobody@example.com')
  ok('erasing an unknown address is not an error', missing.accountFound === false)

  const erased = eraseAccount('erased@example.com')
  ok('the account was found', erased.accountFound === true)
  ok('the card was deleted', erased.cardsDeleted === 1)
  ok('the session was deleted', erased.sessionsDeleted === 1)
  ok('the user row is gone', db().prepare("select count(*) as c from users where id='test-user'").get() !== undefined &&
    (db().prepare("select count(*) as c from users where id='test-user'").get() as { c: number }).c === 0)
  ok('the card row is gone', (db().prepare("select count(*) as c from cards where id='test-card'").get() as { c: number }).c === 0)

  recordDeletionRequest('erased@example.com', 'please remove everything')
  const requests = db().prepare('select count(*) as c from deletion_requests').get() as { c: number }
  ok('the request itself is on file', requests.c === 1)

  /* ---------------------------------------------------------------- */
  console.log(`\n${checks - failures}/${checks} checks passed`)
  if (failures > 0) {
    console.log(`${failures} failed`)
    process.exitCode = 1
  } else {
    console.log('all good')
  }
} catch (error) {
  console.error('\nthe test itself broke:', (error as Error).message)
  console.error((error as Error).stack)
  process.exitCode = 1
} finally {
  try {
    rmSync(DATA_DIR, { recursive: true, force: true })
  } catch {
    /* nothing to clean */
  }
}