import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation AI',
  description: 'Costing sheets for contracting companies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
