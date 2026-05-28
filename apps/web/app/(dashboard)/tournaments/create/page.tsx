'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Check, Trophy, Settings, Eye, Tag } from 'lucide-react';
import { tournamentsApi, WeightCategory, Grade, CreateTournamentDto } from '@/lib/api/tournaments';

// ── Category selector helpers ─────────────────────────────────────────────────

function groupByGradeGender(cats: WeightCategory[]) {
  const map = new Map<string, { grade: Grade; genderCode: string; genderId: string; cats: WeightCategory[] }>();
  for (const c of cats) {
    const key = `${c.gradeId}-${c.genderId}`;
    if (!map.has(key)) {
      map.set(key, { grade: c.grade, genderCode: c.gender.code, genderId: c.genderId, cats: [] });
    }
    map.get(key)!.cats.push(c);
  }
  return Array.from(map.values()).sort((a, b) => a.grade.displayOrder - b.grade.displayOrder);
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CreateTournamentPage() {
  const router = useRouter();
  const t = useTranslations('createTournament');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [weightCategories, setWeightCategories] = useState<WeightCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());

  const schema = z.object({
    name: z.string().min(3, t('errors.nameTooShort')),
    description: z.string().optional(),
    startDate: z.string().min(1, t('errors.startDateRequired')),
    endDate: z.string().optional(),
    registrationDeadline: z.string().min(1, t('errors.deadlineRequired')),
    startTime: z.string().min(1, t('errors.startTimeRequired')),
    numAreas: z.coerce.number().int().min(1).max(20),
    drawType: z.enum(['random', 'ranking']),
    numRounds: z.coerce.number().int().min(1).max(10),
    hasVestLimitation: z.boolean(),
    vestQty1: z.coerce.number().int().min(0).max(99).optional(),
    vestQty2: z.coerce.number().int().min(0).max(99).optional(),
    vestQty3: z.coerce.number().int().min(0).max(99).optional(),
    vestQty4: z.coerce.number().int().min(0).max(99).optional(),
    categoryIds: z.array(z.string()).optional(),
    athletesVisible: z.boolean(),
    drawVisible: z.boolean(),
    areasVisible: z.boolean(),
  });

  type FormValues = z.infer<typeof schema>;

  const STEPS = [
    { id: 1, label: t('stepGeneral'), icon: Trophy },
    { id: 2, label: t('stepOrganisation'), icon: Settings },
    { id: 3, label: t('stepVisibility'), icon: Eye },
    { id: 4, label: t('stepBranding'), icon: Tag },
  ];

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      numAreas: 2,
      drawType: 'random',
      numRounds: 3,
      hasVestLimitation: false,
      vestQty1: 4,
      vestQty2: 4,
      vestQty3: 4,
      vestQty4: 4,
      athletesVisible: true,
      drawVisible: false,
      areasVisible: false,
    },
  });

  const hasVestLimitation = watch('hasVestLimitation');

  useEffect(() => {
    tournamentsApi.getStandardCategories().then(setWeightCategories).catch(() => {});
  }, []);

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ['name', 'startDate', 'registrationDeadline', 'startTime'],
    2: ['numAreas', 'drawType', 'numRounds'],
    3: [],
    4: [],
  };

  async function goNext() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  }

  function goPrev() {
    setStep((s) => s - 1);
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleGroup(cats: WeightCategory[]) {
    const ids = cats.map((c) => c.id);
    const allSelected = ids.every((id) => selectedCategoryIds.has(id));
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError('');
    try {
      const dto: CreateTournamentDto = {
        name: values.name,
        description: values.description,
        startDate: values.startDate,
        startTime: values.startTime,
        endDate: values.endDate || undefined,
        registrationDeadline: values.registrationDeadline,
        numAreas: values.numAreas,
        drawType: values.drawType.toUpperCase() as 'RANDOM' | 'RANKING',
        numRounds: values.numRounds,
        hasVestLimitation: values.hasVestLimitation,
        vestQtyType1: values.vestQty1,
        vestQtyType2: values.vestQty2,
        vestQtyType3: values.vestQty3,
        vestQtyType4: values.vestQty4,
        athletesVisible: values.athletesVisible ? 'ALL' : 'NONE',
        drawVisible: values.drawVisible,
        areasVisible: values.areasVisible,
        categoryIds: Array.from(selectedCategoryIds),
      };
      const tournament = await tournamentsApi.create(dto);
      router.push(`/tournaments/${tournament.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' — ') : (msg ?? t('errors.generic')));
      setSubmitting(false);
    }
  }

  const grouped = groupByGradeGender(weightCategories);

  const visibilityOptions = [
    { name: 'athletesVisible' as const, label: t('athletesListLabel'), desc: t('athletesListDesc') },
    { name: 'drawVisible' as const, label: t('drawBracketsLabel'), desc: t('drawBracketsDesc') },
    { name: 'areasVisible' as const, label: t('areaAssignmentsLabel'), desc: t('areaAssignmentsDesc') },
  ];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('subtitle')}</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'border-primary bg-primary text-white'
                      : isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`hidden text-xs uppercase tracking-wider sm:block ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${step > s.id ? 'bg-primary' : 'bg-border'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">

          {/* ── Step 1: General ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading text-2xl text-foreground">{t('generalTitle')}</h2>

              <Field label={t('tournamentName')} error={errors.name?.message} required>
                <input {...register('name')} placeholder="e.g. Spring Open 2025" className={inputCls(!!errors.name)} />
              </Field>

              <Field label={t('description')} error={errors.description?.message}>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder={t('descriptionPlaceholder')}
                  className={inputCls(false) + ' resize-none'}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('startDate')} error={errors.startDate?.message} required>
                  <input type="date" {...register('startDate')} className={inputCls(!!errors.startDate)} />
                </Field>
                <Field label={t('endDate')} error={errors.endDate?.message}>
                  <input type="date" {...register('endDate')} className={inputCls(!!errors.endDate)} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('registrationDeadline')} error={errors.registrationDeadline?.message} required>
                  <input type="date" {...register('registrationDeadline')} className={inputCls(!!errors.registrationDeadline)} />
                </Field>
                <Field label={t('startTime')} error={errors.startTime?.message} required>
                  <input type="time" {...register('startTime')} className={inputCls(!!errors.startTime)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 2: Organisation ── */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl text-foreground">{t('organisationTitle')}</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('competitionAreas')} error={errors.numAreas?.message} required>
                  <input type="number" min={1} max={20} {...register('numAreas')} className={inputCls(!!errors.numAreas)} />
                </Field>
                <Field label={t('drawType')} error={errors.drawType?.message} required>
                  <select {...register('drawType')} className={inputCls(!!errors.drawType)}>
                    <option value="random">{t('drawRandom')}</option>
                    <option value="ranking">{t('drawByRanking')}</option>
                  </select>
                </Field>
                <Field label={t('rounds')} error={errors.numRounds?.message} required>
                  <input type="number" min={1} max={10} {...register('numRounds')} className={inputCls(!!errors.numRounds)} />
                </Field>
              </div>

              {/* Vest limitation */}
              <div className="space-y-3">
                <Controller
                  control={control}
                  name="hasVestLimitation"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => field.onChange(!field.value)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          field.value ? 'bg-primary' : 'bg-border'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            field.value ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                      <span className="text-sm text-foreground">{t('vestQtyLabel')}</span>
                    </label>
                  )}
                />

                {hasVestLimitation && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-border bg-surface-elevated p-4">
                    {[1, 2, 3, 4].map((v) => (
                      <Field key={v} label={t('vestQty', { num: v })}>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          {...register(`vestQty${v}` as any)}
                          className={inputCls(false)}
                        />
                      </Field>
                    ))}
                  </div>
                )}
              </div>

              {/* Category selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {t('weightCategories')}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t('selected', { count: selectedCategoryIds.size })})
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCategoryIds.size === weightCategories.length) {
                        setSelectedCategoryIds(new Set());
                      } else {
                        setSelectedCategoryIds(new Set(weightCategories.map((c) => c.id)));
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedCategoryIds.size === weightCategories.length ? t('deselectAll') : t('selectAll')}
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {grouped.map((group) => {
                    const groupIds = group.cats.map((c) => c.id);
                    const allSelected = groupIds.every((id) => selectedCategoryIds.has(id));
                    const someSelected = groupIds.some((id) => selectedCategoryIds.has(id));
                    return (
                      <div key={`${group.grade.id}-${group.genderId}`} className="p-3">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.cats)}
                          className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              allSelected
                                ? 'border-primary bg-primary'
                                : someSelected
                                ? 'border-primary bg-primary/30'
                                : 'border-border bg-transparent'
                            }`}
                          >
                            {(allSelected || someSelected) && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          {group.grade.nameEn ?? 'Grade'} — {group.genderCode === 'M' ? 'Male' : 'Female'}
                        </button>
                        <div className="flex flex-wrap gap-1.5 pl-6">
                          {group.cats.map((cat) => {
                            const selected = selectedCategoryIds.has(cat.id);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                                  selected
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-elevated text-muted-foreground hover:text-foreground border border-border'
                                }`}
                              >
                                {cat.displayNameEn ?? cat.strWeight}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Visibility ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl text-foreground">{t('visibilityTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('visibilityDesc')}</p>

              <div className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5">
                {visibilityOptions.map(({ name, label, desc }) => (
                  <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <div className="flex items-start gap-4">
                        <div
                          onClick={() => field.onChange(!field.value)}
                          className={`relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                            field.value ? 'bg-primary' : 'bg-border'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              field.value ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    )}
                  />
                ))}
              </div>

              <div className="rounded-lg border border-border bg-surface-elevated p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong>{' '}
                {t.rich('visibilityNote', {
                  draft: () => <span className="badge-draft">Draft</span>,
                  open: () => <span className="badge-public">Open</span>,
                })}
              </div>
            </div>
          )}

          {/* ── Step 4: Branding ── */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl text-foreground">{t('brandingTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('brandingDesc')}</p>

              <div className="rounded-lg border border-dashed border-border bg-surface-elevated p-8 text-center">
                <Trophy className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-foreground">{t('tournamentFlyer')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('flyerFormats')}</p>
                <button
                  type="button"
                  className="mt-4 rounded border border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {t('chooseFile')}
                </button>
                <p className="mt-2 text-xs text-muted-foreground">{t('fileUploadLater')}</p>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? () => router.back() : goPrev}
            className="flex items-center gap-2 rounded border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? t('cancel') : t('back')}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              {t('next')}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('creating')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t('createTournament')}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
    hasError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary/50'
  }`;
}
