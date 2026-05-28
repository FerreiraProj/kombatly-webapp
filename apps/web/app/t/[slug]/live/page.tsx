'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { joinTournamentRoom, onCombatUpdated, onScheduleUpdated } from '@/lib/hooks/useSocket';
import { Combat } from '@/lib/api/combats';

export default function LivePage() {
  const t = useTranslations('live');
  const { slug } = useParams<{ slug: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [combats, setCombats] = useState<Combat[]>([]);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    apiClient.get(`/tournaments/slug/${slug}`).then(async r => {
      const tournament = r.data;
      setTournament(tournament);
      const { data: allCombats } = await apiClient.get(`/tournaments/${tournament.id}/brackets`);
      setCombats(allCombats.filter((c: Combat) => c.status === 'IN_PROGRESS' || c.status === 'SCHEDULED'));
      setLoading(false);
      joinTournamentRoom(tournament.id);
      const c1 = onCombatUpdated((c: Combat) => {
        setCombats(prev => {
          const exists = prev.some(x => x.id === c.id);
          const next = exists ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
          return next.filter(x => x.status === 'IN_PROGRESS' || x.status === 'SCHEDULED');
        });
      });
      const c2 = onScheduleUpdated((updates) => {
        setCombats(prev => prev.map(x => {
          const u = updates.find(u => u.id === x.id);
          return u ? { ...x, scheduledTime: u.scheduledTime } : x;
        }));
      });
      cleanupRef.current = () => { c1(); c2(); };
    }).catch(() => setLoading(false));

    return () => { cleanupRef.current?.(); };
  }, [slug]);

  const inProgress = combats.filter(c => c.status === 'IN_PROGRESS');
  const upcoming = combats.filter(c => c.status === 'SCHEDULED').slice(0, 10);

  const name = (a: Combat['redAthlete']) =>
    a ? `${a.athlete.firstName} ${a.athlete.lastName}` : 'TBD';

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="border-b border-border pb-4">
          <Link href={`/t/${slug}`} className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider">
            ← {tournament?.name ?? 'Torneio'}
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
              {t('liveNow')}
            </span>
            <h1 className="font-heading text-3xl text-foreground">{tournament?.name}</h1>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        )}

        {!loading && inProgress.length === 0 && (
          <p className="text-center text-muted-foreground py-12">{t('noCombats')}</p>
        )}

        {inProgress.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">{t('inProgress')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {inProgress.map(c => (
                <LiveCombatCard key={c.id} combat={c} t={t} />
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('nextCombats')}</h2>
            <div className="rounded border border-border divide-y divide-border/50">
              {upcoming.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground text-xs">#{c.combatNumber} {c.area?.name ?? ''}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">{name(c.redAthlete)}</span>
                    <span className="text-muted-foreground text-xs">{t('vs')}</span>
                    <span className="text-blue-400">{name(c.blueAthlete)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveCombatCard({ combat, t }: { combat: Combat; t: any }) {
  const name = (a: Combat['redAthlete']) =>
    a ? `${a.athlete.firstName} ${a.athlete.lastName}` : 'TBD';

  return (
    <div className="rounded border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>#{combat.combatNumber} · {combat.roundType.replace(/_/g, ' ')}</span>
        {combat.area && <span className="rounded bg-surface px-2 py-0.5">{combat.area.name}</span>}
      </div>

      <div className="grid grid-cols-3 items-center gap-2 text-center">
        <div>
          <p className="text-xs text-red-400 uppercase mb-1">{t('red')}</p>
          <p className="text-sm font-semibold text-foreground truncate">{name(combat.redAthlete)}</p>
          <p className="font-heading text-5xl text-red-400 mt-1">{combat.redScore}</p>
        </div>
        <div className="text-xl font-heading text-muted-foreground">{t('vs')}</div>
        <div>
          <p className="text-xs text-blue-400 uppercase mb-1">{t('blue')}</p>
          <p className="text-sm font-semibold text-foreground truncate">{name(combat.blueAthlete)}</p>
          <p className="font-heading text-5xl text-blue-400 mt-1">{combat.blueScore}</p>
        </div>
      </div>
    </div>
  );
}
