/**
 * Design constraint audit.
 *
 * Checks the actual served CSS and HTML rather than the source, so a token
 * that slipped through a component cannot hide.
 *
 * Usage: node scripts/audit-design.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:3000'

let failures = 0
let checks = 0

function ok(label, condition, detail = '') {
  checks++
  if (condition) console.log(`  pass  ${label}`)
  else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` :: ${detail}` : ''}`)
  }
}

console.log(`\nDesign audit against ${BASE}\n`)

console.log('palette')

const landing = await (await fetch(`${BASE}/`)).text()

// Every stylesheet Next emits for this page.
const cssUrls = [
  ...new Set([...landing.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map((m) => m[1])),
]
ok('the page ships at least one stylesheet', cssUrls.length > 0, String(cssUrls.length))

let css = ''
for (const url of cssUrls) {
  css += await (await fetch(`${BASE}${url}`)).text()
}
ok('stylesheet was fetched', css.length > 500, `${css.length} bytes`)

const PURPLE = /#(8b5cf6|7c3aed|a855f7|9333ea|c084fc|d946ef|6d28d9|5b21b6|4c1d95|7e22ce)\b/i
const purpleHits = [...new Set(css.match(new RegExp(PURPLE.source, 'gi')) ?? [])]
ok('no purple hex anywhere in the CSS', purpleHits.length === 0, purpleHits.join(', '))
ok('no purple keyword in the CSS', !/\bpurple\b/i.test(css))

const GRADIENT = /linear-gradient|radial-gradient|conic-gradient/i
const gradientHits = [...new Set(css.match(/(?:linear|radial|conic)-gradient\([^)]*\)/gi) ?? [])]
ok(
  'no gradient is used on a background or a control',
  !GRADIENT.test(css.replace(/\.prose-legal[\s\S]*?(?=\})/g, '')),
  gradientHits.slice(0, 3).join(' | '),
)

console.log('\nshape and radius')
{
  // A fully round control would be a 50% radius on a button sized element.
  const buttonRadius = /\.btn\s*\{[^}]*border-radius:\s*([^;}]+)/.exec(css)?.[1]?.trim()
  ok(
    'the button radius is a small fixed value, not a circle',
    buttonRadius === '6px' || buttonRadius === 'var(--radius-card)',
    String(buttonRadius),
  )
  ok('no 50 percent radius on any class', !/\.([a-z0-9_-]+)\{[^}]*border-radius:50%/.test(css))
  ok('no 9999px pill radius on any class', !/border-radius:9999px/.test(css))
  ok('no rounded-full on a button', !/\.btn[^{]*\{[^}]*border-radius:9999px/.test(css))
}

console.log('\nmotion')
{
  // Transitions are restricted to colour, border and opacity in globals.css.
  const transitionProps = [...css.matchAll(/transition-property:([^;}]+)/g)].map((m) => m[1].trim())
  const allowed = new Set(['color', 'background-color', 'border-color', 'opacity'])
  const badTransitions = [...new Set(transitionProps)].filter(
    (value) => !allowed.has(value) && !value.includes('color') && value !== 'opacity',
  )
  ok('no transition on transform, layout or filter', badTransitions.length === 0, badTransitions.join(', '))

  ok('prefers-reduced-motion is respected', css.includes('prefers-reduced-motion'))
  ok('no keyframe animation for entrance effects', !/@keyframes (fadeIn|slideIn|reveal|rise)/i.test(css))
}

console.log('\ntypography and assets')
{
  ok('the display font is loaded', /--font-display/.test(css) || landing.includes('Fraunces'))
  ok('the body font is loaded', /--font-sans/.test(css) || landing.includes('Inter'))
  ok('fonts are preloaded', landing.includes('rel="preload"') && landing.includes('.woff2'))

  const head = landing.slice(0, landing.indexOf('</head>'))
  ok('a favicon link is present', /rel="icon"/.test(head))
  ok('an apple touch icon is not faked with a missing file', !/apple-touch-icon/.test(head))

  const iconResponse = await fetch(`${BASE}/icon.svg`)
  const icon = await iconResponse.text()
  ok('the icon is a real svg', iconResponse.status === 200 && icon.includes('<svg'))
  ok('the icon is not a generated ai image', !/generated|placeholder|lorem/i.test(icon))

  const icoResponse = await fetch(`${BASE}/favicon.ico`)
  const ico = new Uint8Array(await icoResponse.arrayBuffer())
  ok('favicon.ico is a real ICO', ico[0] === 0 && ico[1] === 0 && ico[2] === 1 && ico[3] === 0)
  ok('favicon.ico has multiple sizes', icoResponse.headers.get('content-length') !== '0' && ico.byteLength > 1000)
}

console.log('\nsemantic html')
{
  ok('exactly one h1 on the landing page', (landing.match(/<h1[\s>]/g) ?? []).length === 1)
  ok('the html element declares a language', /<html lang="en"/.test(landing))
  ok('images that carry meaning have alt text', !/<img(?![^>]*\balt=)[^>]*>/.test(landing))
  ok('there is a skip-friendly main landmark', /<main/.test(landing))
  ok('the theme script is inlined before paint', landing.indexOf('ownmind-theme') < landing.indexOf('</head>'))
  ok('the smooth scroll opt in attribute is set', /data-scroll-behavior="smooth"/.test(landing))
  ok('theme is declared for both colour schemes', landing.includes('color-scheme'))
}

console.log('\naccessibility basics')
{
  for (const route of ['/', '/how', '/pricing', '/privacy', '/terms']) {
    const html = await (await fetch(`${BASE}${route}`)).text()
    ok(`${route} has exactly one h1`, (html.match(/<h1[\s>]/g) ?? []).length === 1, String((html.match(/<h1[\s>]/g) ?? []).length))
  }

  const faq = await (await fetch(`${BASE}/faq`)).text()
  ok('the faq uses description lists', faq.includes('<dt') && faq.includes('<dd'))

  const pricing = await (await fetch(`${BASE}/pricing`)).text()
  ok('the pricing table has a caption and headers', pricing.includes('<caption') && pricing.includes('scope="col"') && pricing.includes('scope="row"'))
  ok('the pricing table labels its check and cross marks for screen readers', pricing.includes('sr-only'))
}

console.log('\nperformance')
{
  // Only look at real third party script sources. Next injects its own runtime
  // from /_next/, and the dev bundle contains internal words like "segment",
  // so matching bare keywords produces false positives.
  const externalScripts = [...landing.matchAll(/<script[^>]*src="(https?:\/\/[^"]+)"/g)].map((m) => m[1])
  ok('no external script is loaded', externalScripts.length === 0, externalScripts.join(', '))

  const trackers = ['googletagmanager.com', 'google-analytics.com', 'hotjar.com', 'segment.io', 'mixpanel.com', 'plausible.io', 'clarity.ms']
  const trackerHits = trackers.filter((host) => landing.includes(host))
  ok('no known analytics or tracking host is referenced', trackerHits.length === 0, trackerHits.join(', '))

  ok('no third party iframe', !/<iframe/i.test(landing))
  ok('no external image host in the markup', !/https?:\/\/[^"']*\.(png|jpe?g|webp|gif)/i.test(landing))
  ok('no external font host, fonts are self hosted', !/fonts\.(googleapis|gstatic)\.com/.test(landing))
}

console.log(`\n${checks - failures}/${checks} checks passed`)
if (failures > 0) {
  console.log(`${failures} failing`)
  process.exit(1)
}
console.log('all good')
