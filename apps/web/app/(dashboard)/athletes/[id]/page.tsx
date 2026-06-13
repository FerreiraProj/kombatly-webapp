'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Trophy, Swords, Target, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function categoryLabel(cat: any): string {
  if (!cat) return '—';
  if (cat.isCustom) return cat.customName ?? '—';
  const parts = [
    cat.grade?.nameEn,
    cat.gender?.code,
    cat.weightCategory?.displayNameEn ?? cat.weightCategory?.strWeight,
  ].filter(Boolean);
  return parts.join(' · ');
}

export default function AthleteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/users/athletes/${id}`).then((r) => r.data),
      apiClient.get(`/users/athletes/${id}/stats`).then((r) => r.data),
    ])
      .then(([profile, s]) => { setData(profile); setStats(s); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { user, registrations } = data;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  const statCards = stats ? [
    { label: 'Torneios', value: stats.tournaments, icon: Trophy },
    { label: 'Combates', value: stats.combats, icon: Swords },
    { label: 'Vitórias', value: stats.wins, icon: Target },
    { label: 'Win Rate', value: `${stats.winRate}%`, icon: TrendingUp },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/athletes"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Atletas
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          {initials}
        </div>
        <div>
          <h1 className="font-heading text-3xl text-foreground sm:text-4xl">
            {user.firstName.toUpperCase()} {user.lastName.toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
              <p className="mt-2 font-heading text-3xl text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tournament history */}
      <div className="space-y-3">
        <h2 className="font-heading text-xl text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" /> Histórico de Torneios
        </h2>

        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Sem participações em torneios</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-border bg-surface-elevated px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="col-span-4">Torneio</span>
              <span className="col-span-3">Categoria</span>
              <span className="col-span-2">Data</span>
              <span className="col-span-2">Estado</span>
              <span className="col-span-1">V/D</span>
            </div>
            <ul className="divide-y divide-border">
              {registrations.map((reg: any) => {
                const finished = [...(reg.redCombats ?? []), ...(reg.blueCombats ?? [])].filter((c: any) => c.status === 'FINISHED');
                const wins = reg.wonCombats?.length ?? 0;
                const losses = finished.length - wins;

                const statusColor: Record<string, string> = {
                  PRIVATE: 'bg-muted/20 text-muted-foreground',
                  PUBLIC: 'bg-blue-500/10 text-blue-400',
                  ONGOING: 'bg-primary/10 text-primary',
                  FINISHED: 'bg-green-500/10 text-green-400',
                };
                const statusLabel: Record<string, string> = {
                  PRIVATE: 'Privado', PUBLIC: 'Aberto', ONGOING: 'Em curso', FINISHED: 'Terminado',
                };

                return (
                  <li key={reg.id} className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                    <div className="col-span-4">
                      <Link
                        href={`/tournaments/${reg.tournament.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {reg.tournament.name}
                      </Link>
                    </div>
                    <div className="col-span-3 text-muted-foreground text-xs">
                      {categoryLabel(reg.category)}
                    </div>
                    <div className="col-span-2 text-muted-foreground">{fmt(reg.tournament.startDate)}</div>
                    <div className="col-span-2">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${statusColor[reg.tournament.status] ?? 'bg-muted/20 text-muted-foreground'}`}>
                        {statusLabel[reg.tournament.status] ?? reg.tournament.status}
                      </span>
                    </div>
                    <div className="col-span-1 text-xs font-semibold">
                      {finished.length > 0 ? (
                        <span>
                          <span className="text-green-400">{wins}V</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-red-400">{losses}D</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
