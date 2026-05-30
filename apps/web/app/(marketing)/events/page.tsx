'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, MapPin, Calendar, Clock, Users, Trophy, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { tournamentsApi, TournamentEvent } from '@/lib/api/tournaments';

// ── Country flag emoji map ────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  PT: '🇵🇹', ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪', IT: '🇮🇹', GB: '🇬🇧',
  IE: '🇮🇪', NL: '🇳🇱', BE: '🇧🇪', CH: '🇨🇭', AT: '🇦🇹', PL: '🇵🇱',
  CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', RO: '🇷🇴', BG: '🇧🇬', HR: '🇭🇷',
  RS: '🇷🇸', GR: '🇬🇷', TR: '🇹🇷', RU: '🇷🇺', UA: '🇺🇦', BR: '🇧🇷',
  US: '🇺🇸', CA: '🇨🇦', MX: '🇲🇽', AR: '🇦🇷', CO: '🇨🇴', CL: '🇨🇱',
  KR: '🇰🇷', JP: '🇯🇵', CN: '🇨🇳', AU: '🇦🇺', NZ: '🇳🇿', ZA: '🇿🇦',
  MA: '🇲🇦', EG: '🇪🇬', NG: '🇳🇬', AO: '🇦🇴', MZ: '🇲🇿',
};

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', ES: 'Espanha', FR: 'França', DE: 'Alemanha', IT: 'Itália',
  GB: 'Reino Unido', IE: 'Irlanda', NL: 'Países Baixos', BE: 'Bélgica',
  CH: 'Suíça', AT: 'Áustria', PL: 'Polónia', CZ: 'Rep. Checa', SK: 'Eslováquia',
  HU: 'Hungria', RO: 'Roménia', BG: 'Bulgária', HR: 'Croácia', RS: 'Sérvia',
  GR: 'Grécia', TR: 'Turquia', RU: 'Rússia', UA: 'Ucrânia', BR: 'Brasil',
  US: 'EUA', CA: 'Canadá', MX: 'México', AR: 'Argentina', CO: 'Colômbia',
  CL: 'Chile', KR: 'Coreia do Sul', JP: 'Japão', CN: 'China', AU: 'Austrália',
  NZ: 'Nova Zelândia', ZA: 'África do Sul', MA: 'Marrocos', EG: 'Egito',
  NG: 'Nigéria', AO: 'Angola', MZ: 'Moçambique',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr: string) {
  return new Date(timeStr).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'ONGOING') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold bg-primary text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        AO VIVO
      </span>
    );
  }
  if (status === 'PUBLIC') {
    return <span className="rounded px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">ABERTO</span>;
  }
  return <span className="rounded px-2 py-0.5 text-xs font-semibold bg-border text-muted-foreground">TERMINADO</span>;
}

// ── Tournament card ───────────────────────────────────────────────────────────

function TournamentEventCard({ event }: { event: TournamentEvent }) {
  const flag = FLAG[event.country] ?? '🌍';
  const countryName = COUNTRY_NAMES[event.country] ?? event.country;
  const isOpen = event.status === 'PUBLIC';
  const isLive = event.status === 'ONGOING';
  const deadline = new Date(event.registrationDeadline);
  const deadlinePassed = deadline < new Date();

  return (
    <div className={`rounded-lg border bg-surface flex flex-col transition-colors hover:border-primary/50 ${isLive ? 'border-primary/40' : 'border-border'}`}>
      <div className="p-5 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {flag} {countryName}{event.city ? ` · ${event.city}` : ''}
          </p>
          <StatusBadge status={event.status} />
        </div>

        <h3 className="font-heading text-lg text-foreground leading-tight">{event.name}</h3>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(event.startDate)}</span>
            <Clock className="h-3.5 w-3.5 shrink-0 ml-2" />
            <span>{formatTime(event.startTime)}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />{event._count.categories} cat.</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event._count.registrations} atletas</span>
        </div>

        {isOpen && !deadlinePassed && (
          <p className="text-xs text-primary font-medium">
            Inscrições até {formatDate(event.registrationDeadline)}
          </p>
        )}
        {deadlinePassed && isOpen && (
          <p className="text-xs text-muted-foreground">Inscrições encerradas</p>
        )}
      </div>

      <div className="px-5 pb-5">
        <Link
          href={`/t/${event.slug}`}
          className="block w-full rounded border border-border py-2 text-center text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
        >
          Ver Torneio →
        </Link>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-3 animate-pulse">
      <div className="h-3 w-24 bg-border rounded" />
      <div className="h-5 w-3/4 bg-border rounded" />
      <div className="h-3 w-1/2 bg-border rounded" />
      <div className="h-3 w-2/3 bg-border rounded" />
      <div className="h-8 w-full bg-border rounded mt-4" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'upcoming' | 'live' | 'past';

export default function EventsPage() {
  const t = useTranslations('events');

  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await tournamentsApi.getEvents({
        country: country || undefined,
        status: status === 'all' ? undefined : status,
        search: debouncedSearch || undefined,
        page,
      });
      setEvents(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [country, status, debouncedSearch, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [country, status, debouncedSearch]);

  const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'upcoming', label: t('filterUpcoming') },
    { key: 'live', label: t('filterLive') },
    { key: 'past', label: t('filterPast') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="font-heading text-xl tracking-widest"><span className="text-primary">KOMBATLY</span><span className="text-foreground">PRO</span></Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link href="/register" className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                Registar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('subtitle')}</p>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
          {total > 0 && !loading && (
            <p className="mt-2 text-sm text-muted-foreground">{total} torneios encontrados</p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Country */}
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{t('filterAllCountries')}</option>
            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
              <option key={code} value={code}>{FLAG[code]} {name}</option>
            ))}
          </select>

          {/* Status tabs */}
          <div className="flex rounded border border-border bg-surface overflow-hidden text-xs font-semibold">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={`px-3 py-2 transition-colors ${status === f.key ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-muted-foreground">Erro ao carregar torneios.</p>
            <button onClick={fetchEvents} className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-red-700">
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/30" />
            <p className="font-heading text-xl text-foreground">{t('noEvents')}</p>
            <p className="text-sm text-muted-foreground">{t('noEventsDesc')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map(event => <TournamentEventCard key={event.id} event={event} />)}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <span className="text-sm text-muted-foreground">{page} / {pages}</span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="font-heading tracking-widest"><span className="text-primary">KOMBATLY</span><span className="text-foreground">PRO</span></Link>
          <p className="mt-2">© {new Date().getFullYear()} KombatlyPro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
