'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Trophy, Download, Loader2, AlertCircle, Filter,
  ChevronRight, Swords,
} from 'lucide-react';
import {
  bracketsApi, Combat, groupByCategory, groupIntoRounds, roundLabel, categoryLabel,
} from '@/lib/api/brackets';
import { tournamentsApi } from '@/lib/api/tournaments';

// ── Status colours ────────────────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  SCHEDULED: 'text-muted-foreground',
  ONGOING:   'text-primary',
  FINISHED:  'text-success',
  CANCELLED: 'text-destructive line-through opacity-50',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BracketsPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const router = useRouter();

  const [combats, setCombats] = useState<Combat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [bracketsGenerated, setBracketsGenerated] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    tournamentsApi.getOne(tournamentId).then((t) => {
      setBracketsGenerated(!!(t as any).bracketsGenerated);
    });
    bracketsApi
      .getAll(tournamentId)
      .then((data) => {
        setCombats(data);
        setBracketsGenerated(data.length > 0);
      })
      .finally(() => setLoading(false));
  }, [tournamentId]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError('');
    try {
      await bracketsApi.generate(tournamentId, false);
      const data = await bracketsApi.getAll(tournamentId);
      setCombats(data);
      setBracketsGenerated(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setGenerateError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to generate brackets');
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    setDownloading(true);
    bracketsApi.openPrintView(tournamentId, selectedCategoryId || undefined);
    setTimeout(() => setDownloading(false), 1000);
  }

  const categories = useMemo(() => groupByCategory(combats), [combats]);

  const filtered = useMemo(
    () => (selectedCategoryId ? combats.filter((c) => c.categoryId === selectedCategoryId) : combats),
    [combats, selectedCategoryId],
  );

  const rounds = useMemo(() => groupIntoRounds(filtered), [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href={`/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Tournament
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Competition Draw</p>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">BRACKETS</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {bracketsGenerated && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 rounded border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export PDF
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Swords className="h-4 w-4" />
            )}
            {bracketsGenerated ? 'Regenerate' : 'Generate Brackets'}
          </button>
        </div>
      </div>

      {generateError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {generateError}
        </div>
      )}

      {!bracketsGenerated ? (
        <EmptyState onGenerate={handleGenerate} generating={generating} />
      ) : (
        <>
          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <button
                onClick={() => setSelectedCategoryId('')}
                className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  !selectedCategoryId
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Categories
              </button>
              {categories.map(({ categoryId, category }) => (
                <button
                  key={categoryId}
                  onClick={() => setSelectedCategoryId(categoryId)}
                  className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                    selectedCategoryId === categoryId
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {categoryLabel(category ?? undefined)}
                </button>
              ))}
            </div>
          )}

          {/* Bracket view */}
          {selectedCategoryId ? (
            <BracketTree rounds={rounds} />
          ) : (
            <CategoryList categories={categories} onSelect={setSelectedCategoryId} />
          )}
        </>
      )}
    </div>
  );
}

// ── Category summary list (all-categories view) ───────────────────────────────

function CategoryList({
  categories,
  onSelect,
}: {
  categories: ReturnType<typeof groupByCategory>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map(({ categoryId, category, combats }) => {
        const totalRounds = Math.max(...combats.map((c) => c.roundNumber));
        const finished = combats.filter((c) => c.status === 'FINISHED').length;
        const pct = combats.length > 0 ? Math.round((finished / combats.length) * 100) : 0;
        const finalCombat = combats.find((c) => c.roundType === 'FINAL');
        const winner = finalCombat?.winner;

        return (
          <button
            key={categoryId}
            onClick={() => onSelect(categoryId)}
            className="group rounded-lg border border-border bg-surface p-5 text-left hover:border-primary/40 transition-colors space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {categoryLabel(category ?? undefined)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {combats.length} combats · {totalRounds} round{totalRounds !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{finished}/{combats.length} done</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {winner && (
              <div className="flex items-center gap-2 text-xs text-gold">
                <Trophy className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {winner.athlete.firstName} {winner.athlete.lastName}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Bracket tree (single-elimination horizontal layout) ───────────────────────

function BracketTree({ rounds }: { rounds: ReturnType<typeof groupIntoRounds> }) {
  if (rounds.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">No combats in this category</p>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-0 min-w-max">
        {rounds.map((round, ri) => (
          <div key={round.roundNumber} className="flex flex-col">
            {/* Round header */}
            <div className="mb-3 px-4 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {roundLabel(round.roundType)}
              </p>
            </div>

            {/* Combat cards, vertically centred with connector lines */}
            <div
              className="flex flex-col justify-around gap-0"
              style={{ minHeight: `${Math.max(round.combats.length, 1) * 100}px` }}
            >
              {round.combats.map((combat, ci) => (
                <div key={combat.id} className="relative flex items-center">
                  {/* Connector line coming IN (from left) */}
                  {ri > 0 && (
                    <div className="absolute left-0 top-1/2 w-4 h-px bg-border -translate-x-4" />
                  )}

                  <CombatCard combat={combat} />

                  {/* Connector line going OUT (to right), except last round */}
                  {ri < rounds.length - 1 && (
                    <div className="absolute right-0 top-1/2 w-4 h-px bg-border translate-x-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Single combat card ────────────────────────────────────────────────────────

function CombatCard({ combat }: { combat: Combat }) {
  const red = combat.redAthlete;
  const blue = combat.blueAthlete;
  const isFinished = combat.status === 'FINISHED';
  const isOngoing = combat.status === 'ONGOING';

  return (
    <div
      className={`w-52 rounded-lg border bg-surface text-xs transition-colors ${
        isOngoing ? 'border-primary/50 shadow-sm shadow-primary/10' : 'border-border'
      }`}
    >
      {/* Combat number + area */}
      <div className="flex items-center justify-between border-b border-border px-2.5 py-1">
        <span className="text-muted-foreground">#{combat.combatNumber}</span>
        {combat.area && (
          <span className="text-muted-foreground">{combat.area.name}</span>
        )}
        {isOngoing && (
          <span className="flex items-center gap-1 text-primary font-medium">
            <span className="live-dot" />
            Live
          </span>
        )}
      </div>

      {/* Red athlete */}
      <AthleteRow
        name={red ? `${red.athlete.firstName} ${red.athlete.lastName}` : 'BYE'}
        club={red?.club?.name}
        score={combat.redScore}
        isWinner={isFinished && combat.winnerId === combat.redAthleteId}
        isBye={!red}
        color="red"
      />

      <div className="h-px bg-border" />

      {/* Blue athlete */}
      <AthleteRow
        name={blue ? `${blue.athlete.firstName} ${blue.athlete.lastName}` : 'TBD'}
        club={blue?.club?.name}
        score={combat.blueScore}
        isWinner={isFinished && combat.winnerId === combat.blueAthleteId}
        isBye={!blue}
        color="blue"
      />
    </div>
  );
}

function AthleteRow({
  name,
  club,
  score,
  isWinner,
  isBye,
  color,
}: {
  name: string;
  club?: string;
  score: number;
  isWinner: boolean;
  isBye: boolean;
  color: 'red' | 'blue';
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 transition-colors ${
        isWinner ? 'bg-success/5' : isBye ? 'opacity-40' : ''
      }`}
    >
      <div
        className={`h-2 w-2 shrink-0 rounded-full ${
          color === 'red' ? 'bg-red-500' : 'bg-blue-500'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-medium ${
            isWinner ? 'text-success' : isBye ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {name}
        </p>
        {club && <p className="truncate text-muted-foreground" style={{ fontSize: '10px' }}>{club}</p>}
      </div>
      {isWinner && (
        <Trophy className="h-3 w-3 shrink-0 text-success" />
      )}
      {score > 0 && (
        <span className={`shrink-0 font-bold ${isWinner ? 'text-success' : 'text-muted-foreground'}`}>
          {score}
        </span>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed border-border">
      <Swords className="h-14 w-14 text-muted-foreground/20 mb-5" />
      <h2 className="font-heading text-2xl text-muted-foreground">NO BRACKETS YET</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Make sure athletes are checked in and registered, then generate the draw.
      </p>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="mt-6 flex items-center gap-2 rounded bg-primary px-7 py-3 font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Swords className="h-4 w-4" />
        )}
        Generate Brackets
      </button>
    </div>
  );
}
