'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, UserPlus, Search, X, Loader2, AlertCircle, Check, Shield } from 'lucide-react';
import Link from 'next/link';
import { clubsApi, Athlete, CreateAthleteDto } from '@/lib/api/clubs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

function inputCls(err: boolean) {
  return `w-full rounded border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
    err ? 'border-destructive' : 'border-border focus:border-primary/50'
  }`;
}

export default function AthletesPage() {
  const t = useTranslations('athletes');

  const schema = z.object({
    firstName: z.string().min(2, t('errors.firstNameRequired')),
    lastName:  z.string().min(2, t('errors.lastNameRequired')),
    email:     z.string().email(t('errors.emailRequired')),
    phone:     z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [noClub, setNoClub] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    clubsApi.getMyAthletes()
      .then(setAthletes)
      .catch((e) => { if (e?.response?.status === 404) setNoClub(true); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = athletes.filter((a) => {
    const full = `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  async function onSubmit(values: FormValues) {
    setSubmitError('');
    try {
      const created = await clubsApi.createAthlete(values as CreateAthleteDto);
      setAthletes((prev) => [...prev, created]);
      setSuccessMsg(t('addedSuccess', { name: `${created.firstName} ${created.lastName}` }));
      reset();
      setShowForm(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg ?? t('addFailed'));
    }
  }

  if (noClub) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('clubRoster')}</p>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        </div>
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="font-heading text-xl text-foreground mb-2">{t('noClubTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t('noClubDesc')}</p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            {t('noClubCta')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('clubRoster')}</p>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setSubmitError(''); }}
          className="flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shrink-0 mt-1"
        >
          {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          <span className="hidden sm:inline">{showForm ? t('cancel') : t('addAthlete')}</span>
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <Check className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Add athlete form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border border-primary/30 bg-surface p-5 space-y-4"
        >
          <h3 className="font-heading text-lg text-foreground">{t('newAthleteTitle')}</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('firstName')} <span className="text-primary">*</span>
              </label>
              <input {...register('firstName')} placeholder="João" className={inputCls(!!errors.firstName)} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('lastName')} <span className="text-primary">*</span>
              </label>
              <input {...register('lastName')} placeholder="Silva" className={inputCls(!!errors.lastName)} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('email')} <span className="text-primary">*</span>
              </label>
              <input type="email" {...register('email')} placeholder="athlete@example.com" className={inputCls(!!errors.email)} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('phoneOptional')}
              </label>
              <input {...register('phone')} placeholder="+351 912 345 678" className={inputCls(false)} />
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {submitError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {t('addAthleteBtn')}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded border border-border bg-surface pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 sm:max-w-sm"
        />
      </div>

      {/* Athlete list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h2 className="font-heading text-xl text-muted-foreground">
            {search ? t('noAthletesFound') : t('noAthletes')}
          </h2>
          {!search && (
            <p className="mt-1 text-sm text-muted-foreground">{t('noAthletesDesc')}</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-border bg-surface-elevated px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="col-span-4">{t('colName')}</span>
            <span className="col-span-4">{t('colEmail')}</span>
            <span className="col-span-2">{t('colGrade')}</span>
            <span className="col-span-2">{t('colGender')}</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-1 gap-1 px-5 py-3.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-3"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {a.firstName[0]}{a.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {a.firstName} {a.lastName}
                    </p>
                    {a.phone && <p className="text-xs text-muted-foreground sm:hidden">{a.phone}</p>}
                  </div>
                </div>
                <div className="col-span-4 hidden sm:flex items-center text-muted-foreground truncate">
                  {a.email}
                </div>
                <div className="col-span-2 hidden sm:flex items-center text-muted-foreground text-xs">
                  {a.grade?.nameEn ?? '—'}
                </div>
                <div className="col-span-2 hidden sm:flex items-center text-muted-foreground text-xs">
                  {a.gender?.code === 'M' ? t('genderMale') : a.gender?.code === 'F' ? t('genderFemale') : '—'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {t('athleteCount', { count: athletes.length })}
      </p>
    </div>
  );
}
