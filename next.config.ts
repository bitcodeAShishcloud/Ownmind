import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // The git repository for this machine is the home directory, so Turbopack
    // would otherwise walk the whole home folder looking for a lockfile.
    root: process.cwd(),
  },
  serverExternalPackages: ['node:sqlite'],
}

export default nextConfig
