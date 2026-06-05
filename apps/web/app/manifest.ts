import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Documentation Studio',
    short_name: 'Documents',
    description: 'Costing, quotations & invoices for engineering & contracting companies',
    start_url: '/home',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F2EADB',
    theme_color: '#5C4433',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
