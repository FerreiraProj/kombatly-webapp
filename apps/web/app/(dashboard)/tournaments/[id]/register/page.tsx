'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, UserPlus, Search, Check, X, Loader2, AlertCircle, Sparkles,
} from 'lucide-react';
import { tournamentsApi, Tournament, TournamentCategory } from '@/lib/api/tournaments';
import { clubsApi, Athlete } from '@/lib/api/clubs';
import { registrationsApi, CreateRegistrationDto } from '@/lib/api/registrations';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface RegistrationRow {
  athlete: Athlete;
  weight: string;
  categoryId: string;
  suggestingCategory: boolean;
  suggestedCategoryId: string | null;
  error: string | null;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function categoryLabel(cat: TournamentCategory): string {
  if (cat.isCustom) return cat.customName ?? 'Custom';
  const grade = cat.grade?.nameEn ?? '';
  const gender = cat.gender?.code === 'M' ? 'Male' : cat.gender?.code === 'F' ? 'Female' : '';
  const weight = cat.weightCategory?.displayNameEn ?? cat.weightCategory?.strWeight ?? '';
  return [grade, gender, weight].filter(Boolean).join(' Â· ');
}

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function RegisterAthletesPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  useEffect(() => {
    Promise.all([
      tournamentsApi.getOne(tournamentId),
      clubsApi.getMyAthletes().catch(() => [] as Athlete[]),
    ])
      .then(([t, a]) => {
        setTournament(t);
        setAthletes(a);
      })
      .catch(() => router.push(`/tournaments/${tournamentId}`))
      .finally(() => setLoadingInit(false));
  }, [tournamentId]);

  const filteredAthletes = athletes.filter((a) => {
    const full = `${a.firstName} ${a.lastName}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const selectedIds = new Set(rows.map((r) => r.athlete.id));

  function addAthlete(athlete: Athlete) {
    if (selectedIds.has(athlete.id)) return;
    setRows((prev) => [
      ...prev,
      {
        athlete,
        weight: '',
        categoryId: '',
        suggestingCategory: false,
        suggestedCategoryId: null,
        error: null,
      },
    ]);
  }

  function removeRow(athleteId: string) {
    setRows((prev) => prev.filter((r) => r.athlete.id !== athleteId));
  }

  function updateRow(athleteId: string, patch: Partial<RegistrationRow>) {
    setRows((prev) =>
      prev.map((r) => (r.athlete.id === athleteId ? { ...r, ...patch } : r)),
    );
  }

  async function suggestCategory(row: RegistrationRow) {
    const weight = parseFloat(row.weight);
    if (!weight || !row.athlete.gradeId || !row.athlete.genderId) return;

    updateRow(row.athlete.id, { suggestingCategory: true, error: null });
    try {
      const suggested = await registrationsApi.suggestCategory(
        tournamentId,
        weight,
        row.athlete.gradeId,
        row.athlete.genderId,
      );
      if (suggested?.id) {
        updateRow(row.athlete.id, {
          categoryId: suggested.id,
          suggestedCategoryId: suggested.id,
          suggestingCategory: false,
        });
      } else {
        updateRow(row.athlete.id, {
          suggestingCategory: false,
          error: 'No matching category found for this weight',
        });
      }
    } catch {
      updateRow(row.athlete.id, {
        suggestingCategory: false,
        error: 'Could not suggest a category',
      });
    }
  }

  async function handleSubmit() {
    // Validate rows
    let hasError = false;
    const validated = rows.map((r) => {
      if (!r.categoryId) {
        updateRow(r.athlete.id, { error: 'Please select a category' });
        hasError = true;
      }
      return r;
    });
    if (hasError) return;

    setSubmitting(true);
    setSubmitError('');

    const payload: CreateRegistrationDto[] = rows.map((r) => ({
      athleteId: r.athlete.id,
      categoryId: r.categoryId,
      weight: r.weight ? parseFloat(r.weight) : undefined,
    }));

    try {
      await registrationsApi.bulkRegister(tournamentId, payload);
      setSuccessCount(payload.length);
      setTimeout(() => router.push(`/tournaments/${tournamentId}`), 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Registration failed');
      setSubmitting(false);
    }
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (successCount !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="font-heading text-3xl text-foreground">REGISTERED!</h2>
        <p className="mt-2 text-muted-foreground">
          {successCount} athlete{successCount !== 1 ? 's' : ''} successfully registered
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Redirecting to tournament...</p>
      </div>
    );
  }

  const categories = tournament?.categories ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href={`/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {tournament?.name ?? 'Tournament'}
      </Link>

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Athlete Registration</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">REGISTER ATHLETES</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Athlete picker */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Your Club's Athletes
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes..."
              className="w-full rounded border border-border bg-surface pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {athletes.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted-foreground">No athletes in your club yet.</p>
              <Link
                href="/athletes"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Add athletes â†’
              </Link>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {filteredAthletes.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No athletes match your search</p>
              ) : (
                filteredAthletes.map((athlete) => {
                  const isSelected = selectedIds.has(athlete.id);
                  return (
                    <button
                      key={athlete.id}
                      type="button"
                      onClick={() => addAthlete(athlete)}
                      disabled={isSelected}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-primary/5 cursor-default'
                          : 'hover:bg-surface-elevated'
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected ? 'bg-primary text-white' : 'bg-surface-elevated text-muted-foreground'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          `${athlete.firstName[0]}${athlete.lastName[0]}`
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {athlete.firstName} {athlete.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {athlete.grade?.nameEn ?? 'â€”'} Â· {athlete.gender?.code === 'M' ? 'Male' : athlete.gender?.code === 'F' ? 'Female' : 'â€”'}
                        </p>
                      </div>
                      {!isSelected && (
                        <UserPlus className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right: Registration rows */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Selected ({rows.length})
            </h2>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() => setRows([])}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-12 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select athletes from the list</p>
              <p className="mt-1 text-xs text-muted-foreground">They'll appear here to configure</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <RegistrationCard
                  key={row.athlete.id}
                  row={row}
                  categories={categories}
                  onRemove={() => removeRow(row.athlete.id)}
                  onWeightChange={(w) => updateRow(row.athlete.id, { weight: w, error: null })}
                  onCategoryChange={(c) => updateRow(row.athlete.id, { categoryId: c, error: null })}
                  onSuggest={() => suggestCategory(row)}
                />
              ))}

              {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || rows.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Register {rows.length} Athlete{rows.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Registration card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RegistrationCard({
  row,
  categories,
  onRemove,
  onWeightChange,
  onCategoryChange,
  onSuggest,
}: {
  row: RegistrationRow;
  categories: TournamentCategory[];
  onRemove: () => void;
  onWeightChange: (w: string) => void;
  onCategoryChange: (c: string) => void;
  onSuggest: () => void;
}) {
  const canSuggest =
    !!row.weight &&
    !isNaN(parseFloat(row.weight)) &&
    !!row.athlete.gradeId &&
    !!row.athlete.genderId;

  // Filter categories by athlete's grade/gender if available
  const relevantCats = categories.filter((c) => {
    if (c.isCustom) return true;
    const gradeMatch = !row.athlete.gradeId || c.gradeId === row.athlete.gradeId;
    const genderMatch = !row.athlete.genderId || c.genderId === row.athlete.genderId;
    return gradeMatch && genderMatch;
  });

  return (
    <div
      className={`rounded-lg border bg-surface p-4 space-y-3 transition-colors ${
        row.error ? 'border-destructive/50' : 'border-border'
      }`}
    >
      {/* Athlete header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {row.athlete.firstName[0]}{row.athlete.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {row.athlete.firstName} {row.athlete.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.athlete.grade?.nameEn ?? 'â€”'} Â· {row.athlete.gender?.code === 'M' ? 'Male' : row.athlete.gender?.code === 'F' ? 'Female' : 'â€”'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Weight + category row */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {/* Weight input */}
        <div className="sm:col-span-2 space-y-1">
          <label className="block text-xs text-muted-foreground uppercase tracking-wider">
            Weight (kg)
          </label>
          <div className="flex gap-1.5">
            <input
              type="number"
              step="0.1"
              min="1"
              max="200"
              value={row.weight}
              onChange={(e) => onWeightChange(e.target.value)}
              placeholder="e.g. 67.5"
              className="flex-1 min-w-0 rounded border border-border bg-surface-elevated px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <button
              type="button"
              onClick={onSuggest}
              disabled={!canSuggest || row.suggestingCategory}
              title="Auto-suggest category by weight"
              className="shrink-0 flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {row.suggestingCategory ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Suggest</span>
            </button>
          </div>
        </div>

        {/* Category select */}
        <div className="sm:col-span-3 space-y-1">
          <label className="block text-xs text-muted-foreground uppercase tracking-wider">
            Category
          </label>
          <select
            value={row.categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full rounded border bg-surface-elevated px-3 py-1.5 text-sm text-foreground focus:outline-none transition-colors ${
              row.categoryId === row.suggestedCategoryId && row.categoryId
                ? 'border-primary/50 text-primary'
                : 'border-border focus:border-primary/50'
            }`}
          >
            <option value="">Select category...</option>
            {relevantCats.length === 0 && (
              <option value="" disabled>No matching categories</option>
            )}
            {relevantCats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {categoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline error */}
      {row.error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {row.error}
        </div>
      )}

      {/* Suggested indicator */}
      {row.suggestedCategoryId && row.categoryId === row.suggestedCategoryId && !row.error && (
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <Sparkles className="h-3 w-3" />
          Category auto-suggested by weight
        </div>
      )}
    </div>
  );
}
