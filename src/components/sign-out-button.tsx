'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

export function SignOutButton({ email, initials }: { email: string; initials: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center rounded-[5px] border border-line-strong px-2 text-xs font-medium text-ink-2 hover:bg-surface"
      >
        <span className="grid h-5 w-5 place-items-center rounded-[3px] bg-accent text-[0.625rem] font-semibold text-on-accent">
          {initials}
        </span>
        <span className="ml-1.5 hidden sm:inline">Account</span>
      </button>

      {open ? (
        <>
          {/* Click anywhere else to dismiss. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="panel absolute right-0 z-50 mt-1.5 w-60 overflow-hidden p-1"
          >
            <p className="truncate px-2.5 py-2 text-xs text-muted">{email}</p>
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-2"
              >
                <LogOut size={14} strokeWidth={1.75} />
                Sign out
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  )
}
