import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  // Only the public marketing pages belong here. Signed in views are blocked in
  // robots.txt and are per user anyway.
  const pages: Array<{
    path: string
    priority: number
    changeFrequency: 'weekly' | 'monthly' | 'yearly'
  }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/how', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/why', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/cookie-policy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/contact', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/data-deletion', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  ]

  return pages.map((page) => ({
    url: `${site.url}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
