import Link from 'next/link'
import { site } from '@/lib/site'

/**
 * The mark: three bars in a rounded square. Drawn inline so it inherits the
 * current text colour in the header and footer, and stays crisp at any size.
 */
export function Mark({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <g fill="var(--mark-cut, var(--bg))">
        <rect x="7.5" y="8.5" width="17" height="3" rx="1.5" />
        <rect x="7.5" y="14.5" width="17" height="3" rx="1.5" />
        <rect x="7.5" y="20.5" width="11" height="3" rx="1.5" />
      </g>
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 text-ink hover:text-accent-ink ${className}`}
      style={{ ['--mark-cut' as string]: 'var(--surface)' }}
    >
      <Mark />
      <span className="font-display text-[1.0625rem] tracking-tight">{site.name}</span>
    </Link>
  )
}
