import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { EventsContent } from '@/components/events/EventsContent';
import { MobileNav } from '../MobileNav';

export default async function EventsPage() {
  const t = await getTranslations('landing');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Same nav as landing page */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="font-heading text-2xl tracking-widest">
              <span className="text-primary">KOMBATLY</span><span className="text-foreground">PRO</span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
              <a href="/#features" className="hover:text-foreground transition-colors">{t('navFeatures')}</a>
              <Link href="/events" className="text-primary font-semibold">{t('navEvents')}</Link>
              <a href="/#pricing" className="hover:text-foreground transition-colors">{t('navPricing')}</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/register" className="hidden md:inline-flex rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                {t('navGetStarted')}
              </Link>
              <MobileNav navEvents={t('navEvents')} navPricing={t('navPricing')} navGetStarted={t('navGetStarted')} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <EventsContent />
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="font-heading tracking-widest">
            <span className="text-primary">KOMBATLY</span><span className="text-foreground">PRO</span>
          </Link>
          <p className="mt-2">© {new Date().getFullYear()} KombatlyPro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
