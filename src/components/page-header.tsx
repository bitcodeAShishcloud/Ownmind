import type { ReactNode } from 'react'

/** Consistent inner page header for the marketing pages. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-[2rem] leading-[1.08] sm:text-[2.5rem]">{title}</h1>
        {lede ? (
          <div className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{lede}</div>
        ) : null}
        {children}
      </div>
    </header>
  )
}

export function Section({
  children,
  alt = false,
  className = '',
}: {
  children: ReactNode
  alt?: boolean
  className?: string
}) {
  return (
    <section className={alt ? 'border-b border-line bg-bg-alt' : 'border-b border-line'}>
      <div className={`mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-18 ${className}`}>
        {children}
      </div>
    </section>
  )
}
