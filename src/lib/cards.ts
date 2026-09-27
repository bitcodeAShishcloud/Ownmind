/**
 * Cards are the only object in OwnMind. A note, a bookmark, a screenshot and a
 * saved article are all the same row with a different `kind`, which is what lets
 * a single search cover everything you have saved.
 *
 * Server only.
 */

import { db, newId, nowIso } from './db'

export const CARD_KINDS = ['note', 'link', 'image', 'article'] as const
export type CardKind = (typeof CARD_KINDS)[number]

export type Card = {
  id: string
  user_id: string
  kind: CardKind
  title: string | null
  body: string | null
  url: string | null
  site_name: string | null
  domain: string | null
  excerpt: string | null
  image_url: string | null
  image_width: number | null
  image_height: number | null
  accent: string | null
  tags: string
  tags_index: string
  summary: string | null
  read_minutes: number | null
  pinned: number
  archived: number
  recall_state: string | null
  recalled_at: string | null
  created_at: string
  updated_at: string
}

/**
 * What the app actually passes around: snake_case columns mapped to camelCase,
 * with `tags` parsed and the integer flags turned into booleans. Components only
 * ever see this shape, never the raw row.
 */
export type CardView = {
  id: string
  userId: string
  kind: CardKind
  title: string | null
  body: string | null
  url: string | null
  siteName: string | null
  domain: string | null
  excerpt: string | null
  imageUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
  accent: string | null
  tags: string[]
  summary: string | null
  readMinutes: number | null
  pinned: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

export function toView(row: Card): CardView {
  let tags: string[] = []
  try {
    const parsed = JSON.parse(row.tags)
    if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === 'string')
  } catch {
    tags = []
  }

  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    url: row.url,
    siteName: row.site_name,
    domain: row.domain,
    excerpt: row.excerpt,
    imageUrl: row.image_url,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    accent: row.accent,
    tags,
    summary: row.summary,
    readMinutes: row.read_minutes,
    pinned: row.pinned === 1,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function tagIndex(tags: string[]) {
  const seen = new Set<string>()
  for (const tag of tags) {
    const clean = tag.trim().toLowerCase()
    if (clean) seen.add(clean)
  }
  return [...seen].join(' ')
}

export function estimateReadMinutes(text: string | null) {
  if (!text) return null
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words < 40) return null
  return Math.max(1, Math.round(words / 220))
}

/* -------------------------------------------------------------------------- */
/* Create and update                                                           */
/* -------------------------------------------------------------------------- */

export type NewCard = {
  kind: CardKind
  title?: string | null
  body?: string | null
  url?: string | null
  siteName?: string | null
  domain?: string | null
  excerpt?: string | null
  imageUrl?: string | null
  imageWidth?: number | null
  imageHeight?: number | null
  accent?: string | null
  tags?: string[]
  summary?: string | null
}

