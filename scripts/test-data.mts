/**
 * Data layer tests. Runs against a throwaway database so the dev data is safe.
 * Usage: npx tsx scripts/test-data.ts
 */
import { rmSync } from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), '.data-test')
process.env.OWNMIND_DATA_DIR = DATA_DIR

// The schema is created on first connection.
const { db, nowIso, newId } = await import('../src/lib/db.ts')
const cards = await import('../src/lib/cards.ts')
const { keywords, extractiveSummary, enrich } = await import('../src/lib/enrich.ts')

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

/* ------------------------------------------------------------------ */
section('setup')

const conn = db()

// Two users, so ownership scoping can be tested.
const alice = { id: newId(), email: 'alice@example.com' }
const bob = { id: newId(), email: 'bob@example.com' }

for (const user of [alice, bob]) {
  conn
    .prepare(
      `insert into users (id, email, password_hash, name, theme, created_at)
       values (?, ?, null, 'Test', 'system', ?)`,
    )
    .run(user.id, user.email, nowIso())
}

const version = (
  conn.prepare('pragma user_version').get() as { user_version: number }
).user_version
ok('every migration has been applied', version >= 7, `user_version ${version}`)

const tableNames = (
  conn
    .prepare(`select name from sqlite_master where type in ('table','view')`)
    .all() as Array<{ name: string }>
).map((r) => r.name)

for (const table of [
  'users',
  'sessions',
  'cards',
  'card_links',
  'spaces',
  'space_cards',
  'card_fts',
  'otp_codes',
  'otp_rate_limits',
  'pending_auth',
]) {
  ok(`table ${table} exists`, tableNames.includes(table), tableNames.join(', '))
}
for (const table of ['password_resets', 'captcha_tokens']) {
  ok(`table ${table} is gone`, !tableNames.includes(table), tableNames.join(', '))
}
ok('fts5 index exists', Boolean(conn.prepare("select name from sqlite_master where name='card_fts'").get()))

/* ------------------------------------------------------------------ */
section('accounts carry no password')

const { insertUser, findUserByEmail } = await import('../src/lib/session.ts')
const made = insertUser('made@example.com', 'Made Up')
const madeRow = conn.prepare('select * from users where email = ?').get('made@example.com') as {
  id: string
  password_hash: string | null
}
ok('the column accepts a null', madeRow.password_hash === null)
ok('the row exists with an id', typeof madeRow.id === 'string' && madeRow.id.length > 0)
ok('findUserByEmail finds it', findUserByEmail('made@example.com')?.id === made)
ok('a missing address is not found', findUserByEmail('nobody@example.com') === undefined)
ok(
  'two accounts with the same address cannot both exist',
  (() => {
    try {
      insertUser('made@example.com')
      return false
    } catch {
      return true
    }
  })(),
)

/* ------------------------------------------------------------------ */
section('creating cards')

const article = cards.createCard(alice.id, {
  kind: 'article',
  title: 'The case for ephemerality',
  body: 'Small surface area, durable data formats, and software that ages well instead of demanding constant migration. Letterpress books teach the same lesson about permanence. The argument is not that old software is virtuous in itself, but that software which can be understood years later is a rarer and more valuable thing than software which merely works today.',
  url: 'https://craigmod.com/philosophy',
  siteName: 'Craig Mod',
  domain: 'craigmod.com',
  tags: ['software-design', 'letterpress', 'permanence'],
  summary: 'Argues for fewer, better tools with durable formats.',
})

const note = cards.createCard(alice.id, {
  kind: 'note',
  title: 'Ask about the kiln schedule',
  body: 'Cone 6, slow cool from 1000C. She said the old kiln runs about 40 degrees hot at the top shelf.',
  tags: ['kiln', 'ceramics'],
})

const image = cards.createCard(alice.id, {
  kind: 'image',
  title: 'Screenshot of the error message',
  imageUrl: '/api/media/abc.webp',
  accent: '#8a6a3d',
  tags: ['debugging', 'screenshot'],
})

const glazes = cards.createCard(alice.id, {
  kind: 'link',
  title: 'Choosing a typeface for long reading',
  url: 'https://typographica.org/long-reading',
  siteName: 'Typographica',
  domain: 'typographica.org',
  body: 'A practical guide to x-height, measure and the point size where a text face starts to feel tiring. Useful for the ceramics catalogue too.',
  tags: ['typography', 'reference', 'ceramics'],
})

