import { apiClient } from './client';

export type CombatStatus = 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';

export interface CombatAthlete {
  id: string;
  athlete: { firstName: string; lastName: string };
  club?: { name: string };
}

export interface Combat {
  id: string;
  tournamentId: string;
  categoryId: string;
  combatNumber: number;
  roundNumber: number;
  roundType: string;
  bracketPosition: number;
  status: CombatStatus;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  winnerId: string | null;
  nextCombatId: string | null;
  scheduledTime: string | null;
  redScore: number;
  blueScore: number;
  area?: { id: string; name: string };
  redAthlete?: CombatAthlete | null;
  blueAthlete?: CombatAthlete | null;
  winner?: CombatAthlete | null;
  category?: {
    id: string;
    isCustom: boolean;
    customName?: string;
    grade?: { names: Record<string, string>; displayOrder: number };
    gender?: { code: string };
    weightCategory?: { strWeight: string; displayNames: Record<string, string> };
  };
}

export interface BracketRound {
  roundNumber: number;
  roundType: string;
  combats: Combat[];
}

export const bracketsApi = {
  generate: (tournamentId: string, includeUnpaid = false) =>
    apiClient
      .post<{ success: boolean; message: string }>(
        `/tournaments/${tournamentId}/brackets/generate`,
        { includeUnpaid },
      )
      .then((r) => r.data),

  getAll: (tournamentId: string, categoryId?: string) =>
    apiClient
      .get<Combat[]>(`/tournaments/${tournamentId}/brackets`, {
        params: categoryId ? { categoryId } : undefined,
      })
      .then((r) => r.data),

  openPrintView: (tournamentId: string, categoryId?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    const url = `/tournaments/${tournamentId}/brackets/print${params.toString() ? '?' + params.toString() : ''}`;
    window.open(url, '_blank');
  },
};

// ── Group combats into rounds ─────────────────────────────────────────────────

export function groupIntoRounds(combats: Combat[]): BracketRound[] {
  const map = new Map<number, Combat[]>();
  for (const c of combats) {
    if (!map.has(c.roundNumber)) map.set(c.roundNumber, []);
    map.get(c.roundNumber)!.push(c);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([roundNumber, cs]) => ({
      roundNumber,
      roundType: cs[0]?.roundType ?? '',
      combats: cs.sort((a, b) => a.bracketPosition - b.bracketPosition),
    }));
}

export function roundLabel(roundType: string): string {
  const labels: Record<string, string> = {
    ROUND_OF_64:  'Round of 64',
    ROUND_OF_32:  'Round of 32',
    ROUND_OF_16:  'Round of 16',
    QUARTER_FINAL: 'Quarter-Finals',
    SEMI_FINAL:   'Semi-Finals',
    FINAL:        'Final',
  };
  return labels[roundType] ?? `Round ${roundType}`;
}

// ── Group combats by category ─────────────────────────────────────────────────

export function groupByCategory(combats: Combat[]) {
  const map = new Map<string, Combat[]>();
  for (const c of combats) {
    if (!map.has(c.categoryId)) map.set(c.categoryId, []);
    map.get(c.categoryId)!.push(c);
  }
  return Array.from(map.entries()).map(([categoryId, cs]) => ({
    categoryId,
    category: cs[0]?.category ?? null,
    combats: cs,
  }));
}

export function categoryLabel(cat: Combat['category']): string {
  if (!cat) return '—';
  if (cat.isCustom) return cat.customName ?? 'Custom';
  const grade = cat.grade?.names?.en ?? '';
  const gender = cat.gender?.code === 'M' ? 'Male' : cat.gender?.code === 'F' ? 'Female' : '';
  const weight = cat.weightCategory?.displayNames?.en ?? cat.weightCategory?.strWeight ?? '';
  return [grade, gender, weight].filter(Boolean).join(' · ');
}