export function createCard(userId: string, input: NewCard): CardView {
  const id = newId()
  const timestamp = nowIso()
  const tags = input.tags ?? []
  const body = input.body ?? null

  db()
    .prepare(
      `insert into cards (
         id, user_id, kind, title, body, url, site_name, domain, excerpt,
         image_url, image_width, image_height, accent, tags, tags_index,
         summary, read_minutes, pinned, archived, created_at, updated_at
       ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    )
    .run(
      id,
      userId,
      input.kind,
      input.title ?? null,
      body,
      input.url ?? null,
      input.siteName ?? null,
      input.domain ?? null,
      input.excerpt ?? null,
      input.imageUrl ?? null,
      input.imageWidth ?? null,
      input.imageHeight ?? null,
      input.accent ?? null,
      JSON.stringify(tags),
      tagIndex(tags),
      input.summary ?? null,
      estimateReadMinutes(body),
      timestamp,
      timestamp,
    )

  return getCard(userId, id)!
}

export type CardPatch = Partial<
  Pick<CardView, 'title' | 'body' | 'kind' | 'url' | 'imageUrl' | 'summary' | 'accent' | 'excerpt'>
> & {
  tags?: string[]
  pinned?: boolean
  archived?: boolean
}

/** Maps the view field name to the stored column name. */
const PATCH_COLUMNS: Record<string, string> = {
  title: 'title',
  body: 'body',
  kind: 'kind',
  url: 'url',
  imageUrl: 'image_url',
  summary: 'summary',
  accent: 'accent',
  excerpt: 'excerpt',
  pinned: 'pinned',
  archived: 'archived',
}

export function updateCard(userId: string, id: string, patch: CardPatch): CardView | null {
  const existing = getCard(userId, id)
  if (!existing) return null

  const sets: string[] = []
  const values: Array<string | number | null> = []

  for (const [key, column] of Object.entries(PATCH_COLUMNS)) {
    const value = (patch as Record<string, unknown>)[key]
    if (value === undefined) continue
    sets.push(`${column} = ?`)
    values.push(typeof value === 'boolean' ? (value ? 1 : 0) : (value as string | null))
  }

  if (patch.tags) {
    sets.push('tags = ?', 'tags_index = ?')
    values.push(JSON.stringify(patch.tags), tagIndex(patch.tags))
  }

  if (patch.body !== undefined) {
    sets.push('read_minutes = ?')
    values.push(estimateReadMinutes(patch.body))
  }

  if (sets.length === 0) return existing

  sets.push('updated_at = ?')
  values.push(nowIso(), id, userId)

  db()
    .prepare(`update cards set ${sets.join(', ')} where id = ? and user_id = ?`)
    .run(...values)

  return getCard(userId, id)
}

export function deleteCard(userId: string, id: string) {
  const result = db()
    .prepare('delete from cards where id = ? and user_id = ?')
    .run(id, userId)
  return result.changes > 0
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export function getCard(userId: string, id: string): CardView | null {
  const row = db().prepare('select * from cards where id = ? and user_id = ?').get(id, userId) as
    | Card
    | undefined
  return row ? toView(row) : null
}

export type ListOptions = {
  kind?: CardKind
  pinned?: boolean
  archived?: boolean
  limit?: number
  offset?: number
}

export function listCards(userId: string, options: ListOptions = {}): CardView[] {
  const where: string[] = ['user_id = ?']
  const values: Array<string | number> = [userId]

  if (options.kind) {
    where.push('kind = ?')
    values.push(options.kind)
  }
  if (options.pinned !== undefined) {
    where.push('pinned = ?')
    values.push(options.pinned ? 1 : 0)
  }
  if (options.archived !== undefined) {
    where.push('archived = ?')
    values.push(options.archived ? 1 : 0)
  }

  values.push(options.limit ?? 200, options.offset ?? 0)

  const rows = db()
    .prepare(
      `select * from cards
       where ${where.join(' and ')}
       order by pinned desc, created_at desc
       limit ? offset ?`,
    )
    .all(...values) as Card[]

  return rows.map(toView)
}

export function countCards(userId: string) {
  const row = db()
    .prepare(
      `select
         count(*) as total,
         sum(case when kind = 'note'   then 1 else 0 end) as notes,
         sum(case when kind = 'link'   then 1 else 0 end) as links,
         sum(case when kind = 'image'  then 1 else 0 end) as images,
         sum(case when kind = 'article' then 1 else 0 end) as articles
       from cards where user_id = ? and archived = 0`,
    )
    .get(userId) as Record<string, number | null>

  return {
    total: row.total ?? 0,
    notes: row.notes ?? 0,
    links: row.links ?? 0,
    images: row.images ?? 0,
    articles: row.articles ?? 0,
  }
}

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

type ParsedQuery = {
  text: string[]
  exclude: string[]
  tags: string[]
  kinds: CardKind[]
  domains: string[]
}

/**
 * Associative search. Plain words go to the full text index, and a few
 * operators narrow the result:
 *
 *   tag:typography     only cards tagged typography
 *   kind:note          only notes (or images, links, articles)
 *   site:nytimes.com   only that domain
 *   -draft             drop anything containing draft
 */
export function parseQuery(raw: string): ParsedQuery {
  const parsed: ParsedQuery = { text: [], exclude: [], tags: [], kinds: [], domains: [] }
  const words = raw.trim().split(/\s+/).filter(Boolean)

  for (const word of words) {
    const lower = word.toLowerCase()

    if (lower.startsWith('tag:')) {
      const value = lower.slice(4).replace(/^["']|["']$/g, '')
      if (value) parsed.tags.push(value)
      continue
    }

    if (lower.startsWith('kind:')) {
      const value = lower.slice(5) as CardKind
      if (CARD_KINDS.includes(value)) parsed.kinds.push(value)
      continue
    }

    if (lower.startsWith('site:')) {
      const value = lower.slice(5).replace(/^["']|["']$/g, '')
      if (value) parsed.domains.push(value)
      continue
    }

    if (lower.startsWith('-') && lower.length > 1) {
      parsed.exclude.push(lower.slice(1))
      continue
    }

    parsed.text.push(word)
  }

  return parsed
}

/** Wrap each term so user punctuation can never break the FTS grammar. */
function toMatchExpression(terms: string[]) {
  return terms
    .map((term) => `"${term.replace(/"/g, '""')}"*`)
    .join(' AND ')
}

