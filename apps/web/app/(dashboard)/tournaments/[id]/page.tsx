'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Trophy, Users, Calendar, MapPin, ChevronLeft, Settings, Globe, Lock,
  Activity, CheckCircle, ExternalLink, UserPlus, Swords, ChevronRight, DollarSign,
  ClipboardList, Radio,
} from 'lucide-react';
import { tournamentsApi, Tournament } from '@/lib/api/tournaments';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('tournamentDetail');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'categories' | 'brackets' | 'invoices'>('overview');

  const STATUS_CONFIG = {
    PRIVATE:  { label: t('statusDraft'),    badge: 'badge-draft',   next: 'PUBLIC',   nextLabel: t('statusPublish') },
    PUBLIC:   { label: t('statusOpen'),     badge: 'badge-public',  next: 'ONGOING',  nextLabel: t('statusStartEvent') },
    ONGOING:  { label: t('statusLive'),     badge: 'badge-live',    next: 'FINISHED', nextLabel: t('statusFinishEvent') },
    FINISHED: { label: t('statusFinished'), badge: 'bg-muted/20 text-muted-foreground text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wider', next: null, nextLabel: null },
  };

  useEffect(() => {
    tournamentsApi
      .getOne(id)
      .then(setTournament)
      .catch(() => router.push('/tournaments'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusTransition() {
    if (!tournament) return;
    const cfg = STATUS_CONFIG[tournament.status];
    if (!cfg.next) return;
    setTransitioning(true);
    try {
      const updated = await tournamentsApi.setStatus(id, cfg.next);
      setTournament(updated);
    } catch {
      /* ignore */
    } finally {
      setTransitioning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!tournament) return null;

  const statusCfg = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.PRIVATE;

  const tabs = [
    { key: 'overview', label: t('tabOverview') },
    { key: 'registrations', label: t('tabRegistrations') },
    { key: 'categories', label: t('tabCategories') },
    { key: 'brackets', label: t('tabBrackets') },
    { key: 'invoices', label: t('tabInvoices') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t('backToList')}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={statusCfg.badge}>{statusCfg.label}</span>
            {tournament.status === 'ONGOING' && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <span className="live-dot" />
                {t('liveNow')}
              </span>
            )}
          </div>
          <h1 className="font-heading text-3xl text-foreground sm:text-4xl break-words">{tournament.name.toUpperCase()}</h1>
          {tournament.promoter && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('by')} {tournament.promoter.firstName} {tournament.promoter.lastName}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          {(tournament.status === 'PUBLIC' || tournament.status === 'ONGOING') && (
            <Link
              href={`/tournaments/${id}/register`}
              className="flex items-center gap-2 rounded border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('registerAthletes')}</span>
            </Link>
          )}
          {tournament.status === 'ONGOING' && (
            <>
              <Link
                href={`/tournaments/${id}/checkin`}
                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">{t('checkin')}</span>
              </Link>
              <Link
                href={`/tournaments/${id}/scoring`}
                className="flex items-center gap-2 rounded border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
              >
                <Swords className="h-4 w-4" />
                <span className="hidden sm:inline">{t('scoring')}</span>
              </Link>
              <Link
                href={`/t/${tournament.slug}/live`}
                target="_blank"
                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
              >
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline">{t('live')}</span>
              </Link>
            </>
          )}

          {statusCfg.next && (
            <button
              onClick={handleStatusTransition}
              disabled={transitioning}
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {transitioning ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              {statusCfg.nextLabel}
            </button>
          )}
          <Link
            href={`/t/${tournament.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">{t('publicPage')}</span>
          </Link>
          <Link
            href={`/tournaments/${id}/edit`}
            className="flex items-center justify-center rounded border border-border p-2 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('statAthletes')} value={String(tournament._count?.registrations ?? 0)} icon={Users} />
        <StatCard label={t('statCategories')} value={String(tournament._count?.categories ?? 0)} icon={Trophy} />
        <StatCard label={t('statAreas')} value={String(tournament.numAreas)} icon={MapPin} />
        <StatCard label={t('statStartDate')} value={formatDate(tournament.startDate)} icon={Calendar} small />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`shrink-0 px-5 py-3 text-sm font-medium uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab tournament={tournament} t={t} />}
      {activeTab === 'registrations' && <RegistrationsTab tournamentId={id} t={t} />}
      {activeTab === 'categories' && <CategoriesTab tournament={tournament} t={t} />}
      {activeTab === 'brackets' && <BracketsTabLink tournamentId={id} t={t} />}
      {activeTab === 'invoices' && <InvoicesTabLink tournamentId={id} t={t} />}
    </div>
  );
}

// ── Sub-tabs ──────────────────────────────────────────────────────────────────

type TFunc = ReturnType<typeof useTranslations<'tournamentDetail'>>;

function OverviewTab({ tournament, t }: { tournament: Tournament; t: TFunc }) {
  const infoRows = [
    { label: t('overviewStartDate'), value: formatDate(tournament.startDate) },
    { label: t('overviewEndDate'), value: formatDate(tournament.endDate) },
    { label: t('overviewDeadline'), value: formatDate(tournament.registrationDeadline) },
    { label: t('overviewDrawType'), value: tournament.drawType === 'ranking' ? t('overviewByRanking') : t('overviewRandom') },
    { label: t('overviewRounds'), value: String(tournament.numRounds) },
    { label: t('overviewVestLimit'), value: tournament.hasVestLimitation ? t('vestYes') : t('vestNo') },
  ];

  const visibilityRows = [
    { label: t('overviewAthletesList'), value: tournament.athletesVisible, icon: Users },
    { label: t('overviewDraw'), value: tournament.drawVisible, icon: Trophy },
    { label: t('overviewAreas'), value: tournament.areasVisible, icon: MapPin },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h3 className="font-heading text-lg text-foreground">{t('overviewDetails')}</h3>
        {infoRows.map((row) => (
          <div key={row.label} className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-foreground font-medium text-right">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h3 className="font-heading text-lg text-foreground">{t('overviewVisibility')}</h3>
        {visibilityRows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            {value ? (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('visibilityVisible')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                {t('visibilityHidden')}
              </span>
            )}
          </div>
        ))}

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              {t('overviewPublicUrl')}
            </div>
            <Link
              href={`/t/${tournament.slug}`}
              className="text-primary hover:underline truncate max-w-[160px]"
            >
              /t/{tournament.slug}
            </Link>
          </div>
        </div>
      </div>

      {tournament.description && (
        <div className="sm:col-span-2 rounded-lg border border-border bg-surface p-5">
          <h3 className="font-heading text-lg text-foreground mb-2">{t('overviewDescription')}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{tournament.description}</p>
        </div>
      )}
    </div>
  );
}

function RegistrationsTab({ tournamentId, t }: { tournamentId: string; t: TFunc }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentsApi
      .getRegistrations(tournamentId)
      .then(setRegistrations)
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-heading text-lg text-muted-foreground">{t('registrationsNoData')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('registrationsNoDataDesc')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-border bg-surface-elevated px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="col-span-3">{t('registrationsAthlete')}</span>
        <span className="col-span-3">{t('registrationsCategory')}</span>
        <span className="col-span-2">{t('registrationsClub')}</span>
        <span className="col-span-2">{t('registrationsWeight')}</span>
        <span className="col-span-2">{t('registrationsStatus')}</span>
      </div>
      <ul className="divide-y divide-border">
        {registrations.map((reg) => (
          <li
            key={reg.id}
            className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-12 sm:items-center sm:gap-3"
          >
            <div className="col-span-3 font-medium text-foreground">
              {reg.athlete?.firstName} {reg.athlete?.lastName}
            </div>
            <div className="col-span-3 text-muted-foreground">
              {reg.category?.grade?.nameEn ?? reg.category?.customName ?? '—'} · {reg.category?.gender?.code ?? '—'} ·{' '}
              {reg.category?.weightCategory?.strWeight ?? '—'}
            </div>
            <div className="col-span-2 text-muted-foreground">{reg.club?.sigla ?? reg.club?.name ?? '—'}</div>
            <div className="col-span-2 text-muted-foreground">{reg.weight ? `${reg.weight} kg` : '—'}</div>
            <div className="col-span-2">
              {reg.invoiceNote?.status === 'PAID' ? (
                <span className="badge-public">{t('regPaid')}</span>
              ) : (
                <span className="badge-draft">{t('regPending')}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoriesTab({ tournament, t }: { tournament: Tournament; t: TFunc }) {
  const cats = tournament.categories ?? [];
  const [openGrades, setOpenGrades] = useState<Set<string>>(new Set());

  if (cats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="font-heading text-lg text-muted-foreground">{t('categoriesNoData')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('categoriesNoDataDesc')}</p>
      </div>
    );
  }

  const grouped = cats.reduce<Record<string, { label: string; order: number; items: typeof cats }>>((acc, cat) => {
    const gradeKey = cat.isCustom ? '__custom__' : (cat.gradeId ?? '__unknown__');
    const gradeLabel = cat.isCustom ? 'Custom' : (cat.grade?.nameEn ?? cat.gradeId ?? '—');
    const gradeOrder = cat.grade?.displayOrder ?? 999;
    if (!acc[gradeKey]) acc[gradeKey] = { label: gradeLabel, order: gradeOrder, items: [] };
    acc[gradeKey].items.push(cat);
    return acc;
  }, {});

  const gradeGroups = Object.entries(grouped).sort((a, b) => a[1].order - b[1].order);

  function toggleGrade(key: string) {
    setOpenGrades((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {gradeGroups.map(([gradeKey, { label, items }]) => {
        const isOpen = openGrades.has(gradeKey);
        const totalAthletes = items.reduce((s, c) => s + (c._count?.registrations ?? 0), 0);

        return (
          <div key={gradeKey} className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => toggleGrade(gradeKey)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-surface hover:bg-surface-elevated transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
                <span className="font-heading text-base text-foreground">{label.toUpperCase()}</span>
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? t('categoriesCategory') : t('categoriesCategories')}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{totalAthletes} {t('categoriesAthletes').toLowerCase()}</span>
            </button>

            {isOpen && (
              <div className="border-t border-border">
                <div className="hidden sm:grid grid-cols-12 gap-3 bg-surface-elevated px-5 py-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="col-span-2">{t('categoriesGender')}</span>
                  <span className="col-span-4">{t('categoriesWeight')}</span>
                  <span className="col-span-2">{t('categoriesVest')}</span>
                  <span className="col-span-2">{t('categoriesMinAge')}</span>
                  <span className="col-span-2">{t('categoriesAthletes')}</span>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((cat) => (
                    <li
                      key={cat.id}
                      className="grid grid-cols-1 gap-1 px-5 py-2.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-3"
                    >
                      <div className="col-span-2 font-medium text-foreground">
                        {cat.gender?.code === 'M' ? t('genderMale') : cat.gender?.code === 'F' ? t('genderFemale') : '—'}
                      </div>
                      <div className="col-span-4 text-muted-foreground">
                        {cat.isCustom
                          ? (cat.customName ?? '—')
                          : (cat.weightCategory?.displayNameEn ?? cat.weightCategory?.strWeight ?? '—')}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {cat.vestType ? `Vest ${cat.vestType}` : '—'}
                      </div>
                      <div className="col-span-2 text-muted-foreground">—</div>
                      <div className="col-span-2 text-muted-foreground">{cat._count?.registrations ?? 0}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  small,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  small?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-2 font-heading text-foreground ${small ? 'text-2xl' : 'text-4xl'}`}>{value}</p>
    </div>
  );
}

function InvoicesTabLink({ tournamentId, t }: { tournamentId: string; t: TFunc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
      <DollarSign className="h-12 w-12 text-muted-foreground/20 mb-4" />
      <h3 className="font-heading text-xl text-muted-foreground">{t('invoicesTitle')}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{t('invoicesDesc')}</p>
      <Link
        href={`/tournaments/${tournamentId}/invoices`}
        className="mt-6 flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        <DollarSign className="h-4 w-4" />
        {t('invoicesOpen')}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function BracketsTabLink({ tournamentId, t }: { tournamentId: string; t: TFunc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
      <Swords className="h-12 w-12 text-muted-foreground/20 mb-4" />
      <h3 className="font-heading text-xl text-muted-foreground">{t('bracketsTitle')}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{t('bracketsDesc')}</p>
      <Link
        href={`/tournaments/${tournamentId}/brackets`}
        className="mt-6 flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        <Swords className="h-4 w-4" />
        {t('bracketsOpen')}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
