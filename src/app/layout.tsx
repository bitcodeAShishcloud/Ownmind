import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { site } from '@/lib/site'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

/**
 * Runs while the browser is still parsing the head, so the correct theme is on
 * <html> before anything is painted. Without this the page flashes light on a
 * dark mode load.
 */
const themeScript = `(function(){try{
var stored=localStorage.getItem('ownmind-theme');
var prefers=window.matchMedia('(prefers-color-scheme: dark)').matches;
var dark=stored==='dark'||(stored!=='light'&&prefers);
document.documentElement.classList.toggle('dark',dark);
}catch(e){}})();`

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}: ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description:
    'A private place for your notes, bookmarks, screenshots and articles. OwnMind reads each one, tags it automatically, and gives it back when you search. No folders, no tags, no filing.',
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: [
    'bookmarking',
    'read later',
    'personal knowledge base',
    'no folders',
    'private notes',
    'visual bookmarks',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: `${site.name}: ${site.tagline}`,
    description:
      'Save links, notes, screenshots and articles. OwnMind labels them for you and brings them back when you search.',
    url: site.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name}: ${site.tagline}`,
    description: 'A private place for everything you save. No folders, no tags.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'productivity',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ec' },
    { media: '(prefers-color-scheme: dark)', color: '#121110' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      // globals.css sets scroll-behavior: smooth for in page anchor links.
      // Next 16 only applies its scroll to top override on a route change when
      // this attribute is present. Without it, a client side navigation would
      // inherit the previous page's scroll offset.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
