'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [sent, setSent] = useState(false);

  const schema = z.object({
    email: z.string().email(t('errors.emailInvalid')),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: { email: string }) {
    await apiClient.post('/auth/forgot-password', data);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-heading text-3xl text-primary tracking-widest">
            TAEKWOMBATS
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t('forgotPasswordSubtitle')}</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 rounded border border-green-500/30 bg-green-500/10 px-6 py-8 text-center">
            <CheckCircle className="h-10 w-10 text-green-400" />
            <p className="text-sm text-foreground">{t('linkSentDesc')}</p>
            <Link href="/login" className="text-sm text-primary hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('forgotPasswordDesc')}</p>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('email')}
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? t('sending') : t('sendLink')}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                {t('backToLogin')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
