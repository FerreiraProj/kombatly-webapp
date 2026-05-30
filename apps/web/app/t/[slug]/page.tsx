import Link from 'next/link';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { RegisterCta } from './RegisterCta';

type Tournament = any;

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

async function getTournament(slug: string): Promise<Tournament | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${base}/tournaments/slug/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tournament, t] = await Promise.all([
    getTournament(slug),
    getTranslations('public'),
  ]);

  if (!tournament || (tournament.status === 'PRIVATE')) {
    notFound();
  }

  const isLive = tournament.status === 'ONGOING';
  const isOpen = tournament.status === 'PUBLIC';
  const categories = tournament.categories ?? [];

  function categoryLabel(cat: any): string {
    if (cat.isCustom) return cat.customName ?? t('customCategory');
    const grade = cat.grade?.names?.en ?? '';
    const gender = cat.gender?.code === 'M' ? t('genderMale') : cat.gender?.code === 'F' ? t('genderFemale') : '';
    const weight = cat.weightCategory?.displayNames?.en ?? cat.weightCategory?.strWeight ?? '';
    return [grade, gender, weight].filter(Boolean).join(' · ');
  }

  const infoGrid = [
    { icon: Calendar, label: t('startDate'),  value: fmt(tournament.startDate) },
    { icon: Clock,    label: t('startTime'),  value: fmtTime(tournament.startTime) },
    { icon: Calendar, label: t('deadline'),   value: fmt(tournament.registrationDeadline) },
    { icon: MapPin,   label: t('areas'),      value: String(tournament.numAreas) },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-heading text-lg tracking-widest"><span className="text-primary">KOMBATLY</span><span className="text-foreground">PRO</span></Link>
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="badge-live flex items-center gap-1">
                <span className="live-dot" /> {t('statusLive')}
              </span>
            ) : isOpen ? (
              <span className="badge-public">{t('statusOpen')}</span>
            ) : (
              <span className="bg-muted/20 text-muted-foreground text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                {tournament.status === 'FINISHED' ? t('statusFinished') : tournament.status}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        {/* Hero */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {tournament.promoter
              ? t('organisedBy', { name: `${tournament.promoter.firstName} ${tournament.promoter.lastName}` })
              : t('tournament')}
          </p>
          <h1 className="font-heading text-4xl text-foreground sm:text-6xl">
            {tournament.name.toUpperCase()}
          </h1>
          {tournament.description && (
            <p className="max-w-2xl text-muted-foreground leading-relaxed">{tournament.description}</p>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {infoGrid.map(({ icon: Icon, label, value }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Categories table */}
        {categories.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-2xl text-foreground">{t('categoriesTitle')}</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-border bg-surface-elevated px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="col-span-5">{t('colCategory')}</span>
                <span className="col-span-3">{t('colGrade')}</span>
                <span className="col-span-2">{t('colGender')}</span>
                <span className="col-span-2">{t('colVest')}</span>
              </div>
              <ul className="divide-y divide-border">
                {categories.map((cat: any) => (
                  <li key={cat.id} className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                    <div className="col-span-5 font-medium text-foreground">{categoryLabel(cat)}</div>
                    <div className="col-span-3 text-muted-foreground text-xs">{cat.grade?.names?.en ?? '—'}</div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {cat.gender?.code === 'M' ? t('genderMale') : cat.gender?.code === 'F' ? t('genderFemale') : '—'}
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {cat.vestType ? `Vest ${cat.vestType}` : '—'}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Registration CTA */}
        {isOpen && (
          <RegisterCta
            tournamentId={tournament.id}
            deadline={tournament.registrationDeadline}
            ctaTitle={t('ctaTitle')}
            ctaDeadline={t('ctaDeadline', { date: fmt(tournament.registrationDeadline) })}
            ctaBtn={t('ctaBtn')}
            loginToRegister={t('loginToRegister')}
          />
        )}

        {isLive && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-6 text-center space-y-2">
            <span className="badge-live text-base px-4 py-1">
              <span className="live-dot mr-2" />{t('liveLabel')}
            </span>
            <p className="text-sm text-muted-foreground mt-2">{t('liveDesc')}</p>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        <p>{t('poweredBy')} <span className="text-primary font-medium">Taekwombats</span></p>
      </footer>
    </div>
  );
}
