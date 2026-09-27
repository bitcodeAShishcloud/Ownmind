/**
 * Date and text formatting.
 *
 * Dates are formatted in UTC with a fixed locale so that server rendered markup
 * and any later client render agree. An archive should show you the day you
 * saved something, not a "3 days ago" that changes every time you look.
 */

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
  hour12: false,
})

export function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return DATE_FORMAT.format(date)
}

export function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${DATE_TIME_FORMAT.format(date)} UTC`
}

/** Single line, hard capped. Used for card previews and page titles. */
export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).replace(/\s+\S*$/, '')}...`
}

export function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function initials(email: string) {
  const name = email.split('@')[0] ?? ''
  const parts = name.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
