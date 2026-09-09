import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Markdown Editor',
    short_name: 'Markdown',
    description: 'A fast markdown editor that runs entirely in your browser.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f2f5',
    theme_color: '#f2f2f5',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
