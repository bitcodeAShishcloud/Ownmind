'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Compass, FolderOpen, Pin, Sparkles } from 'lucide-react'

type NavLink = {
  href: string
  label: string
  /** Filter value this link represents, for the query based views. */
  filter?: string
  icon?: typeof Pin
}

const LINKS: NavLink[] = [
  { href: '/library', label: 'Everything' },
  { href: '/library?kind=note', label: 'Notes', filter: 'note' },
  { href: '/library?kind=link', label: 'Links', filter: 'link' },
  { href: '/library?kind=image', label: 'Images', filter: 'image' },
  { href: '/library?kind=article', label: 'Articles', filter: 'article' },
  { href: '/library/pinned', label: 'Pinned', icon: Pin },
  { href: '/library/spaces', label: 'Spaces', icon: FolderOpen },
  { href: '/library/recall', label: 'Recall', icon: Sparkles },
  { href: '/library/settings', label: 'Settings', icon: Compass },
]

/**
 * View switcher for the library. A client component because marking the active
 * view needs the current pathname and search params.
 */
export function LibraryNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeFilter = searchParams.get('kind')

  function isActive(link: NavLink) {
    if (link.filter) {
      return pathname === '/library' && activeFilter === link.filter
    }
    if (link.href === '/library') {
      return pathname === '/library' && activeFilter === null
    }
    return pathname === link.href || pathname.startsWith(`${link.href}/`)
  }

  return (
    <nav aria-label="Views" className="mx-auto w-full max-w-[1600px] px-4 pb-2 sm:px-6">
      <ul className="flex items-center gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          const active = isActive(link)

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'flex items-center gap-1.5 rounded-[5px] border border-line bg-surface px-2.5 py-1.5 text-[0.8125rem] font-medium text-ink'
                    : 'flex items-center gap-1.5 rounded-[5px] border border-transparent px-2.5 py-1.5 text-[0.8125rem] text-ink-2 hover:border-line hover:bg-surface hover:text-ink'
                }
              >
                {link.icon ? <link.icon size={13} strokeWidth={1.75} /> : null}
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