export type SearchOptions = {
  kind?: CardKind
  limit?: number
}

export function searchCards(userId: string, raw: string, options: SearchOptions = {}): CardView[] {
  const query = parseQuery(raw)
  const limit = options.limit ?? 120

  const filters: string[] = ['c.user_id = ?']
  const filterValues: Array<string | number> = [userId]

  const kinds = query.kinds.length > 0 ? query.kinds : options.kind ? [options.kind] : []
  if (kinds.length > 0) {
    filters.push(`c.kind in (${kinds.map(() => '?').join(', ')})`)
    filterValues.push(...kinds)
  }

  for (const tag of query.tags) {
    filters.push('lower(c.tags_index) like ?')
    filterValues.push(`%${tag}%`)
  }

  for (const domain of query.domains) {
    filters.push('lower(c.domain) like ?')
    filterValues.push(`%${domain}%`)
  }

  for (const term of query.exclude) {
    filters.push(
      `lower(coalesce(c.title,'') || ' ' || coalesce(c.body,'') || ' ' ||
        coalesce(c.site_name,'') || ' ' || coalesce(c.tags_index,'') || ' ' ||
        coalesce(c.summary,'')) not like ?`,
    )
    filterValues.push(`%${term}%`)
  }

  const filterSql = filters.join(' and ')

  // No text terms means a pure filter browse, for example "tag:typography".
  if (query.text.length === 0) {
    const rows = db()
      .prepare(
        `select c.* from cards c
         where ${filterSql}
         order by c.pinned desc, c.created_at desc
         limit ?`,
      )
      .all(...filterValues, limit) as Card[]
    return rows.map(toView)
  }

  const match = toMatchExpression(query.text)

  try {
    const rows = db()
      .prepare(
        `select c.* from card_fts
         join cards c on c.rowid = card_fts.rowid
         where card_fts match ? and ${filterSql}
         order by bm25(card_fts)
         limit ?`,
      )
      .all(match, ...filterValues, limit) as Card[]
    if (rows.length > 0) return rows.map(toView)
  } catch {
    // Fall through to the LIKE scan below if the match expression is rejected.
  }

  // Substring fallback. Catches the case where you half remember a domain or a
  // brand, which is exactly when the index misses.
  const likeFilters = [...filters]
  const likeValues = [...filterValues]
  for (const term of query.text) {
    likeFilters.push(
      `lower(coalesce(c.title,'') || ' ' || coalesce(c.body,'') || ' ' ||
        coalesce(c.site_name,'') || ' ' || coalesce(c.tags_index,'') || ' ' ||
        coalesce(c.summary,'') || ' ' || coalesce(c.domain,'')) like ?`,
    )
    likeValues.push(`%${term.toLowerCase()}%`)
  }

  const rows = db()
    .prepare(
      `select c.* from cards c
       where ${likeFilters.join(' and ')}
       order by c.pinned desc, c.created_at desc
       limit ?`,
    )
    .all(...likeValues, limit) as Card[]

  return rows.map(toView)
}

/* -------------------------------------------------------------------------- */
/* Bidirectional links                                                         */
/* -------------------------------------------------------------------------- */

export function linkCards(userId: string, fromId: string, toId: string) {
  if (fromId === toId) return
  const owned = db()
    .prepare('select count(*) as n from cards where user_id = ? and id in (?, ?)')
    .get(userId, fromId, toId) as { n: number }
  if (owned.n < 2) return

  db()
    .prepare('insert or ignore into card_links (from_id, to_id) values (?, ?)')
    .run(fromId, toId)
  db()
    .prepare('insert or ignore into card_links (from_id, to_id) values (?, ?)')
    .run(toId, fromId)
}

export function unlinkCards(userId: string, fromId: string, toId: string) {
  const owns = db()
    .prepare('select count(*) as n from cards where user_id = ? and id = ?')
    .get(userId, fromId) as { n: number }
  if (owns.n === 0) return

  db()
    .prepare('delete from card_links where (from_id = ? and to_id = ?) or (from_id = ? and to_id = ?)')
    .run(fromId, toId, toId, fromId)
}

export function linkedCards(userId: string, cardId: string): CardView[] {
  const rows = db()
    .prepare(
      `select c.* from card_links l
       join cards c on c.id = l.to_id
       where l.from_id = ? and c.user_id = ?
       order by c.created_at desc`,
    )
    .all(cardId, userId) as Card[]
  return rows.map(toView)
}

