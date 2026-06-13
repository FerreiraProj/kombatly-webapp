import Link from 'next/link';
import { Trophy, Medal, TrendingUp, Swords } from 'lucide-react';

interface RankingEntry {
  rank: number;
  athleteId: string;
  firstName: string;
  lastName: string;
  club?: { name: string; sigla?: string };
  tournaments: number;
  combats: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPoints: number;
}

async function getRankings(params?: { gradeId?: string; genderId?: string }): Promise<RankingEntry[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const qs = new URLSearchParams({ limit: '100', ...(params ?? {}) }).toString();
    const res = await fetch(`${base}/users/rankings?${qs}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function medalColor(rank: number) {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-slate-300';
  if (rank === 3) return 'text-orange-400';
  return 'text-muted-foreground';
}

export default async function RankingsPage() {
  const rankings = await getRankings();

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-heading text-lg tracking-widest">
            <span className="text-primary">KOMBATLY</span><span className="text-foreground">PRO</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/events" className="hover:text-foreground transition-colors">Eventos</Link>
            <Link href="/rankings" className="text-primary font-semibold">Rankings</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Classificação Global</p>
          <h1 className="font-heading text-5xl sm:text-6xl text-foreground mt-1">RANKINGS</h1>
        </div>

        {rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <p className="font-heading text-xl text-muted-foreground">Sem dados de ranking ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Os rankings são gerados automaticamente a partir dos resultados de torneios.</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {top3.map((entry) => (
                  <div
                    key={entry.athleteId}
                    className={`relative rounded-lg border p-5 space-y-2 ${
                      entry.rank === 1 ? 'border-yellow-500/40 bg-yellow-500/5' :
                      entry.rank === 2 ? 'border-slate-400/30 bg-slate-400/5' :
                      'border-orange-500/30 bg-orange-500/5'
                    }`}
                  >
                    <div className={`font-heading text-4xl ${medalColor(entry.rank)}`}>
                      #{entry.rank}
                    </div>
                    <div>
                      <p className="font-heading text-lg text-foreground">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.club?.sigla ?? entry.club?.name ?? '—'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                      <div className="text-center">
                        <p className={`font-heading text-2xl ${medalColor(entry.rank)}`}>{entry.winRate}%</p>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="font-heading text-2xl text-foreground">{entry.wins}</p>
                        <p className="text-xs text-muted-foreground">Vitórias</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full table */}
            {rest.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-border bg-surface-elevated px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="col-span-1">#</span>
                  <span className="col-span-3">Atleta</span>
                  <span className="col-span-2">Clube</span>
                  <span className="col-span-1">Torneios</span>
                  <span className="col-span-1">Combates</span>
                  <span className="col-span-1">V</span>
                  <span className="col-span-1">D</span>
                  <span className="col-span-1">Win %</span>
                  <span className="col-span-1">Pts</span>
                </div>
                <ul className="divide-y divide-border">
                  {rest.map((entry) => (
                    <li key={entry.athleteId} className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                      <span className={`col-span-1 font-heading text-base ${medalColor(entry.rank)}`}>{entry.rank}</span>
                      <div className="col-span-3 font-medium text-foreground">{entry.firstName} {entry.lastName}</div>
                      <div className="col-span-2 text-muted-foreground text-xs">{entry.club?.sigla ?? entry.club?.name ?? '—'}</div>
                      <div className="col-span-1 text-muted-foreground">{entry.tournaments}</div>
                      <div className="col-span-1 text-muted-foreground">{entry.combats}</div>
                      <div className="col-span-1 text-green-400 font-semibold">{entry.wins}</div>
                      <div className="col-span-1 text-red-400">{entry.losses}</div>
                      <div className="col-span-1 text-foreground font-semibold">{entry.winRate}%</div>
                      <div className="col-span-1 text-muted-foreground">{entry.totalPoints}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-16 border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        <p>Com tecnologia de <span className="text-primary font-medium">Taekwombats</span></p>
      </footer>
    </div>
  );
}
