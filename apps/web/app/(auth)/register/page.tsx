'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const schema = z
    .object({
      firstName: z.string().min(1, t('errors.firstNameRequired')).max(100),
      lastName: z.string().min(1, t('errors.lastNameRequired')).max(100),
      email: z.string().email(t('errors.emailInvalid')),
      password: z.string().min(8, t('errors.min8Chars')),
      confirmPassword: z.string(),
      phone: z.string().optional(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('errors.passwordsMismatch'),
      path: ['confirmPassword'],
    });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      const { data: tokens } = await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      const { data: user } = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      setAuth(user, tokens.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.message ?? t('registrationFailed'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-heading text-3xl text-primary tracking-widest">
            TAEKWOMBATS
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t('createAccountSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('firstName')}
              </label>
              <input
                {...register('firstName')}
                type="text"
                className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="João"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('lastName')}
              </label>
              <input
                {...register('lastName')}
                type="text"
                className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Silva"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('email')}
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('phoneOptional')}
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="+351 912 345 678"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('password')}
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('confirmPassword')}
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Repeat password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? t('creatingAccount') : t('createAccount').toUpperCase()}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
