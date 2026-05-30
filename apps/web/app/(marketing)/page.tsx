import Link from 'next/link';
import { Trophy, Zap, Users, BarChart3, ChevronRight, Check } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function LandingPage() {
  const t = await getTranslations('landing');

  const features = [
    {
      icon: <Trophy className="h-6 w-6" />,
      title: t('feature1Title'),
      description: t('feature1Desc'),
      tags: [t('feature1Tag1'), t('feature1Tag2')],
      highlight: false,
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: t('feature2Title'),
      description: t('feature2Desc'),
      tags: [],
      highlight: true,
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: t('feature3Title'),
      description: t('feature3Desc'),
      tags: [],
      highlight: false,
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: t('feature4Title'),
      description: t('feature4Desc'),
      tags: [t('feature4Tag1')],
      highlight: false,
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: t('feature5Title'),
      description: t('feature5Desc'),
      tags: [],
      highlight: false,
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: t('feature6Title'),
      description: t('feature6Desc'),
      tags: [t('feature6Tag1')],
      highlight: false,
    },
  ];

  const planPromoterFeatures = [
    t('planPromoterFeature1'),
    t('planPromoterFeature2'),
    t('planPromoterFeature3'),
    t('planPromoterFeature4'),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <span className="font-heading text-2xl text-primary tracking-widest">TAEKWOMBATS</span>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
              <a href="#features" className="hover:text-foreground transition-colors">{t('navFeatures')}</a>
              <Link href="/events" className="text-primary font-semibold hover:text-red-700 transition-colors">{t('navEvents')}</Link>
              <a href="#pricing" className="hover:text-foreground transition-colors">{t('navPricing')}</a>
            </nav>
            <Link
              href="/register"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              {t('navGetStarted')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-red-950/20" />
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="h-full w-full bg-gradient-to-l from-primary/30 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-4 inline-block rounded bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              {t('heroBadge')}
            </div>
            <h1 className="font-heading text-6xl leading-none tracking-wide text-foreground sm:text-7xl lg:text-8xl">
              {t('heroH1')}
              <br />
              <span className="text-primary">{t('heroH1Span')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              {t('heroDesc')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded bg-primary px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                {t('heroCta')}
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded border border-border px-6 py-3 font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {t('heroDemo')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-4xl tracking-wide text-foreground sm:text-5xl">
                {t('featuresTitle')}
              </h2>
              <div className="mt-2 h-0.5 w-12 bg-primary" />
            </div>
            <p className="hidden max-w-sm text-right text-sm text-muted-foreground md:block">
              {t('featuresDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-y border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="font-heading text-4xl tracking-widest text-foreground sm:text-5xl">
              {t('pricingTitle')}{' '}
              <span className="text-primary">{t('pricingTitleSpan')}</span>
            </p>
            <p className="mt-4 text-muted-foreground">
              {t('pricingDesc')}
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {/* Promoter Pro */}
            <div className="rounded-lg border border-border bg-background p-8">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {t('planPromoterTitle')}
              </p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-heading text-6xl text-foreground">{t('planPromoterPrice')}</span>
                <span className="mb-2 text-sm text-muted-foreground">{t('planPromoterUnit')}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {planPromoterFeatures.map((item, i) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={i < 3 ? 'text-foreground' : 'text-muted-foreground'}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full rounded bg-primary py-3 text-center font-semibold text-white hover:bg-red-700 transition-colors"
              >
                {t('planPromoterCta')}
              </Link>
            </div>

            {/* Federation */}
            <div className="rounded-lg border border-primary/30 bg-background p-8">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {t('planFedTitle')}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('planFedDesc')}
              </p>
              <blockquote className="mt-8 border-l-2 border-primary pl-4">
                <p className="text-sm italic text-muted-foreground">
                  {t('planFedQuote')}
                </p>
                <cite className="mt-2 block text-xs text-muted-foreground">
                  {t('planFedCite')}
                </cite>
              </blockquote>
              <button className="mt-8 block w-full rounded border border-border py-3 text-center font-semibold text-foreground hover:border-primary hover:text-primary transition-colors">
                {t('planFedCta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-heading text-5xl text-foreground sm:text-6xl">
            {t('ctaTitle')}
            <br />
            {t('ctaTitleLine2')}
          </h2>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-block rounded bg-primary px-10 py-4 font-semibold text-white hover:bg-red-700 transition-colors"
            >
              {t('ctaBtn')}
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              {t('ctaNote')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <span className="font-heading text-xl tracking-widest text-foreground">TAEKWOMBATS</span>
            <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">{t('footerTerms')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('footerPrivacy')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('footerSupport')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('footerRanking')}</a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {t('footerCopyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  tags,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  highlight: boolean;
}) {
  return (
    <div
      className={`p-8 ${
        highlight
          ? 'bg-primary text-white'
          : 'bg-surface text-foreground hover:bg-surface-elevated'
      } transition-colors`}
    >
      <div className={`mb-4 ${highlight ? 'text-white' : 'text-primary'}`}>{icon}</div>
      <h3 className={`font-heading text-xl tracking-wide ${highlight ? 'text-white' : 'text-foreground'}`}>
        {title}
      </h3>
      <p className={`mt-3 text-sm leading-relaxed ${highlight ? 'text-red-100' : 'text-muted-foreground'}`}>
        {description}
      </p>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                highlight
                  ? 'bg-white/20 text-white'
                  : 'bg-border text-muted-foreground'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
