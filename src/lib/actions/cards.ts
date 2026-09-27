'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { enrich } from '@/lib/enrich'
import { saveDataUrl } from '@/lib/media'
import { normalizeUrl } from '@/lib/extract'
import {
  createCard,
  createSpace,
  deleteCard,
  deleteSpace,
  linkCards,
  recordRecall,
  resyncAllSpaces,
  searchCards,
  unlinkCards,
  updateCard,
  type CardView,
} from '@/lib/cards'

export type SaveState = {
  error?: string
  /** The card that was created, so the client can clear itself. */
  savedId?: string
  savedTitle?: string
}

/**
 * The single entry point for saving. The client sends one blob of text and
 * OwnMind works out whether that is a note, a link or an article.
 */
export async function saveCard(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const user = await requireUser('/library')

  const raw = String(formData.get('content') ?? '').trim()
  const imageData = String(formData.get('image') ?? '').trim()
  const accent = String(formData.get('accent') ?? '').trim() || null
  const pinned = formData.get('pinned') === 'on'

  if (!raw && !imageData) {
    return { error: 'Type something or add an image first.' }
  }

  // A lone URL is a bookmark. Anything else is written as a note.
  const asUrl = normalizeUrl(raw)
  const isBareUrl = Boolean(asUrl) && /^https?:\/\/\S+$/i.test(raw)

  const image = imageData ? saveDataUrl(imageData) : null
  if (imageData && !image) {
    return { error: 'That image could not be saved. Try a JPG, PNG, WebP or GIF.' }
  }

  const result = await enrich({
    url: isBareUrl ? raw : null,
    title: isBareUrl ? null : raw || null,
    body: isBareUrl ? null : raw || null,
    imageUrl: image?.url ?? null,
    accent: accent || null,
  })

  const card = createCard(user.id, {
    kind: result.kind,
    title: result.title,
    body: result.body,
    url: result.url,
    siteName: result.siteName,
    domain: result.domain,
    excerpt: result.excerpt,
    imageUrl: result.imageUrl,
    accent: result.accent,
    tags: result.tags,
    summary: result.summary,
  })

  if (pinned) updateCard(user.id, card.id, { pinned: true })
  resyncAllSpaces(user.id)

  revalidatePath('/library')
  return { savedId: card.id, savedTitle: card.title ?? 'Saved' }
}

export async function removeCard(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  deleteCard(user.id, id)
  revalidatePath('/library')
}

export async function setPinned(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const next = formData.get('pinned') === 'true'
  updateCard(user.id, id, { pinned: next })
  revalidatePath('/library')
}

export async function archiveCard(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  updateCard(user.id, id, { archived: true })
  revalidatePath('/library')
}

export async function editCard(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'That card no longer exists.' }

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '')
  const tagLine = String(formData.get('tags') ?? '')
  const tags = tagLine
    .split(/[,\n]/)
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, 8)

  updateCard(user.id, id, {
    title: title || null,
    body: body || null,
    tags,
  })
  resyncAllSpaces(user.id)

  revalidatePath('/library')
  revalidatePath(`/library/card/${id}`)
  return { savedId: id, savedTitle: title }
}

export async function toggleLink(formData: FormData) {
  const user = await requireUser()
  const from = String(formData.get('from') ?? '')
  const to = String(formData.get('to') ?? '')
  const remove = formData.get('remove') === 'true'
  if (!from || !to) return

  if (remove) unlinkCards(user.id, from, to)
  else linkCards(user.id, from, to)

  revalidatePath(`/library/card/${from}`)
  revalidatePath(`/library/card/${to}`)
}

export async function addSpace(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const user = await requireUser('/library/spaces')
  const name = String(formData.get('name') ?? '').trim()
  const rule = String(formData.get('rule') ?? '').trim()

  if (!name) return { error: 'Give the space a name.' }
  if (!rule) return { error: 'Add a rule, for example: tag:typography' }

  if (searchCards(user.id, rule, { limit: 1 }).length === 0) {
    return { error: `No cards match "${rule}" yet. Save something first, then try again.` }
  }

  createSpace(user.id, name, rule)
  revalidatePath('/library/spaces')
  return { savedTitle: name }
}

export async function removeSpace(formData: FormData) {
  const user = await requireUser('/library/spaces')
  const id = String(formData.get('id') ?? '')
  if (!id) return

  deleteSpace(user.id, id)
  revalidatePath('/library/spaces')
}

export async function respondToRecall(formData: FormData) {
  const user = await requireUser('/library/recall')
  const id = String(formData.get('id') ?? '')
  const keep = formData.get('keep') === 'true'
  if (!id) return

  if (!keep) {
    // Forgetting archives it, so it stops being offered but is never destroyed.
    updateCard(user.id, id, { archived: true })
  }
  recordRecall(user.id, id, keep)

  redirect('/library/recall')
}

export async function setTheme(formData: FormData) {
  const user = await requireUser()
  const theme = String(formData.get('theme') ?? 'system')
  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') return

  const { db } = await import('@/lib/db')
  db().prepare('update users set theme = ? where id = ?').run(theme, user.id)
  revalidatePath('/', 'layout')
}

export type { CardView }