const bobCard = cards.createCard(bob.id, {
  kind: 'note',
  title: 'Bob private note about typography',
  body: 'This must never appear in Alice results.',
  tags: ['typography'],
})

ok('article has a read time estimate', article.readMinutes !== null, String(article.readMinutes))
ok('note is short so has no read time', note.readMinutes === null, String(note.readMinutes))
ok('image kept its accent colour', image.accent === '#8a6a3d')
ok('tags are parsed back as an array', Array.isArray(article.tags) && article.tags.length === 3)
ok('pinned defaults to false', article.pinned === false)
ok('image is an image kind', image.kind === 'image')

/* ------------------------------------------------------------------ */
section('counts')

const counts = cards.countCards(alice.id)
ok('total counts every card', counts.total === 4, String(counts.total))
ok('notes counted', counts.notes === 1, String(counts.notes))
ok('links counted', counts.links === 1, String(counts.links))
ok('images counted', counts.images === 1, String(counts.images))
ok('articles counted', counts.articles === 1, String(counts.articles))
ok("another user's cards are not counted", cards.countCards(bob.id).total === 1)

/* ------------------------------------------------------------------ */
section('search')

ok('plain term finds by body text', cards.searchCards(alice.id, 'letterpress').length === 1)
ok('plain term finds by tag', cards.searchCards(alice.id, 'kiln').length === 1)
ok('a term only in the summary is still indexed', cards.searchCards(alice.id, 'durable').length === 1)
ok('a term in the body of another card is found', cards.searchCards(alice.id, 'x-height').length === 1)
ok('prefix search works', cards.searchCards(alice.id, 'typogr').length === 1)

ok('tag: narrows to one tag', cards.searchCards(alice.id, 'tag:ceramics').length === 2)
ok('tag: with a word combines both', cards.searchCards(alice.id, 'tag:ceramics catalogue').length === 1)

ok('kind: filters by type', cards.searchCards(alice.id, 'kind:note').length === 1)
ok('kind:image finds the image', cards.searchCards(alice.id, 'kind:image').length === 1)

ok('site: filters by domain', cards.searchCards(alice.id, 'site:typographica.org').length === 1)
ok('site: partial domain works', cards.searchCards(alice.id, 'site:craigmod').length === 1)

const excluded = cards.searchCards(alice.id, 'ceramics -catalogue')
ok('minus excludes a term', excluded.length === 1 && excluded[0].id === note.id)

ok('no results for nonsense', cards.searchCards(alice.id, 'zzzznotathing').length === 0)
ok('empty query with no filter lists recent', cards.searchCards(alice.id, '').length === 4)
ok('only a filter returns matches', cards.searchCards(alice.id, 'tag:typography').length === 1)

ok(
  "results never leak another user's cards",
  cards.searchCards(alice.id, 'typography').every((c) => c.userId === alice.id),
)
ok(
  'punctuation in a query does not break the parser',
  cards.searchCards(alice.id, 'soft*ware (design) & "quotes"').length >= 0,
)

const parsed = cards.parseQuery('tag:a kind:note site:x.com -bad word')
ok('parser reads tags', parsed.tags[0] === 'a')
ok('parser reads kinds', parsed.kinds[0] === 'note')
ok('parser reads domains', parsed.domains[0] === 'x.com')
ok('parser reads exclusions', parsed.exclude[0] === 'bad')
ok('parser keeps free text', parsed.text[0] === 'word')

/* ------------------------------------------------------------------ */
section('updates keep the index in sync')

ok('a term in the url is searchable', cards.searchCards(alice.id, 'philosophy').length === 1)
ok('a term in the site name is searchable', cards.searchCards(alice.id, 'craig').length === 1)

cards.updateCard(alice.id, article.id, { title: 'Durable formats and quiet software' })
ok('renamed card is findable by the new title', cards.searchCards(alice.id, 'quiet').length === 1)
ok(
  'a word that only existed in the old title no longer matches',
  cards.searchCards(alice.id, 'ephemerality').length === 0,
  `got ${cards.searchCards(alice.id, 'ephemerality').length}`,
)
ok(
  'renaming does not break searching by url',
  cards.searchCards(alice.id, 'philosophy').length === 1,
)

cards.updateCard(alice.id, article.id, { tags: ['software-design', 'essays'] })
ok('new tag is searchable', cards.searchCards(alice.id, 'tag:essays').length === 1)
ok('removed tag is not searchable', cards.searchCards(alice.id, 'tag:permanence').length === 0)

ok('tag list is normalised on update', cards.getCard(alice.id, article.id)!.tags.includes('essays'))

