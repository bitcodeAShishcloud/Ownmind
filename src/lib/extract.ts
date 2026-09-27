/**
 * Turns a URL into something worth reading: a title, a site name, a lead image
 * and the body text with navigation, scripts and ads removed.
 *
 * This is a compact density based extractor rather than a full Readability
 * port. It scores block elements by paragraph count and text length, then keeps
 * the winner. It is good on articles, newsletters and docs, which is what people
 * actually save. Server only.
 */

import { parse } from 'node-html-parser'

export type Extracted = {
  ok: boolean
  title: string | null
  siteName: string | null
  domain: string
  excerpt: string | null
  leadImage: string | null
  text: string
  byline: string | null
}

const BOILERPLATE = [
  'script',
  'style',
  'noscript',
  'template',
  'iframe',
  'svg',
  'form',
  'nav',
  'aside',
  'header',
  'footer',
  'button',
  'figure figcaption',
]

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0 Safari/537.36 OwnMind/1.0 (+https://ownmind.example/bot)'

function textOf(node: { text: string } | null) {
  return (node?.text ?? '').replace(/\s+/g, ' ').trim()
}

function metaContent(root: ReturnType<typeof parse>, names: string[]) {
  for (const name of names) {
    const tag =
      root.querySelector(`meta[property="${name}"]`) ??
      root.querySelector(`meta[name="${name}"]`) ??
      root.querySelector(`meta[itemprop="${name}"]`)
    const content = tag?.getAttribute('content')?.trim()
    if (content) return content
  }
  return null
}

function hostOf(url: URL) {
  return url.hostname.replace(/^www\./, '')
}

function readableHost(url: URL) {
  const host = hostOf(url)
  if (host.includes('github.com')) return 'GitHub'
  if (host.includes('medium.com')) return 'Medium'
  if (host.includes('substack.com')) return 'Substack'
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube'
  if (host.includes('nytimes.com')) return 'The New York Times'
  if (host.includes('theguardian.com')) return 'The Guardian'
  if (host.endsWith('.co.uk')) return host.split('.').slice(-3, -2)[0]
  const parts = host.split('.')
  if (parts.length >= 2) {
    const label = parts[parts.length - 2]
    return label.charAt(0).toUpperCase() + label.slice(1)
  }
  return host
}

export function normalizeUrl(input: string): URL | null {
  const raw = input.trim()
  if (!raw) return null
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url
  } catch {
    return null
  }
}

/** Pull the most link dense, paragraph heavy block out of a document. */
function extractBody(root: ReturnType<typeof parse>): string {
  for (const selector of BOILERPLATE) {
    for (const node of root.querySelectorAll(selector)) node.remove()
  }

  const candidates = [
    ...root.querySelectorAll('article'),
    ...root.querySelectorAll('main'),
    ...root.querySelectorAll('[role="main"]'),
  ]

  const blocks =
    candidates.length > 0
      ? candidates
      : root.querySelectorAll('div,section,td')

  let best = ''
  let bestScore = 0

  for (const block of blocks) {
    const paragraphs = block.querySelectorAll('p')
    if (paragraphs.length === 0) continue

    const text = paragraphs
      .map((p) => textOf(p))
      .filter((t) => t.length > 1)
      .join('\n\n')
      .trim()

    if (text.length < 140) continue

    // Reward prose, punish navigation.
    const linkText = block
      .querySelectorAll('a')
      .map((a) => textOf(a))
      .join(' ')
      .length
    const density = linkText / Math.max(text.length, 1)
    if (density > 0.5) continue

    const score = text.length * (1 - density) + paragraphs.length * 40
    if (score > bestScore) {
      bestScore = score
      best = text
    }
  }

  if (best) return best

  // Fallback for pages that are one long run of text with no paragraphs.
  const whole = textOf(root.querySelector('body'))
  return whole.length > 4000 ? whole.slice(0, 4000) : ''
}

export async function extractPage(input: string): Promise<Extracted> {
  const url = normalizeUrl(input)
  if (!url) {
    return {
      ok: false,
      title: null,
      siteName: null,
      domain: '',
      excerpt: null,
      leadImage: null,
      text: '',
      byline: null,
    }
  }

  const domain = hostOf(url)
  const fallback: Extracted = {
    ok: false,
    title: null,
    siteName: null,
    domain,
    excerpt: null,
    leadImage: null,
    text: '',
    byline: null,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  let html: string
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en',
      },
    })

    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !type.includes('html')) return fallback
    html = await response.text()
  } catch {
    return fallback
  } finally {
    clearTimeout(timeout)
  }

  try {
    const root = parse(html, {
      blockTextElements: { script: false, noscript: false, style: false, pre: true },
    })

    const title =
      metaContent(root, ['og:title', 'twitter:title']) ??
      textOf(root.querySelector('h1')) ??
      textOf(root.querySelector('title')) ??
      null

    const siteName =
      metaContent(root, ['og:site_name', 'application-name']) ?? readableHost(url)

    const byline =
      metaContent(root, ['author', 'article:author', 'twitter:creator']) ??
      textOf(root.querySelector('[rel="author"], .byline, .author')) ??
      null

    const rawImage = metaContent(root, ['og:image', 'twitter:image'])
    let leadImage: string | null = null
    if (rawImage) {
      try {
        leadImage = new URL(rawImage, url).toString()
      } catch {
        leadImage = null
      }
    }

    const text = extractBody(root)

    return {
      ok: true,
      title: title ? title.slice(0, 300) : null,
      siteName,
      domain,
      excerpt: metaContent(root, ['og:description', 'twitter:description', 'description']),
      leadImage,
      text,
      byline: byline ? byline.slice(0, 120) : null,
    }
  } catch {
    return fallback
  }
}
