import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${bebasNeue.variable} font-body`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
