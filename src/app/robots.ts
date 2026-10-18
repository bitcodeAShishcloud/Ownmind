import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Signed in areas, API endpoints, and the privacy dashboard have nothing
        // useful to index. The dashboard additionally sets noindex in its own
        // metadata, because robots.txt is a request not to crawl, not a
        // guarantee that nothing will.
        disallow: ['/library', '/api/', '/admin/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
