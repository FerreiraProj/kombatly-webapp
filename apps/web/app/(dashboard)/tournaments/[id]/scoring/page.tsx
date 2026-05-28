'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Play, Square, RotateCcw, Loader2, Swords } from 'lucide-react';
import { bracketsApi, Combat as BracketCombat } from '@/lib/api/brackets';
import { combatsApi, Combat, PointType, POINT_LABELS, POINT_VALUES } from '@/lib/api/combats';
import { joinTournamentRoom, onCombatUpdated } from '@/lib/hooks/useSocket';

export default function ScoringPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const t = useTranslations('scoring');
  const [allCombats, setAllCombats] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [combat, setCombat] = useState<Combat | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    bracketsApi.getAll(tournamentId).then(setAllCombats);
    joinTournamentRoom(tournamentId);
    return onCombatUpdated((c) => {
      if (c.id === selectedId) setCombat(c);
      setAllCombats(prev => prev.map(x => x.id === c.id ? c : x));
    });
  }, [tournamentId, selectedId]);

  async function selectCombat(id: string) {
    setSelectedId(id);
    setLoading(true);
    try { setCombat(await combatsApi.get(id)); } finally { setLoading(false); }
  }

  async function act(fn: () => Promise<Combat>) {
    setActing(true);
    try { setCombat(await fn()); } finally { setActing(false); }
  }

  const activeCombats = allCombats.filter(c => c.status === 'IN_PROGRESS');
  const pendingCombats = allCombats.filter(c => c.status === 'SCHEDULED');

  const athleteName = (a: Combat['redAthlete']) =>
    a ? `${a.athlete.firstName} ${a.athlete.lastName}` : 'TBD';

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider">
        <ChevronLeft className="h-3.5 w-3.5" /> {t('backToTournament')}
      </Link>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('subtitle')}</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Combat list */}
        <div className="space-y-2">
          {activeCombats.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t('activeCombats')}</p>
              {activeCombats.map(c => <CombatListItem key={c.id} t={t} combat={c} selected={selectedId === c.id} onClick={() => selectCombat(c.id)} />)}
            </>
          )}
          {pendingCombats.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('pendingCombats')}</p>
              {pendingCombats.slice(0, 20).map(c => <CombatListItem key={c.id} t={t} combat={c} selected={selectedId === c.id} onClick={() => selectCombat(c.id)} />)}
            </>
          )}
          {allCombats.length === 0 && <p className="text-sm text-muted-foreground">{t('noCombatsMsg')}</p>}
        </div>

        {/* Scoring panel */}
        <div className="lg:col-span-2">
          {loading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

          {!loading && !combat && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Swords className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">{t('selectCombat')}</p>
            </div>
          )}

          {!loading && combat && (
            <div className="space-y-4">
              {/* Combat header */}
              <div className="flex items-center justify-between rounded border border-border bg-surface px-4 py-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  #{combat.combatNumber} · {combat.area?.name ?? t('noArea')} · {combat.roundType.replace('_', ' ')}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                  combat.status === 'IN_PROGRESS' ? 'bg-primary/20 text-primary' :
                  combat.status === 'FINISHED' ? 'bg-green-500/20 text-green-400' :
                  'bg-muted/20 text-muted-foreground'
                }`}>{t(`status.${combat.status}` as any)}</span>
              </div>

              {/* Scoreboard */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border border-red-500/30 bg-red-500/5 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-red-400 mb-1">{t('red')}</p>
                  <p className="font-heading text-2xl text-foreground truncate">{athleteName(combat.redAthlete)}</p>
                  <p className="font-heading text-6xl text-red-400 mt-2">{combat.redScore}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="font-heading text-3xl text-muted-foreground">{t('vs')}</span>
                </div>
                <div className="rounded border border-blue-500/30 bg-blue-500/5 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-blue-400 mb-1">{t('blue')}</p>
                  <p className="font-heading text-2xl text-foreground truncate">{athleteName(combat.blueAthlete)}</p>
                  <p className="font-heading text-6xl text-blue-400 mt-2">{combat.blueScore}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {combat.status === 'SCHEDULED' && (
                  <button
                    onClick={() => act(() => combatsApi.updateStatus(combat.id, 'IN_PROGRESS'))}
                    disabled={acting}
                    className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {t('startCombat')}
                  </button>
                )}
                {combat.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => act(() => combatsApi.updateStatus(combat.id, 'FINISHED'))}
                    disabled={acting}
                    className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                    {t('finishCombat')}
                  </button>
                )}
              </div>

              {/* Point buttons — only when in progress */}
              {combat.status === 'IN_PROGRESS' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(['PUNCH_BODY', 'KICK_BODY', 'KICK_HEAD', 'SPIN_KICK_BODY', 'SPIN_KICK_HEAD', 'PENALTY'] as PointType[]).map(pt => (
                    <div key={pt} className="grid grid-cols-2 gap-2">
                      {combat.redAthleteId && (
                        <button
                          onClick={() => act(() => combatsApi.addPoint(combat.id, { athleteId: combat.redAthleteId!, pointType: pt, roundNumber: 1 }))}
                          disabled={acting}
                          className="rounded border border-red-500/40 bg-red-500/10 px-2 py-2 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                          🔴 {POINT_LABELS[pt]}
                        </button>
                      )}
                      {combat.blueAthleteId && (
                        <button
                          onClick={() => act(() => combatsApi.addPoint(combat.id, { athleteId: combat.blueAthleteId!, pointType: pt, roundNumber: 1 }))}
                          disabled={acting}
                          className="rounded border border-blue-500/40 bg-blue-500/10 px-2 py-2 text-xs text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                        >
                          🔵 {POINT_LABELS[pt]}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Points history */}
              {combat.points.length > 0 && (
                <div className="rounded border border-border bg-surface p-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t('pointsHistory')}</p>
                  {[...combat.points].reverse().map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className={p.athleteId === combat.redAthleteId ? 'text-red-400' : 'text-blue-400'}>
                        {p.athleteId === combat.redAthleteId ? '🔴' : '🔵'} {POINT_LABELS[p.pointType]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>+{p.pointValue}</span>
                        {combat.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => act(() => combatsApi.removePoint(combat.id, p.id))}
                            className="text-muted-foreground/50 hover:text-red-400"
                            title={t('removePoint')}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TFunc = ReturnType<typeof useTranslations<'scoring'>>;

function CombatListItem({ t, combat, selected, onClick }: { t: TFunc; combat: any; selected: boolean; onClick: () => void }) {
  const red = combat.redAthlete ? `${combat.redAthlete.athlete.firstName} ${combat.redAthlete.athlete.lastName}` : 'TBD';
  const blue = combat.blueAthlete ? `${combat.blueAthlete.athlete.firstName} ${combat.blueAthlete.athlete.lastName}` : 'TBD';
  return (
    <button
      onClick={onClick}
      className={`w-full rounded border px-3 py-2 text-left text-xs transition-colors ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-foreground/30'
      }`}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-semibold text-foreground">#{combat.combatNumber}</span>
        <span className={`text-[10px] uppercase ${combat.status === 'IN_PROGRESS' ? 'text-primary' : 'text-muted-foreground'}`}>
          {combat.status === 'IN_PROGRESS' ? t('liveIndicator') : combat.area?.name ?? ''}
        </span>
      </div>
      <span className="text-red-400">{red}</span>
      <span className="mx-1 text-muted-foreground">{t('vs')}</span>
      <span className="text-blue-400">{blue}</span>
    </button>
  );
}
