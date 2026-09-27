'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser, endSession } from '@/lib/session'
import { db } from '@/lib/db'

/**
 * Deletes the account and everything attached to it.
 *
 * The client must send `confirm` set to the account email. A destructive action
 * that a stray request or a mis-click can trigger needs more than a button
 * click, and this keeps the guard on the server rather than only in the UI.
 */
export async function deleteAccount(formData: FormData) {
  const user = await requireUser('/library/settings')

  const confirmation = String(formData.get('confirm') ?? '').trim()
  if (confirmation.toLowerCase() !== user.email.toLowerCase()) {
    return { error: 'Type your email address exactly to confirm.' }
  }

  // Cards, links, spaces and sessions all cascade from users via foreign keys.
  db().prepare('delete from users where id = ?').run(user.id)

  await endSession()
  revalidatePath('/', 'layout')
  redirect('/')
}
