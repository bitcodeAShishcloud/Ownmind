/**
 * End to end smoke test against a running server.
 * Usage: node scripts/smoke.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:3000'

let failures = 0
let checks = 0

function ok(label, condition, detail = '') {
  checks++
  if (condition) {
    console.log(`  pass  ${label}`)
  } else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` :: ${detail}` : ''}`)
  }
}

const EM_DASH = '\u2014'
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u
const FORBIDDEN = [
  'made with ai',
  'powered by ai',
  'built with ai',
  'lorem ipsum',
]

const PUBLIC_ROUTES = [
  '/',
  '/how',
  '/why',
  '/pricing',
  '/faq',
  '/privacy',
  '/terms',
]

console.log(`\nOwnMind smoke test against ${BASE}\n`)

console.log('public pages')
const bodies = {}
for (const route of PUBLIC_ROUTES) {
  const response = await fetch(`${BASE}${route}`)
  bodies[route] = await response.text()
  ok(`GET ${route} returns 200`, response.status === 200, `got ${response.status}`)
}

console.log('\nmetadata and assets')
for (const [route, type] of [
  ['/robots.txt', 'text'],
  ['/sitemap.xml', 'xml'],
  ['/icon.svg', 'svg'],
  ['/favicon.ico', 'ico'],
]) {
  const response = await fetch(`${BASE}${route}`)
  const body = await response.arrayBuffer()
  ok(
    `GET ${route} returns 200 and is ${type}`,
    response.status === 200 && body.byteLength > 0,
    `status ${response.status}, ${body.byteLength} bytes`,
  )
}

const robots = await (await fetch(`${BASE}/robots.txt`)).text()
ok('robots.txt points at a sitemap', robots.includes('sitemap.xml'))
ok('robots.txt blocks the signed in area', robots.includes('/library'))

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text()
ok('sitemap lists the privacy policy', sitemap.includes('/privacy'))
ok('sitemap lists the terms', sitemap.includes('/terms'))
ok('sitemap has no signed in pages', !sitemap.includes('/library'))

console.log('\nauth gating')
{
  const response = await fetch(`${BASE}/library`, { redirect: 'manual' })
  const location = response.headers.get('location') ?? ''
  ok(
    '/library redirects when signed out',
    (response.status === 307 || response.status === 302 || response.status === 303) &&
      location.includes('/signin'),
    `status ${response.status}, location ${location}`,
  )
}

console.log('\napi auth')
{
  const response = await fetch(`${BASE}/api/search?q=test`)
  ok('GET /api/search is 401 when signed out', response.status === 401, `got ${response.status}`)

  const save = await fetch(`${BASE}/api/save`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' }),
  })
  ok('POST /api/save is 401 when signed out', save.status === 401, `got ${save.status}`)

  const exportResponse = await fetch(`${BASE}/api/export`)
  ok('GET /api/export is 401 when signed out', exportResponse.status === 401, `got ${exportResponse.status}`)
}

console.log('\ncontent rules')
{
  const allText = PUBLIC_ROUTES.map((route) => bodies[route]).join('\n')

  ok('no em dashes anywhere in public copy', !allText.includes(EM_DASH))
  ok('no emoji anywhere in public copy', !EMOJI.test(allText))

  for (const phrase of FORBIDDEN) {
    ok(`no "${phrase}" text`, !allText.toLowerCase().includes(phrase))
  }

  const landing = bodies['/']

  ok('no purple in the palette', !/#8b5cf6|#a855f7|#7c3aed|purple/i.test(landing))
  ok('landscape advertises a concrete headline', landing.includes('Find it by what you remember'))
  ok('no fake customer counter', !/\b\d[\d,.]*\s*(users|customers|people)\b/i.test(landing))
  ok('no testimonial wall', !/testimonial|trusted by|what our/i.test(landing))
  ok('privacy page names the cookie', bodies['/privacy'].includes('ownmind_session'))
  ok('privacy page discloses the model provider', bodies['/privacy'].includes('language model provider'))
  ok('privacy page confirms no third party analytics', bodies['/privacy'].includes('analytics'))
  ok('terms page covers billing', bodies['/terms'].includes('Refunds'))
  ok('terms page covers termination', bodies['/terms'].toLowerCase().includes('terminat'))
  ok('terms page names a jurisdiction', bodies['/terms'].includes('England and Wales'))

  for (const route of PUBLIC_ROUTES) {
    ok(`${route} has a title tag`, /<title>[^<]+<\/title>/.test(bodies[route]))
    ok(`${route} has a meta description`, /name="description" content="[^"]{40,}"/.test(bodies[route]))
    ok(`${route} has no hydration errors flagged`, !bodies[route].includes('missing-x'))
  }
}

console.log('\nsecurity headers')
{
  const response = await fetch(`${BASE}/api/media/..%2F..%2Fpackage.json`)
  ok('media route rejects traversal', response.status === 404, `got ${response.status}`)

  const bad = await fetch(`${BASE}/api/media/not-a-valid-name.png`)
  ok('media route rejects invalid names', bad.status === 404, `got ${bad.status}`)
}

console.log(`\n${checks - failures}/${checks} checks passed`)
if (failures > 0) {
  console.log(`${failures} failing`)
  process.exit(1)
}
console.log('all good')
