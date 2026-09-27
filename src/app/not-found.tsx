import Link from 'next/link'
import { Mark } from '@/components/mark'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-5 py-16 sm:px-6">
      <Mark size={28} className="text-accent" />

      <h1 className="mt-6 text-3xl">That page is not here</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
        The link may be old, or the item may have been deleted. If it was something you saved,
        search for it rather than guessing at the address.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary h-10 px-5">
          Back to the start
        </Link>
        <Link href="/library/search" className="btn btn-outline h-10 px-5">
          Search your library
        </Link>
      </div>
    </div>
  )
}