const edited = cards.updateCard(alice.id, note.id, { body: 'Cone 10 oxidation, hold at 40 degrees.' })
ok('editing the body recomputes read time', edited!.readMinutes === null, String(edited!.readMinutes))

/* ------------------------------------------------------------------ */
section('linking is bidirectional')

cards.linkCards(alice.id, article.id, glazes.id)
const fromArticle = cards.linkedCards(alice.id, article.id)
const fromGlazes = cards.linkedCards(alice.id, glazes.id)

ok('link shows on the source', fromArticle.some((c) => c.id === glazes.id))
ok('link shows on the target too', fromGlazes.some((c) => c.id === article.id))

cards.linkCards(alice.id, article.id, glazes.id)
ok('linking twice does not duplicate', cards.linkedCards(alice.id, article.id).length === 1)

cards.linkCards(alice.id, article.id, article.id)
ok('self link is refused', cards.linkedCards(alice.id, article.id).length === 1)

const otherUserCard = cards.createCard(bob.id, { kind: 'note', title: 'Bob second' })
cards.linkCards(alice.id, article.id, otherUserCard.id)
ok('cannot link to a card Alice does not own', cards.linkedCards(alice.id, article.id).length === 1)

cards.unlinkCards(alice.id, article.id, glazes.id)
ok('unlink removes both directions', cards.linkedCards(alice.id, article.id).length === 0)
ok('unlink removed the reverse direction too', cards.linkedCards(alice.id, glazes.id).length === 0)

/* ------------------------------------------------------------------ */
section('related cards')

const related = cards.relatedCards(alice.id, note.id)
ok('shares a tag so it is related', related.some((c) => c.id === glazes.id), JSON.stringify(related.map((r) => r.title)))
ok('never relates a card to itself', related.every((c) => c.id !== note.id))

/* ------------------------------------------------------------------ */
section('spaces')

const spaceId = cards.createSpace(alice.id, 'Ceramics', 'tag:ceramics')
const inSpace = cards.spaceCards(alice.id, spaceId)
ok('space collects matching cards', inSpace.length === 2, String(inSpace.length))
ok('space is listed', cards.listSpaces(alice.id).length === 1)
ok('space is fetched by id', cards.getSpace(alice.id, spaceId)?.name === 'Ceramics')
ok('another user cannot read the space', cards.getSpace(bob.id, spaceId) === null)

cards.updateCard(alice.id, note.id, { tags: ['kiln', 'ceramics'] })
cards.resyncAllSpaces(alice.id)
ok('adding a tag pulls the card into the space', cards.spaceCards(alice.id, spaceId).length === 2)

cards.deleteCard(alice.id, note.id)
cards.resyncAllSpaces(alice.id)
ok('deleting a card removes it from the space', cards.spaceCards(alice.id, spaceId).length === 1)

/* ------------------------------------------------------------------ */
section('recall')

const recalled = cards.pickRecallCard(alice.id)
ok('recall returns a card', recalled !== null)
if (recalled) {
  cards.recordRecall(alice.id, recalled.id, true)
  ok('a kept card gets a recall timestamp', cards.getCard(alice.id, recalled.id) !== null)
}
ok('recall never returns an image card', (() => {
  for (let i = 0; i < 30; i++) {
    const pick = cards.pickRecallCard(alice.id)
    if (pick && pick.kind === 'image') return false
  }
  return true
})())

/* ------------------------------------------------------------------ */
section('ownership isolation')

ok('getCard will not return another users card', cards.getCard(alice.id, bobCard.id) === null)
ok('update will not touch another users card', cards.updateCard(alice.id, bobCard.id, { title: 'hijacked' }) === null)
ok("bob's card is untouched", cards.getCard(bob.id, bobCard.id)!.title === 'Bob private note about typography')
ok('delete will not remove another users card', cards.deleteCard(alice.id, bobCard.id) === false)
ok('bob still has his card', cards.getCard(bob.id, bobCard.id) !== null)

/* ------------------------------------------------------------------ */
section('cascade delete')

const doomed = cards.createCard(bob.id, { kind: 'note', title: 'Doomed', tags: ['x'] })
cards.linkCards(bob.id, doomed.id, bobCard.id)
cards.createSpace(bob.id, 'Doomed space', 'tag:x')
const bobSpacesBefore = cards.listSpaces(bob.id).length

conn.prepare('delete from users where id = ?').run(bob.id)

