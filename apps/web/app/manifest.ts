import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Documentation Studio',
    short_name: 'Documents',
    description: 'Costing, quotations & invoices for engineering & contracting companies',
    start_url: '/home',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0C0C0E',
    theme_color: '#0C0C0E',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
