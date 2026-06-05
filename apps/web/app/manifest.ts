import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Documentation Studio',
    short_name: 'Documents',
    description: 'Costing, quotations & invoices for engineering & contracting companies',
    start_url: '/home',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ECECEE',
    theme_color: '#ECECEE',
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
