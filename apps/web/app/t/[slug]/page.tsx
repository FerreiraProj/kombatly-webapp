import Link from 'next/link';
import { Calendar, MapPin, Users, Trophy, Clock, Swords } from 'lucide-react';
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

  // Group categories by grade, sorted by grade displayOrder
  const gradeGroups: { gradeId: string; gradeName: string; displayOrder: number; cats: any[] }[] = [];
  const gradeMap = new Map<string, typeof gradeGroups[0]>();
  for (const cat of categories) {
    const key = cat.gradeId ?? 'custom';
    if (!gradeMap.has(key)) {
      const entry = {
        gradeId: key,
        gradeName: cat.grade?.nameEn ?? cat.grade?.namePt ?? t('customCategory'),
        displayOrder: cat.grade?.displayOrder ?? 999,
        cats: [],
      };
      gradeMap.set(key, entry);
      gradeGroups.push(entry);
    }
    gradeMap.get(key)!.cats.push(cat);
  }
  gradeGroups.sort((a, b) => a.displayOrder - b.displayOrder);

  function weightLabel(cat: any): string {
    if (cat.isCustom) return cat.customName ?? t('customCategory');
    return cat.weightCategory?.displayNameEn ?? cat.weightCategory?.strWeight ?? '—';
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

        {/* Categories grouped by grade */}
        {gradeGroups.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-2xl text-foreground">{t('categoriesTitle')}</h2>
            <div className="space-y-2">
              {gradeGroups.map((group) => (
                <details key={group.gradeId} className="group rounded-lg border border-border bg-surface overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 hover:bg-surface-elevated transition-colors list-none">
                    <div className="flex items-center gap-3">
                      <svg className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-heading text-sm uppercase tracking-widest text-foreground">{group.gradeName}</span>
                      <span className="text-xs text-muted-foreground">{group.cats.length} {group.cats.length === 1 ? t('categoriesCategory') : t('categoriesCategories')}</span>
                    </div>
                  </summary>
                  <div className="border-t border-border">
                    <div className="hidden sm:grid grid-cols-12 gap-3 bg-surface-elevated px-5 py-2 text-xs uppercase tracking-widest text-muted-foreground">
                      <span className="col-span-5">{t('colCategory')}</span>
                      <span className="col-span-3">{t('colGender')}</span>
                      <span className="col-span-4">{t('colVest')}</span>
                    </div>
                    <ul className="divide-y divide-border/50">
                      {group.cats.map((cat: any) => (
                        <li key={cat.id} className="grid grid-cols-1 gap-1 px-5 py-2.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                          <div className="col-span-5 font-medium text-foreground">{weightLabel(cat)}</div>
                          <div className="col-span-3 text-muted-foreground text-xs">
                            {cat.gender?.code === 'M' ? t('genderMale') : cat.gender?.code === 'F' ? t('genderFemale') : '—'}
                          </div>
                          <div className="col-span-4 text-muted-foreground text-xs">
                            {cat.vestType ? `Vest ${cat.vestType}` : '—'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Public athletes list */}
        {tournament.publicAthletes && tournament.publicAthletes.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-2xl text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" /> {t('athletesTitle')}
            </h2>
            {(() => {
              const byCategory: Record<string, { label: string; order: number; athletes: any[] }> = {};
              for (const reg of tournament.publicAthletes) {
                const key = reg.categoryId ?? 'unknown';
                if (!byCategory[key]) {
                  const g = reg.category?.grade?.nameEn ?? '';
                  const gc = reg.category?.gender?.code ?? '';
                  const w = reg.category?.weightCategory?.displayNameEn ?? reg.category?.weightCategory?.strWeight ?? '';
                  byCategory[key] = { label: [g, gc, w].filter(Boolean).join(' · '), order: 0, athletes: [] };
                }
                byCategory[key].athletes.push(reg);
              }
              return (
                <div className="space-y-2">
                  {Object.entries(byCategory).map(([key, group]) => (
                    <details key={key} className="group rounded-lg border border-border bg-surface overflow-hidden" open>
                      <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 hover:bg-surface-elevated transition-colors list-none">
                        <div className="flex items-center gap-3">
                          <svg className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-heading text-sm uppercase tracking-widest text-foreground">{group.label || t('unknownCategory')}</span>
                          <span className="text-xs text-muted-foreground">{group.athletes.length}</span>
                        </div>
                      </summary>
                      <ul className="border-t border-border divide-y divide-border/50">
                        {group.athletes.map((reg: any, i: number) => (
                          <li key={reg.id ?? i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                            <span className="font-medium text-foreground">{reg.athlete.firstName} {reg.athlete.lastName}</span>
                            <span className="text-xs text-muted-foreground">{reg.club?.sigla ?? reg.club?.name ?? '—'}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              );
            })()}
          </section>
        )}

        {/* Public brackets */}
        {tournament.brackets && tournament.brackets.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-2xl text-foreground flex items-center gap-2">
              <Swords className="h-5 w-5 text-muted-foreground" /> {t('bracketsTitle')}
            </h2>
            {(() => {
              const byCategory: Record<string, { label: string; combats: any[] }> = {};
              for (const combat of tournament.brackets) {
                const key = combat.categoryId ?? 'unknown';
                if (!byCategory[key]) {
                  const cat = (tournament.categories ?? []).find((c: any) => c.id === key);
                  const g = cat?.grade?.nameEn ?? '';
                  const gc = cat?.gender?.code ?? '';
                  const w = cat?.weightCategory?.displayNameEn ?? cat?.weightCategory?.strWeight ?? '';
                  byCategory[key] = { label: [g, gc, w].filter(Boolean).join(' · ') || t('unknownCategory'), combats: [] };
                }
                byCategory[key].combats.push(combat);
              }
              return (
                <div className="space-y-3">
                  {Object.entries(byCategory).map(([key, group]) => (
                    <details key={key} className="group rounded-lg border border-border bg-surface overflow-hidden">
                      <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 hover:bg-surface-elevated transition-colors list-none">
                        <div className="flex items-center gap-3">
                          <svg className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-heading text-sm uppercase tracking-widest text-foreground">{group.label}</span>
                          <span className="text-xs text-muted-foreground">{group.combats.length} combates</span>
                        </div>
                      </summary>
                      <div className="border-t border-border">
                        <div className="hidden sm:grid grid-cols-12 gap-2 bg-surface-elevated px-5 py-2 text-xs uppercase tracking-widest text-muted-foreground">
                          <span className="col-span-1">#</span>
                          <span className="col-span-2">Ronda</span>
                          <span className="col-span-4">Vermelho</span>
                          <span className="col-span-4">Azul</span>
                          <span className="col-span-1">Estado</span>
                        </div>
                        <ul className="divide-y divide-border/50">
                          {group.combats.map((c: any) => {
                            const red = c.redAthlete ? `${c.redAthlete.athlete.firstName} ${c.redAthlete.athlete.lastName}` : 'TBD';
                            const blue = c.blueAthlete ? `${c.blueAthlete.athlete.firstName} ${c.blueAthlete.athlete.lastName}` : 'TBD';
                            const statusColor = c.status === 'IN_PROGRESS' ? 'text-primary' : c.status === 'FINISHED' ? 'text-green-400' : 'text-muted-foreground';
                            return (
                              <li key={c.id} className="grid grid-cols-1 gap-1 px-5 py-2.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-2">
                                <span className="col-span-1 font-semibold text-muted-foreground">#{c.combatNumber}</span>
                                <span className="col-span-2 text-xs text-muted-foreground uppercase">{c.roundType?.replace('_', ' ')}</span>
                                <span className={`col-span-4 font-medium ${c.winnerId === c.redAthleteId && c.winnerId ? 'text-yellow-400' : 'text-foreground'}`}>{red}{c.status === 'FINISHED' && c.winnerId === c.redAthleteId ? ' 🥇' : ''}</span>
                                <span className={`col-span-4 font-medium ${c.winnerId === c.blueAthleteId && c.winnerId ? 'text-yellow-400' : 'text-foreground'}`}>{blue}{c.status === 'FINISHED' && c.winnerId === c.blueAthleteId ? ' 🥇' : ''}</span>
                                <span className={`col-span-1 text-xs ${statusColor}`}>
                                  {c.status === 'IN_PROGRESS' ? '●' : c.status === 'FINISHED' ? '✓' : '○'}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </details>
                  ))}
                </div>
              );
            })()}
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
