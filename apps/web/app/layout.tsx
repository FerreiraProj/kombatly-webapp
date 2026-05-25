import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Taekwombats', template: '%s | Taekwombats' },
  description: 'Elite-level software for high-stakes Taekwondo competition. Precision scoring, automated brackets, and seamless athlete management.',
  keywords: ['taekwondo', 'tournament', 'management', 'brackets', 'sports'],
  authors: [{ name: 'Taekwombats' }],
  openGraph: {
    type: 'website',
    siteName: 'Taekwombats',
    title: 'Taekwombats — Master Your Tournament',
    description: 'Elite tournament management for Taekwondo.',
  },
};

export const viewport: Viewport = {
  themeColor: '#CC0000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${bebasNeue.variable} font-body`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
