'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    apiClient.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-heading text-3xl text-primary tracking-widest">
          TAEKWOMBATS
        </Link>

        <div className="mt-10 flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('verifyingEmail')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-10 w-10 text-green-400" />
              <p className="text-foreground font-semibold">{t('emailVerified')}</p>
              <Link href="/login" className="text-sm text-primary hover:underline">
                {t('signInLink')}
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-10 w-10 text-red-400" />
              <p className="text-foreground font-semibold">{t('invalidOrExpiredLinkShort')}</p>
              <Link href="/login" className="text-sm text-primary hover:underline">
                {t('backToLogin')}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
