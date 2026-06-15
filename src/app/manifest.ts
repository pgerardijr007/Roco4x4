import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ROCO 4X4 Portal',
    short_name: 'ROCO 4X4',
    description: 'High-performance cataloging engine for ROCO 4x4 sales reps.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1d2d',
    theme_color: '#1a1d2d',
    icons: [
      {
        src: '/api/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/api/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}