/** Cards that mention the same words, used to suggest links. */
export function relatedCards(userId: string, cardId: string, limit = 4): CardView[] {
  const target = getCard(userId, cardId)
  if (!target) return []

  const haystack = [target.title, target.body, target.tags.join(' '), target.domain]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const words = [...new Set(haystack.match(/[a-z0-9]{4,}/g) ?? [])].slice(0, 12)
  if (words.length === 0) return []

  const rows = db()
    .prepare(
      `select c.* from cards c
       where c.user_id = ? and c.id != ? and c.archived = 0
       order by (
         select count(*) from json_each(c.tags) jt
         where lower(jt.value) in (${words.map(() => '?').join(', ')})
       ) desc, c.created_at desc
       limit ?`,
    )
    .all(userId, cardId, ...words, limit) as Card[]

  return rows.map(toView)
}

/* -------------------------------------------------------------------------- */
/* Spaces (auto sorted collections)                                            */
/* -------------------------------------------------------------------------- */

export type Space = {
  id: string
  user_id: string
  name: string
  rule: string
  created_at: string
}

export function listSpaces(userId: string) {
  return db()
    .prepare('select * from spaces where user_id = ? order by name collate nocase')
    .all(userId) as Space[]
}

export function getSpace(userId: string, spaceId: string): Space | null {
  const row = db()
    .prepare('select * from spaces where id = ? and user_id = ?')
    .get(spaceId, userId) as Space | undefined
  return row ?? null
}

export function createSpace(userId: string, name: string, rule: string) {
  const id = newId()
  db()
    .prepare('insert into spaces (id, user_id, name, rule, created_at) values (?, ?, ?, ?, ?)')
    .run(id, userId, name.trim(), rule.trim(), nowIso())
  resyncSpace(id, userId)
  return id
}

export function deleteSpace(userId: string, id: string) {
  db().prepare('delete from spaces where id = ? and user_id = ?').run(id, userId)
}

/**
 * A space is a saved search. Rather than maintaining membership on every
 * write, the membership table is rebuilt from the rule whenever a space is
 * created or a card changes. Rules are small and personal, so this stays cheap
 * and it means tags edited later flow into existing spaces automatically.
 */
export function resyncSpace(spaceId: string, userId: string) {
  const space = db()
    .prepare('select * from spaces where id = ? and user_id = ?')
    .get(spaceId, userId) as Space | undefined
  if (!space) return

  const matches = searchCards(userId, space.rule, { limit: 500 })

  db().prepare('delete from space_cards where space_id = ?').run(spaceId)
  const insert = db().prepare('insert or ignore into space_cards (space_id, card_id) values (?, ?)')
  for (const card of matches) insert.run(spaceId, card.id)
}

export function resyncAllSpaces(userId: string) {
  for (const space of listSpaces(userId)) resyncSpace(space.id, userId)
}

export function spaceCards(userId: string, spaceId: string) {
  const rows = db()
    .prepare(
      `select c.* from space_cards sc
       join cards c on c.id = sc.card_id
       join spaces s on s.id = sc.space_id
       where sc.space_id = ? and c.user_id = ? and s.user_id = ?
       order by c.created_at desc`,
    )
    .all(spaceId, userId, userId) as Card[]
  return rows.map(toView)
}

/* -------------------------------------------------------------------------- */
/* Recall (rediscover)                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Surfaces something old that you have not been shown recently. A card you
 * dismissed is parked for a while so it stops coming back immediately.
 */
export function pickRecallCard(userId: string): CardView | null {
  const cooldown = new Date(Date.now() - 14 * 86_400_000).toISOString()

  const candidates = db()
    .prepare(
      `select * from cards c where c.user_id = ? and c.archived = 0
         and c.kind != 'image'
         and (c.recalled_at is null or c.recalled_at < ?)
         and (c.recall_state is null or c.recall_state != 'forgotten')
       order by coalesce(c.recalled_at, c.created_at) asc
       limit 12`,
    )
    .all(userId, cooldown) as Card[]

  if (candidates.length === 0) return null

  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  return toView(pick)
}

export function recordRecall(userId: string, cardId: string, keep: boolean) {
  db()
    .prepare('update cards set recall_state = ?, recalled_at = ? where id = ? and user_id = ?')
    .run(keep ? 'kept' : 'forgotten', nowIso(), cardId, userId)
}
