'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft, UserPlus, Search, Check, X, Loader2, AlertCircle, Sparkles,
} from 'lucide-react';
import { tournamentsApi, Tournament, TournamentCategory } from '@/lib/api/tournaments';
import { clubsApi, Athlete } from '@/lib/api/clubs';
import { registrationsApi, CreateRegistrationDto } from '@/lib/api/registrations';

interface RegistrationRow {
  athlete: Athlete;
  weight: string;
  categoryId: string;
  suggestingCategory: boolean;
  suggestedCategoryId: string | null;
  error: string | null;
}

type TFunc = ReturnType<typeof useTranslations<'register'>>;

function categoryLabel(cat: TournamentCategory, t: TFunc): string {
  if (cat.isCustom) return cat.customName ?? 'Custom';
  const grade = cat.grade?.nameEn ?? '';
  const gender = cat.gender?.code === 'M' ? t('genderMale') : cat.gender?.code === 'F' ? t('genderFemale') : '';
  const weight = cat.weightCategory?.displayNameEn ?? cat.weightCategory?.strWeight ?? '';
  return [grade, gender, weight].filter(Boolean).join(' · ');
}

export default function RegisterAthletesPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('register');

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
          error: t('errorNoMatch'),
        });
      }
    } catch {
      updateRow(row.athlete.id, {
        suggestingCategory: false,
        error: t('errorSuggestFailed'),
      });
    }
  }

  async function handleSubmit() {
    let hasError = false;
    rows.forEach((r) => {
      if (!r.categoryId) {
        updateRow(r.athlete.id, { error: t('errorSelectCategory') });
        hasError = true;
      }
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
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg ?? t('errorRegFailed'));
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
        <h2 className="font-heading text-3xl text-foreground">{t('registered')}</h2>
        <p className="mt-2 text-muted-foreground">
          {t('registeredSuccess', { count: successCount })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t('redirecting')}</p>
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
        {tournament?.name ?? t('backToTournament')}
      </Link>

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('athleteRegistration')}</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('registerAthletes')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Athlete picker */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            {t('clubAthletes')}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded border border-border bg-surface pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {athletes.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted-foreground">{t('noClubAthletes')}</p>
              <Link
                href="/athletes"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                {t('addAthletesLink')}
              </Link>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {filteredAthletes.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">{t('noSearchMatch')}</p>
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
                          {athlete.grade?.nameEn ?? '—'} · {athlete.gender?.code === 'M' ? t('genderMale') : athlete.gender?.code === 'F' ? t('genderFemale') : '—'}
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
              {t('selectedCount', { count: rows.length })}
            </h2>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() => setRows([])}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                {t('clearAll')}
              </button>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-12 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{t('selectFromList')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('selectFromListDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <RegistrationCard
                  key={row.athlete.id}
                  t={t}
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
                    {t('registering')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t('registerBtn', { count: rows.length })}
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

function RegistrationCard({
  t,
  row,
  categories,
  onRemove,
  onWeightChange,
  onCategoryChange,
  onSuggest,
}: {
  t: TFunc;
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
              {row.athlete.grade?.nameEn ?? '—'} · {row.athlete.gender?.code === 'M' ? t('genderMale') : row.athlete.gender?.code === 'F' ? t('genderFemale') : '—'}
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
        <div className="sm:col-span-2 space-y-1">
          <label className="block text-xs text-muted-foreground uppercase tracking-wider">
            {t('weightKg')}
          </label>
          <div className="flex gap-1.5">
            <input
              type="number"
              step="0.1"
              min="1"
              max="200"
              value={row.weight}
              onChange={(e) => onWeightChange(e.target.value)}
              placeholder={t('weightPlaceholder')}
              className="flex-1 min-w-0 rounded border border-border bg-surface-elevated px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <button
              type="button"
              onClick={onSuggest}
              disabled={!canSuggest || row.suggestingCategory}
              title={t('autoSuggestTitle')}
              className="shrink-0 flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {row.suggestingCategory ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{t('suggest')}</span>
            </button>
          </div>
        </div>

        <div className="sm:col-span-3 space-y-1">
          <label className="block text-xs text-muted-foreground uppercase tracking-wider">
            {t('selectCategory')}
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
            <option value="">{t('selectCategoryPlaceholder')}</option>
            {relevantCats.length === 0 && (
              <option value="" disabled>{t('noMatchingCats')}</option>
            )}
            {relevantCats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {categoryLabel(cat, t)}
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
          {t('categoryAutoSuggested')}
        </div>
      )}
    </div>
  );
}