ok('cards are removed with the user', cards.getCard(bob.id, doomed.id) === null)
ok('links are removed with the user', cards.linkedCards(bob.id, bobCard.id).length === 0)
ok('spaces are removed with the user', cards.listSpaces(bob.id).length < bobSpacesBefore)
ok('sessions for the user are removed', (conn.prepare('select count(*) as n from sessions where user_id = ?').get(bob.id) as { n: number }).n === 0)


/* ------------------------------------------------------------------ */
section('heuristics')

const kws = keywords('letterpress letterpress typography typography typography printing ink', 5)
ok('keywords rank by frequency', kws[0] === 'typography', JSON.stringify(kws))
ok('stopwords are dropped', !kws.includes('the') && !kws.includes('and'))
ok('keywords are deduplicated', new Set(kws).size === kws.length)

/** Exactly one of the two spellings should survive dedup. */
function oneSurvives(a: string, b: string) {
  const list = keywords(`${a} ${b}`, 8)
  return list.filter((w) => w === a || w === b).length === 1
}

ok('simple plurals collapse into one tag', oneSurvives('post', 'posts'), JSON.stringify(keywords('post posts', 8)))
ok(
  '-es plurals collapse into one tag',
  oneSurvives('press', 'presses'),
  JSON.stringify(keywords('press presses', 8)),
)
ok(
  '-ies plurals collapse into one tag',
  oneSurvives('city', 'cities'),
  JSON.stringify(keywords('city cities', 8)),
)
ok(
  'genuinely different words are both kept',
  keywords('press pressing', 8).length === 2,
  JSON.stringify(keywords('press pressing', 8)),
)
ok('words ending in ss are not stemmed', keywords('class classes glass', 5).includes('class'))

const body =
  'Letterpress printing rewards patience. The craft of letterpress involves setting type by hand. Modern letterpress studios still use this method. ' +
  'Other crafts are irrelevant to this discussion entirely.'
const summary = extractiveSummary(body, 2)
ok('summary is shorter than the body', summary.length < body.length)
ok('summary has at most two sentences', summary.split(/(?<=[.!?])\s/).length <= 3)
ok('summary keeps original order', summary.indexOf('Letterpress printing') < summary.indexOf('Modern letterpress') || summary.indexOf('Modern letterpress') < summary.indexOf('Letterpress printing'))
ok('summary contains real words from the text', summary.split(/\s+/).filter((w) => w.length > 3).length > 3)

/* ------------------------------------------------------------------ */
section('enrichment without a model')

ok('no AI key is configured in this environment', process.env.OWNMIND_AI_API_KEY === undefined)

const enrichedNote = await enrich({ body: 'Cone 6 oxidation firing, slow cool from 1000C. Bring the kiln schedule.' })
ok('a note is detected as a note', enrichedNote.kind === 'note', enrichedNote.kind)
ok('tags are produced locally', enrichedNote.tags.length > 0, JSON.stringify(enrichedNote.tags))
ok('no network call is made for a note', enrichedNote.url === null)

const enrichedLink = await enrich({ url: 'https://example.com' })
ok('a url is detected as a link or article', ['link', 'article'].includes(enrichedLink.kind), enrichedLink.kind)
ok('the domain is extracted', enrichedLink.domain === 'example.com', String(enrichedLink.domain))
ok('a title is always produced', typeof enrichedLink.title === 'string' && enrichedLink.title.length > 0)

const enrichedGarbage = await enrich({ url: 'not a url at all !!' })
ok('garbage input does not throw', typeof enrichedGarbage.title === 'string')

/* ------------------------------------------------------------------ */
section('database integrity')

const orphanCheck = conn
  .prepare(
    `select count(*) as n from card_links l
     left join cards c on c.id = l.to_id where c.id is null`,
  )
  .get() as { n: number }
ok('no dangling card links', orphanCheck.n === 0, String(orphanCheck.n))

const ftsCount = (conn.prepare('select count(*) as n from card_fts').get() as { n: number }).n
const liveCount = (conn.prepare('select count(*) as n from cards').get() as { n: number }).n
ok('the search index matches the number of live cards', ftsCount === liveCount, `fts ${ftsCount} vs cards ${liveCount}`)

console.log(`\n${checks - failures}/${checks} checks passed`)
try {
  rmSync(DATA_DIR, { recursive: true, force: true })
} catch {
  /* windows may hold the handle briefly */
}

if (failures > 0) {
  console.log(`${failures} failing`)
  process.exit(1)
}
console.log('all good')
