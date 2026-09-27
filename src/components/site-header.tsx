'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { navLinks } from '@/lib/site'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/92 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-[1.0625rem]">
          <OwnMindMark />
          <span>OwnMind</span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[5px] px-2.5 py-1.5 text-[0.875rem] text-ink-2 hover:bg-surface hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <ThemeToggle />

          <Link href="/signin" className="btn btn-ghost hidden h-9 text-[0.8125rem] sm:inline-flex">
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-primary h-9 text-[0.8125rem]">
            Start saving
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn btn-ghost h-9 w-9 !px-0 md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav aria-label="Main" className="border-t border-line md:hidden">
          <ul className="mx-auto flex w-full max-w-6xl flex-col px-5 py-2 sm:px-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-[0.9375rem] text-ink-2"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/signin"
                onClick={() => setOpen(false)}
                className="block py-2.5 text-[0.9375rem] text-ink-2"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}

/** Solid mark. No gradient, no glow, legible at 20px. */
function OwnMindMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      <g fill="var(--bg)">
        <rect x="7.5" y="8.5" width="17" height="3" rx="1.5" />
        <rect x="7.5" y="14.5" width="17" height="3" rx="1.5" />
        <rect x="7.5" y="20.5" width="11" height="3" rx="1.5" />
      </g>
    </svg>
  )
}
