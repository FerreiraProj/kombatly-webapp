'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Users, DollarSign, Plus, ChevronRight, Calendar, Activity } from 'lucide-react';
import { tournamentsApi, Tournament } from '@/lib/api/tournaments';
import { invoicesApi, Invoice } from '@/lib/api/invoices';
import { useAuthStore } from '@/lib/store/auth.store';

const STATUS_CONFIG = {
  PRIVATE:  { label: 'Draft',    cls: 'badge-draft' },
  PUBLIC:   { label: 'Open',     cls: 'badge-public' },
  ONGOING:  { label: 'Live',     cls: 'badge-live' },
  FINISHED: { label: 'Finished', cls: 'bg-muted/20 text-muted-foreground text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wider' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ONGOING' | 'FINISHED'>('ALL');

  useEffect(() => {
    Promise.all([
      tournamentsApi.getMine(),
      invoicesApi.findMine().catch(() => [] as Invoice[]),
    ]).then(([t, inv]) => {
      setTournaments(t);
      setInvoices(inv);
    }).finally(() => setLoading(false));
  }, []);

  const totalAthletes = tournaments.reduce((s, t) => s + (t._count?.registrations ?? 0), 0);
  const liveCount = tournaments.filter((t) => t.status === 'ONGOING').length;
  const paidRevenue = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + Number(i.totalAmount), 0);

  const filtered = tournaments.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const upcoming = tournaments
    .filter((t) => t.status === 'PUBLIC' || t.status === 'ONGOING')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 1)[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Elite Promoter Command</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">
          {user?.firstName ? `WELCOME, ${user.firstName.toUpperCase()}` : 'TOURNAMENT OVERVIEW'}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Total Registered Athletes
          </div>
          <p className="mt-2 font-heading text-5xl text-foreground">
            {loading ? '—' : totalAthletes}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" /> Active Tournaments
          </div>
          <p className="mt-2 font-heading text-5xl text-foreground">
            {loading ? '—' : tournaments.filter((t) => t.status !== 'FINISHED').length}
          </p>
          {liveCount > 0 && (
            <span className="mt-1 flex items-center gap-1 text-xs text-primary">
              <span className="live-dot" /> {liveCount} Live Now
            </span>
          )}
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" /> Revenue Collected
          </div>
          <p className="mt-2 font-heading text-5xl text-gold">
            {loading ? '—' : `€${paidRevenue.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Upcoming event banner */}
      {upcoming && (
        <Link
          href={`/tournaments/${upcoming.id}`}
          className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4 hover:bg-primary/10 transition-colors group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-primary mb-0.5">
              {upcoming.status === 'ONGOING' ? 'Now Live' : 'Next Event'}
            </p>
            <p className="font-semibold text-foreground truncate">{upcoming.name}</p>
            <p className="text-xs text-muted-foreground">{fmt(upcoming.startDate)}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Tournament list */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl text-foreground">MANAGED TOURNAMENTS</h2>
          <div className="flex gap-1">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'ONGOING', label: 'Live' },
              { key: 'FINISHED', label: 'Done' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded text-xs font-medium uppercase tracking-wider transition-colors ${
                  filter === key
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-border bg-surface-elevated px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="col-span-4">Tournament Name</span>
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-heading text-xl text-muted-foreground">
                {filter === 'ALL' ? 'NO TOURNAMENTS YET' : `NO ${filter} TOURNAMENTS`}
              </p>
              {filter === 'ALL' && (
                <>
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
          ) : (
            <ul>
              {filtered.map((t, i) => {
                const s = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.PRIVATE;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/tournaments/${t.id}`}
                      className={`flex items-center gap-3 px-4 py-4 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6 hover:bg-surface-elevated transition-colors group ${
                        i < filtered.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
                          <Trophy className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {t.name}
                        </p>
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center">
                        <span className={s.cls}>{s.label}</span>
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center text-sm text-muted-foreground gap-1.5">
                        <Users className="h-3.5 w-3.5" /> {t._count?.registrations ?? 0}
                      </div>
                      <div className="col-span-3 hidden sm:flex items-center text-sm text-muted-foreground gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{fmt(t.startDate)}</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
