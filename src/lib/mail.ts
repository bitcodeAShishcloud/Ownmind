/**
 * Outbound email.
 *
 * OwnMind needs email for exactly two things: a password reset link, and service
 * notices. There is no marketing email, and there is no third party tracking
 * pixel in anything sent from here.
 *
 * With no provider configured the message is written to the server log instead.
 * That makes the flow testable in development, and in production it is a loud,
 * visible misconfiguration rather than a silent failure.
 *
 * Server only.
 */

import { site } from './site'

type Message = {
  to: string
  subject: string
  text: string
  html?: string
}

function provider() {
  const apiKey = process.env.OWNMIND_MAIL_API_KEY
  if (!apiKey) return null
  return {
    apiKey,
    // Resend compatible by default. Any provider with the same shape works.
    endpoint: process.env.OWNMIND_MAIL_ENDPOINT || 'https://api.resend.com/emails',
    from: process.env.OWNMIND_MAIL_FROM || `OwnMind <no-reply@${site.domain}>`,
  }
}

export function isMailConfigured() {
  return provider() !== null
}

/** Returns true if the message was handed off, false if it was only logged. */
export async function sendEmail(message: Message): Promise<boolean> {
  const config = provider()

  if (!config) {
    // Never log the recipient's full address alongside a reset token in
    // production, but always log enough to diagnose a missing mailer.
    console.warn(
      `[mail] not configured, message not sent. subject="${message.subject}" to=${maskEmail(message.to)}`,
    )
    return false
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    })

    if (!response.ok) {
      console.error(`[mail] provider returned ${response.status} for "${message.subject}"`)
      return false
    }
    return true
  } catch (error) {
    console.error(`[mail] send failed for "${message.subject}":`, (error as Error).message)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local.slice(0, 2)}***@${domain}`
}

/** In development the reset link is printed so it can be used without a mailer. */
export function logResetLink(email: string, url: string) {
  if (process.env.NODE_ENV === 'production') return
  console.warn(`\n[mail] password reset for ${email}\n[mail] ${url}\n`)
}

export function passwordResetEmail(email: string, url: string): Message {
  return {
    to: email,
    subject: `Reset your ${site.name} password`,
    text: [
      `Someone asked to reset the password for this ${site.name} account.`,
      '',
      'Open this link to choose a new password. It works once and expires in one hour:',
      '',
      url,
      '',
      'If that was not you, ignore this message. Nothing has changed and your current',
      'password still works.',
      '',
      site.legalName,
    ].join('\n'),
    html: [
      `<p>Someone asked to reset the password for this ${site.name} account.</p>`,
      `<p><a href="${url}">Choose a new password</a></p>`,
      '<p>The link works once and expires in one hour.</p>',
      '<p>If that was not you, ignore this message. Nothing has changed and your current password still works.</p>',
    ].join(''),
  }
}
