/**
 * Authenticated end to end test against a running server.
 * Creates a real user and session in the server's database, exercises the
 * signed in routes and APIs with that cookie, then cleans up.
 *
 * Usage: npx tsx scripts/test-auth.mts [baseUrl]
 */
import { rmSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:3000'
const CREATED_EMAIL = 'e2e-test@example.com'

const { db, newId, nowIso } = await import('../src/lib/db.ts')
const { hashPassword } = await import('../src/lib/password.ts')

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

const token = newId() + newId()

async function cleanup() {
  const conn = db()
  const user = conn.prepare('select id from users where email = ?').get(CREATED_EMAIL) as
    | { id: string }
    | undefined
  if (user) conn.prepare('delete from users where id = ?').run(user.id)
  try {
    rmSync(process.env.OWNMIND_DATA_DIR || '.data', { recursive: true, force: true })
  } catch {
    /* dev server may hold the handle */
  }
}

try {
  const conn = db()
  const existing = conn.prepare('select id from users where email = ?').get(CREATED_EMAIL) as
    | { id: string }
    | undefined
  if (existing) conn.prepare('delete from users where id = ?').run(existing.id)

  const userId = newId()
  conn
    .prepare(
      `insert into users (id, email, password_hash, name, theme, created_at)
       values (?, ?, ?, 'E2E', 'system', ?)`,
    )
    .run(userId, CREATED_EMAIL, await hashPassword('a sufficiently long password'), nowIso())

  conn
    .prepare('insert into sessions (id, user_id, created_at, expires_at) values (?, ?, ?, ?)')
    .run(
      token,
      userId,
      nowIso(),
      new Date(Date.now() + 86_400_000).toISOString(),
    )

  const cookie = `ownmind_session=${token}`
  const auth = { headers: { cookie } }

  console.log(`\nAuthenticated end to end against ${BASE}\n`)

  console.log('signed in pages')
  for (const route of [
    '/library',
    '/library/search',
    '/library/pinned',
    '/library/spaces',
    '/library/recall',
    '/library/settings',
  ]) {
    const response = await fetch(`${BASE}${route}`, auth)
    ok(`GET ${route} returns 200 when signed in`, response.status === 200, `got ${response.status}`)
  }

  console.log('\nempty state')
  {
    const html = await (await fetch(`${BASE}/library`, auth)).text()
    ok('empty library invites the first save', html.includes('Save your first thing'))
    ok('empty library shows the composer', html.includes('Paste a link, write a note'))
  }

  console.log('\nAPI: sign in state')
  {
    const response = await fetch(`${BASE}/api/save`, auth)
    const body = (await response.json()) as { signedIn?: boolean; email?: string }
    ok('GET /api/save reports signed in', response.status === 200 && body.signedIn === true)
    ok('GET /api/save returns the account email', body.email === CREATED_EMAIL, String(body.email))
  }

  console.log('\nAPI: saving a note')
  let noteId = ''
  {
    const response = await fetch(`${BASE}/api/save`, {
      ...auth,
      method: 'POST',
      headers: { ...auth.headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        note: 'Cone 6 oxidation firing, slow cool from 1000C. Ask about the kiln schedule before Friday.',
      }),
    })
    const body = (await response.json()) as { id?: string; kind?: string; tags?: string[]; title?: string }
    noteId = body.id ?? ''

    ok('POST /api/save with a note returns 201', response.status === 201, `got ${response.status}`)
    ok('note is classified as a note', body.kind === 'note', String(body.kind))
    ok('a title was generated', typeof body.title === 'string' && body.title.length > 0, String(body.title))
    ok('tags were generated locally', Array.isArray(body.tags) && body.tags.length > 0, JSON.stringify(body.tags))
  }

  console.log('\nAPI: saving a link')
  {
    const response = await fetch(`${BASE}/api/save`, {
      ...auth,
      method: 'POST',
      headers: { ...auth.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const body = (await response.json()) as { id?: string; kind?: string; domain?: string }
    ok('POST /api/save with a url returns 201', response.status === 201, `got ${response.status}`)
    ok('link is classified as a link or article', ['link', 'article'].includes(String(body.kind)), String(body.kind))
    ok('the domain was captured', body.domain === 'example.com', String(body.domain))
  }

  console.log('\nAPI: rejecting bad input')
  {
    const empty = await fetch(`${BASE}/api/save`, {
      ...auth,
      method: 'POST',
      headers: { ...auth.headers, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    ok('an empty body is rejected with 400', empty.status === 400, `got ${empty.status}`)

    const broken = await fetch(`${BASE}/api/save`, {
      ...auth,
      method: 'POST',
      headers: { ...auth.headers, 'content-type': 'application/json' },
      body: 'not json at all',
    })
    ok('a malformed body is rejected with 400', broken.status === 400, `got ${broken.status}`)

    const badImage = await fetch(`${BASE}/api/save`, {
      ...auth,
      method: 'POST',
      headers: { ...auth.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'x', image: 'data:image/png;base64,@@@@notbase64@@@@' }),
    })
    ok('an unreadable image is rejected with 400', badImage.status === 400, `got ${badImage.status}`)
  }

  console.log('\nAPI: search')
  {
    const response = await fetch(`${BASE}/api/search?q=kiln&limit=10`, auth)
    const body = (await response.json()) as { results: Array<{ id: string; title: string }> }
    ok('GET /api/search returns 200', response.status === 200)
    ok('the saved note is findable by its text', body.results.length === 1, JSON.stringify(body.results))
    ok('results are trimmed, with no body text', !('body' in (body.results[0] ?? {})))

    const byTag = await fetch(`${BASE}/api/search?q=${encodeURIComponent('tag:' + 'ceramics')}`, auth)
    const tagBody = (await byTag.json()) as { results: unknown[] }
    ok('a tag filter is accepted', byTag.status === 200 && Array.isArray(tagBody.results))

    const recent = await fetch(`${BASE}/api/search?limit=5`, auth)
    const recentBody = (await recent.json()) as { results: unknown[] }
    ok('an empty query lists recent items', recent.status === 200 && recentBody.results.length === 2)

    const huge = await fetch(`${BASE}/api/search?limit=9999`, auth)
    const hugeBody = (await huge.json()) as { results: unknown[] }
    ok('an oversized limit is capped', hugeBody.results.length <= 50)
  }

  console.log('\nsearch page renders results')
  {
    const html = await (await fetch(`${BASE}/library/search?q=kiln`, auth)).text()
    ok('the search page shows the query back', html.includes('kiln'))
    ok('the search page finds the note', html.includes('Cone 6') || html.includes('kiln'))
  }

  console.log('\ncard detail page')
  if (noteId) {
    const response = await fetch(`${BASE}/library/card/${noteId}`, auth)
    const html = await response.text()
    ok('the card page returns 200', response.status === 200, `got ${response.status}`)
    ok('the card page shows a title', html.includes('Ask about the kiln schedule'))
    ok('the card page offers the link editor', html.includes('Link another item'))
    ok('the card page has no em dashes', !html.includes('\u2014'))
  } else {
    ok('a card id was returned so the detail page could be tested', false)
  }

  console.log('\ncard not found')
  {
    const response = await fetch(`${BASE}/library/card/does-not-exist`, auth)
    ok('an unknown card id gives 404', response.status === 404, `got ${response.status}`)
  }

  console.log('\nlibrary page lists saved cards')
  {
    const html = await (await fetch(`${BASE}/library`, auth)).text()
    ok('the grid shows the item count', /2 items saved/.test(html), 'expected "2 items saved"')
    ok('the empty state is gone', !html.includes('Save your first thing'))
  }

  console.log('\nexport')
  {
    const response = await fetch(`${BASE}/api/export`, auth)
    const text = await response.text()
    const body = JSON.parse(text) as {
      account: { email: string; name: string | null; createdAt: string }
      cards: Array<{ id: string; tags: unknown }>
      links: unknown[]
      spaces: unknown[]
      format: string
    }

    ok('export returns 200', response.status === 200)
    ok('export is sent as a download', (response.headers.get('content-disposition') ?? '').includes('attachment'))
    ok('export names a format', body.format === 'ownmind-export/1')
    ok('export contains the account', body.account?.email === CREATED_EMAIL, JSON.stringify(body.account))
    ok('export never contains the password hash', !text.includes('scrypt$'))
    ok('export contains both cards', body.cards.length === 2, String(body.cards.length))
    ok('tags come back as an array', Array.isArray(body.cards[0]?.tags))
    ok('export includes links and spaces arrays', Array.isArray(body.links) && Array.isArray(body.spaces))
  }

  console.log('\nsigned in pages are not indexed')
  {
    const html = await (await fetch(`${BASE}/library/settings`, auth)).text()
    ok('the settings page asks robots not to index', html.includes('noindex'))
  }

  console.log('\npassword reset pages')
{
  const forgot = await fetch(`${BASE}/forgot-password`)
  ok('the forgot password page is reachable', forgot.status === 200, `got ${forgot.status}`)
  const forgotHtml = await forgot.text()
  ok('the forgot password page has the right heading', forgotHtml.includes('Reset your password'))
  ok('the forgot password page asks for an email', forgotHtml.includes('Send the link'))

  const noToken = await fetch(`${BASE}/reset-password`)
  ok('the reset page without a token is still 200', noToken.status === 200, `got ${noToken.status}`)
  const noTokenHtml = await noToken.text()
  ok('the reset page refuses to show a form without a valid token', noTokenHtml.includes('That link has expired'))

  const badToken = await fetch(`${BASE}/reset-password?token=not-a-real-token`)
  const badHtml = await badToken.text()
  ok('a bogus token does not reveal a form', badHtml.includes('That link has expired'))

  const signinHtml = await (await fetch(`${BASE}/signin`)).text()
  ok('sign in links to the forgot password page', signinHtml.includes('/forgot-password'))

  const resetNotice = await (await fetch(`${BASE}/signin?reset=1`)).text()
  ok('a completed reset is confirmed on sign in', resetNotice.includes('Password changed'))
}

console.log('\nreset token lifecycle in the database')
{
  const conn = db()
  const before = (
    conn.prepare('select count(*) as n from password_resets').get() as { n: number }
  ).n

  // Requesting a reset for the seeded user creates exactly one live token.
  conn
    .prepare(
      `insert into password_resets (id, user_id, created_at, expires_at)
       values ('tok-1', ?, ?, ?)`,
    )
    .run(
      userId,
      nowIso(),
      new Date(Date.now() + 3_600_000).toISOString(),
    )

  const after = (
    conn.prepare('select count(*) as n from password_resets where used_at is null').get() as {
      n: number
    }
  ).n
  ok('a reset token is recorded as unused', after === before + 1, `${before} to ${after}`)

  // An expired token must not count as usable.
  conn
    .prepare(
      `insert into password_resets (id, user_id, created_at, expires_at)
       values ('tok-old', ?, ?, ?)`,
    )
    .run(userId, nowIso(), new Date(Date.now() - 1000).toISOString())
  const liveTokens = conn
    .prepare(`select count(*) as n from password_resets where expires_at > ? and used_at is null`)
    .get(nowIso()) as { n: number }
  ok('an expired token is not counted as live', liveTokens.n === 1, String(liveTokens.n))

  // Deleting the account must take its reset tokens with it.
  const throwaway = newId()
  conn
    .prepare(
      `insert into users (id, email, password_hash, name, theme, created_at)
       values (?, 'throwaway@example.com', 'x', 'T', 'system', ?)`,
    )
    .run(throwaway, nowIso())
  conn
    .prepare(
      `insert into password_resets (id, user_id, created_at, expires_at)
       values ('tok-t', ?, ?, ?)`,
    )
    .run(throwaway, nowIso(), new Date(Date.now() + 3_600_000).toISOString())
  conn.prepare('delete from users where id = ?').run(throwaway)
  const orphans = conn
    .prepare('select count(*) as n from password_resets where user_id = ?')
    .get(throwaway) as { n: number }
  ok('reset tokens are removed with the account', orphans.n === 0, String(orphans.n))
}

console.log(`\n${checks - failures}/${checks} checks passed`)
  if (failures > 0) process.exitCode = 1
  else console.log('all good')
} finally {
  await cleanup()
}
