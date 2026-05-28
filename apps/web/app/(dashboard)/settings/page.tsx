'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Check, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';

function inputCls(err: boolean) {
  return `w-full rounded border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
    err ? 'border-destructive' : 'border-border focus:border-primary/50'
  }`;
}

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { user, setUser } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [club, setClub] = useState<any>(null);
  const [clubLoading, setClubLoading] = useState(true);
  const [clubSuccess, setClubSuccess] = useState('');
  const [clubError, setClubError] = useState('');

  const clubSchema = z.object({
    name:    z.string().min(1, t('errors.required')),
    sigla:   z.string().max(10).optional(),
    city:    z.string().optional(),
    country: z.string().optional(),
    phone:   z.string().optional(),
    email:   z.string().email().optional().or(z.literal('')),
  });
  type ClubValues = z.infer<typeof clubSchema>;

  const clubForm = useForm<ClubValues>({ resolver: zodResolver(clubSchema) });

  const profileSchema = z.object({
    firstName: z.string().min(2, t('errors.required')),
    lastName:  z.string().min(2, t('errors.required')),
    phone:     z.string().optional(),
  });

  const passwordSchema = z.object({
    currentPassword: z.string().min(1, t('errors.required')),
    newPassword:     z.string().min(8, t('errors.min8Chars')),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: t('errors.passwordsMismatch'),
    path: ['confirmPassword'],
  });

  type ProfileValues = z.infer<typeof profileSchema>;
  type PasswordValues = z.infer<typeof passwordSchema>;

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: (user as any)?.phone ?? '' },
  });

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName ?? '',
        lastName:  user.lastName ?? '',
        phone:     (user as any).phone ?? '',
      });
    }
  }, [user]);

  useEffect(() => {
    apiClient.get('/clubs/me')
      .then(r => {
        setClub(r.data);
        clubForm.reset({
          name:    r.data.name ?? '',
          sigla:   r.data.sigla ?? '',
          city:    r.data.city ?? '',
          country: r.data.country ?? '',
          phone:   r.data.phone ?? '',
          email:   r.data.email ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setClubLoading(false));
  }, []);

  async function onProfileSubmit(values: ProfileValues) {
    setProfileError('');
    try {
      const { data } = await apiClient.patch('/users/me', values);
      setUser(data);
      setProfileSuccess(t('profileUpdated'));
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setProfileError(Array.isArray(msg) ? msg.join(', ') : msg ?? t('errors.updateFailed'));
    }
  }

  async function onClubSubmit(values: ClubValues) {
    setClubError('');
    try {
      const payload = { ...values, email: values.email || undefined };
      if (club) {
        const { data } = await apiClient.patch(`/clubs/${club.id}`, payload);
        setClub(data);
      } else {
        const { data } = await apiClient.post('/clubs', payload);
        setClub(data);
      }
      setClubSuccess(t('clubSaved'));
      setTimeout(() => setClubSuccess(''), 3000);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setClubError(Array.isArray(msg) ? msg.join(', ') : msg ?? t('errors.updateFailed'));
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setPasswordError('');
    try {
      await apiClient.patch('/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setPasswordSuccess(t('passwordChanged'));
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setPasswordError(Array.isArray(msg) ? msg.join(', ') : msg ?? t('errors.passwordChangeFailed'));
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('subtitle')}</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading text-xl text-foreground">{t('profile')}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('firstName')} error={profileForm.formState.errors.firstName?.message} required>
              <input {...profileForm.register('firstName')} className={inputCls(!!profileForm.formState.errors.firstName)} />
            </Field>
            <Field label={t('lastName')} error={profileForm.formState.errors.lastName?.message} required>
              <input {...profileForm.register('lastName')} className={inputCls(!!profileForm.formState.errors.lastName)} />
            </Field>
            <Field label={t('phone')} error={profileForm.formState.errors.phone?.message}>
              <input {...profileForm.register('phone')} placeholder="+351 912 345 678" className={inputCls(false)} />
            </Field>
            <Field label={t('email')}>
              <input value={user?.email ?? ''} disabled className={inputCls(false) + ' opacity-50 cursor-not-allowed'} />
            </Field>
          </div>

          {profileError && (
            <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="flex items-center gap-2 rounded border border-success/30 bg-success/10 p-3 text-sm text-success">
              <Check className="h-4 w-4" /> {profileSuccess}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {profileForm.formState.isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Check className="h-4 w-4" />}
              {t('saveChanges')}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading text-xl text-foreground">{t('clubTitle')}</h2>
        </div>

        {clubLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={clubForm.handleSubmit(onClubSubmit)} className="space-y-4">
            {!club && (
              <p className="text-sm text-muted-foreground">{t('clubNoClub')}</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('clubName')} error={clubForm.formState.errors.name?.message} required>
                <input {...clubForm.register('name')} placeholder="e.g. Taekwondo Club Lisboa" className={inputCls(!!clubForm.formState.errors.name)} />
              </Field>
              <Field label={t('clubSigla')} error={clubForm.formState.errors.sigla?.message}>
                <input {...clubForm.register('sigla')} placeholder="TCL" className={inputCls(false)} />
              </Field>
              <Field label={t('clubCity')} error={clubForm.formState.errors.city?.message}>
                <input {...clubForm.register('city')} className={inputCls(false)} />
              </Field>
              <Field label={t('clubCountry')} error={clubForm.formState.errors.country?.message}>
                <input {...clubForm.register('country')} placeholder="Portugal" className={inputCls(false)} />
              </Field>
              <Field label={t('clubPhone')} error={clubForm.formState.errors.phone?.message}>
                <input {...clubForm.register('phone')} className={inputCls(false)} />
              </Field>
              <Field label={t('clubEmail')} error={clubForm.formState.errors.email?.message}>
                <input {...clubForm.register('email')} className={inputCls(!!clubForm.formState.errors.email)} />
              </Field>
            </div>

            {clubError && (
              <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {clubError}
              </div>
            )}
            {clubSuccess && (
              <div className="flex items-center gap-2 rounded border border-success/30 bg-success/10 p-3 text-sm text-success">
                <Check className="h-4 w-4" /> {clubSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={clubForm.formState.isSubmitting}
                className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {clubForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {club ? t('saveChanges') : t('clubCreate')}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading text-xl text-foreground">{t('changePassword')}</h2>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Field label={t('currentPassword')} error={passwordForm.formState.errors.currentPassword?.message} required>
            <input type="password" {...passwordForm.register('currentPassword')} className={inputCls(!!passwordForm.formState.errors.currentPassword)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('newPassword')} error={passwordForm.formState.errors.newPassword?.message} required>
              <input type="password" {...passwordForm.register('newPassword')} className={inputCls(!!passwordForm.formState.errors.newPassword)} />
            </Field>
            <Field label={t('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} required>
              <input type="password" {...passwordForm.register('confirmPassword')} className={inputCls(!!passwordForm.formState.errors.confirmPassword)} />
            </Field>
          </div>

          {passwordError && (
            <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded border border-success/30 bg-success/10 p-3 text-sm text-success">
              <Check className="h-4 w-4" /> {passwordSuccess}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {passwordForm.formState.isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Lock className="h-4 w-4" />}
              {t('updatePassword')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
