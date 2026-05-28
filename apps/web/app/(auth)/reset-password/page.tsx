'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const schema = z.object({
    newPassword: z.string().min(8, t('errors.min8Chars')),
    confirmPassword: z.string(),
  }).refine(d => d.newPassword === d.confirmPassword, {
    message: t('errors.passwordsMismatch'),
    path: ['confirmPassword'],
  });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: data.newPassword });
      router.push('/login?reset=1');
    } catch {
      setError(t('invalidOrExpiredLink'));
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">
          {t('invalidToken')}{' '}
          <Link href="/forgot-password" className="text-primary hover:underline">
            {t('requestNewLink')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-heading text-3xl text-primary tracking-widest">
            TAEKWOMBATS
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t('resetPasswordSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('newPassword')}
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('confirmPassword')}
            </label>
            <input
              {...register('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          {error && (
            <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? t('saving') : t('savePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
