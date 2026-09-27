/**
 * Enrichment decides what a save actually is: its kind, title, tags, summary
 * and accent colour.
 *
 * The local heuristics run first and always produce a usable result. If a model
 * is configured we then ask it to do the labelling properly, and merge the
 * answer over the top. A failure at that point changes nothing.
 *
 * Server only.
 */

import { chatJson, describeImage, isAiConfigured } from './ai'
import { extractPage, normalizeUrl, type Extracted } from './extract'
import type { CardKind } from './cards'

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are aren't as at be because been
   before being below between both but by can cannot could couldn't did didn't do does doesn't
   doing don't down during each few for from further had hadn't has hasn't have haven't having he
   he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in
   into is isn't it it's its itself just let's me more most mustn't my myself no nor not of off on
   once only or other ought our ours ourselves out over own same shan't she she'd she'll she's
   should shouldn't so some such than that that's the their theirs them themselves then there
   there's these they they'd they'll they're they've this those through to too under until up very
   was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which
   while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your
   yours yourself yourselves will may might must shall get got make made use used using one two
   three like well back even much many way ways thing things time times new old need needs like
   however therefore thus hence whether either neither per via etc
   said says say get gets go goes going went come comes came take takes taken give gives given
   see sees saw seen look looks looking know knows knew known think thinks thought want wants
   really quite every another around though although upon within without across among`
    .split(/\s+/)
    .filter(Boolean),
)

/**
 * Crude but predictable singularisation, used only to stop obvious plurals
 * becoming two separate tags. It handles the common English endings and does
 * nothing clever, so it will not mangle words it does not recognise.
 */
function stem(word: string) {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** Words worth keeping as tags: length filtered, stop filtered, deduped. */
export function keywords(text: string, limit = 8): string[] {
  const words = (text.toLowerCase().match(/[a-z][a-z0-9'-]{2,}/g) ?? []).filter(
    (word) => !STOPWORDS.has(word) && word.length >= 3 && word.length <= 20,
  )

  const counts = new Map<string, number>()
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }

  const ranked = [...counts.entries()]
    .filter(([, count]) => count > 1 || words.length < 40)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  // Collapse simple plurals so "post" and "posts" do not both become tags.
  const seen = new Set<string>()
  const result: string[] = []
  for (const [word] of ranked) {
    if (result.length >= limit) break
    const key = stem(word)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(word)
  }
  return result
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 400)
}

/**
 * Extractive summary. Scores each sentence by the keywords it contains and keeps
 * the best two in their original order, so it reads naturally.
 */
export function extractiveSummary(text: string, maxSentences = 2): string {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return text.slice(0, 280).trim()

  if (sentences.length <= maxSentences) return sentences.join(' ')

  const frequency = new Map<string, number>()
  for (const word of keywords(text, 30)) frequency.set(word, 1)

  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z][a-z0-9'-]{2,}/g) ?? []
    let score = 0
    for (const word of words) {
      if (frequency.has(word)) score += 1
      else if (frequency.has(stem(word))) score += 0.7
    }
    // A sentence near the top of the piece usually carries the point.
    if (index < 3) score += 0.4
    return { sentence, index, score: score / Math.max(words.length, 1) + score * 0.12 }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence)
    .join(' ')
}

function guessKind(input: {
  url: string | null
  text: string
  imageUrl: string | null
  hint: CardKind | null
}): CardKind {
  if (input.hint) return input.hint
  if (input.imageUrl && !input.url) return 'image'
  if (input.url) return input.text.length > 1200 ? 'article' : 'link'
  if (input.imageUrl) return 'image'
  return 'note'
}

function titleFromUrl(url: URL) {
  const path = url.pathname.replace(/\/+$/, '')
  const segment = path.split('/').filter(Boolean).pop()
  if (!segment) return url.hostname
  return segment
    .replace(/\.(html?|php|aspx?)$/i, '')
    .replace(/[-_+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export type EnrichInput = {
  url?: string | null
  title?: string | null
  body?: string | null
  imageUrl?: string | null
  accent?: string | null
  kindHint?: CardKind | null
}

export type Enriched = {
  kind: CardKind
  title: string
  body: string | null
  url: string | null
  siteName: string | null
  domain: string | null
  excerpt: string | null
  imageUrl: string | null
  accent: string | null
  tags: string[]
  summary: string | null
}

type LabelResult = {
  title?: string
  tags?: string[]
  summary?: string
  kind?: CardKind
}

const KINDS: CardKind[] = ['note', 'link', 'image', 'article']

/**
 * Builds a complete, saveable record from whatever the user handed us.
 * Never throws.
 */
export async function enrich(input: EnrichInput): Promise<Enriched> {
  const normalized = normalizeUrl(input.url ?? '')
  let page: Extracted | null = null

  // Only go to the network when the user saved a link we have not seen.
  if (normalized && !input.body) {
    page = await extractPage(normalized.toString())
  }

  const body = (input.body?.trim() || page?.text || '') || null
  const imageUrl = input.imageUrl ?? page?.leadImage ?? null

  const kind = guessKind({
    url: normalized?.toString() ?? null,
    text: body ?? '',
    imageUrl,
    hint: input.kindHint ?? null,
  })

  const domain = normalized ? normalized.hostname.replace(/^www\./, '') : (page?.domain ?? null)

  const title =
    input.title?.trim() ||
    page?.title?.trim() ||
    (normalized ? titleFromUrl(normalized) : '') ||
    (body ? body.split('\n')[0].slice(0, 80) : '') ||
    'Untitled'

  const excerpt =
    page?.excerpt ?? (body ? extractiveSummary(body, 1).slice(0, 240) : null)

  // Baseline from local heuristics. Everything below can only improve on this.
  const result: Enriched = {
    kind,
    title: title.slice(0, 300),
    body,
    url: normalized?.toString() ?? null,
    siteName: page?.siteName ?? null,
    domain,
    excerpt,
    imageUrl,
    accent: input.accent ?? null,
    tags: [],
    summary: null,
  }

  // Images: ask a vision model what it is, and for the text printed on it.
  if (kind === 'image' && imageUrl && isAiConfigured()) {
    const insight = await describeImage(imageUrl)
    if (insight) {
      result.title = insight.title?.slice(0, 300) || result.title
      result.summary = insight.summary?.trim() || null
      result.accent = insight.accent || result.accent
      result.tags = sanitizeTags(insight.tags)
      if (insight.textInImage?.trim()) {
        // Fold recognised text into the body so it is searchable, and keep the
        // original as a visible note.
        result.body = [insight.textInImage.trim(), result.body].filter(Boolean).join('\n\n')
      }
      if (result.tags.length >= 3) return result
    }
  }

  // Text: local keywords and an extractive summary, then let a model improve it.
  const source = result.body ?? result.title
  result.tags = keywords(`${result.title}\n${source}`, 7)
  if (body && body.length > 240) {
    result.summary = extractiveSummary(body, 2).slice(0, 420)
  }

  if (!isAiConfigured()) return result

  const label = await chatJson<LabelResult>({
    system: [
      'You label saved items for a personal archive that has no folders.',
      'Answer with JSON containing exactly:',
      'title (string, under 10 words, concrete and specific, no clickbait),',
      'tags (array of 4 to 7 lowercase single words that someone might later search for),',
      'summary (string, at most 2 sentences, plain and factual),',
      `kind (one of: ${KINDS.join(', ')}).`,
    ].join(' '),
    user: [
      result.url ? `Source: ${result.url}` : 'This is a personal note, not a link.',
      `Proposed title: ${result.title}`,
      result.summary ? `Draft summary: ${result.summary}` : '',
      '',
      'Content:',
      (source || result.title).slice(0, 6000),
    ]
      .filter(Boolean)
      .join('\n'),
    maxTokens: 400,
  })

  if (label) {
    if (typeof label.title === 'string' && label.title.trim()) {
      result.title = label.title.trim().slice(0, 300)
    }
    const tags = sanitizeTags(label.tags ?? [])
    if (tags.length >= 2) result.tags = tags
    if (typeof label.summary === 'string' && label.summary.trim()) {
      result.summary = label.summary.trim().slice(0, 420)
    }
    if (label.kind && KINDS.includes(label.kind)) result.kind = label.kind
  }

  return result
}

function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of tags) {
    if (typeof raw !== 'string') continue
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!tag || tag.length < 2 || tag.length > 24) continue
    if (seen.has(tag)) continue

    seen.add(tag)
    result.push(tag)
    if (result.length >= 8) break
  }

  return result
}
