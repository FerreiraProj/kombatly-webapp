'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Plus, Users, Calendar, ChevronRight, Search } from 'lucide-react';
import { tournamentsApi, Tournament } from '@/lib/api/tournaments';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PRIVATE:  { label: 'Draft',    className: 'badge-draft' },
  PUBLIC:   { label: 'Open',     className: 'badge-public' },
  ONGOING:  { label: 'Live',     className: 'badge-live' },
  FINISHED: { label: 'Finished', className: 'bg-muted/20 text-muted-foreground text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wider' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentsApi.getMine().then(setTournaments).finally(() => setLoading(false));
  }, []);

  const filtered = tournaments.filter((t) => {
    const matchesStatus = filter === 'ALL' || t.status === filter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { key: 'ALL',      label: 'All' },
    { key: 'PRIVATE',  label: 'Draft' },
    { key: 'PUBLIC',   label: 'Open' },
    { key: 'ONGOING',  label: 'Live' },
    { key: 'FINISHED', label: 'Finished' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Promoter Console</p>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">TOURNAMENTS</h1>
        </div>
        <Link
          href="/tournaments/create"
          className="flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shrink-0 mt-1"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Tournament</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition-colors ${
                filter === tab.key
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments..."
            className="w-full rounded border border-border bg-surface pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 sm:w-64"
          />
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Table header (desktop) */}
        <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-border bg-surface-elevated px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="col-span-4">Name</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Athletes</span>
          <span className="col-span-3">Date</span>
          <span className="col-span-1" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!search || filter !== 'ALL'} />
        ) : (
          <ul>
            {filtered.map((t, i) => {
              const s = STATUS_LABELS[t.status] ?? STATUS_LABELS.PRIVATE;
              return (
                <li key={t.id}>
                  <Link
                    href={`/tournaments/${t.id}`}
                    className={`flex items-center gap-3 px-4 py-4 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6 hover:bg-surface-elevated transition-colors group ${
                      i < filtered.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    {/* Name + icon */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground sm:hidden">{formatDate(t.startDate)}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 hidden sm:flex items-center">
                      <span className={s.className}>{s.label}</span>
                    </div>

                    {/* Athletes */}
                    <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {t._count?.registrations ?? 0}
                    </div>

                    {/* Date */}
                    <div className="col-span-3 hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{formatDate(t.startDate)}</span>
                    </div>

                    {/* Arrow */}
                    <div className="col-span-1 flex items-center justify-end">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    {/* Mobile status pill */}
                    <div className="sm:hidden ml-auto shrink-0">
                      <span className={s.className}>{s.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* FAB mobile */}
      <Link
        href="/tournaments/create"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-red-700 transition-colors lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
      {hasSearch ? (
        <>
          <p className="font-heading text-xl text-muted-foreground">NO RESULTS</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter</p>
        </>
      ) : (
        <>
          <p className="font-heading text-xl text-muted-foreground">NO TOURNAMENTS YET</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first tournament to get started</p>
          <Link
            href="/tournaments/create"
            className="mt-6 inline-flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Tournament
          </Link>
        </>
      )}
    </div>
  );
}
