'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface Props {
  tournamentId: string;
  deadline: string;
  ctaTitle: string;
  ctaDeadline: string;
  ctaBtn: string;
  loginToRegister: string;
}

export function RegisterCta({ tournamentId, deadline, ctaTitle, ctaDeadline, ctaBtn, loginToRegister }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('access_token'));
  }, []);

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-8 text-center space-y-3">
      <Users className="mx-auto h-10 w-10 text-primary" />
      <h2 className="font-heading text-2xl text-foreground">{ctaTitle}</h2>
      <p className="text-muted-foreground text-sm">{ctaDeadline}</p>
      {isLoggedIn ? (
        <Link
          href={`/tournaments/${tournamentId}/register`}
          className="inline-flex items-center gap-2 rounded bg-primary px-7 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          {ctaBtn}
        </Link>
      ) : (
        <Link
          href={`/login?next=/tournaments/${tournamentId}/register`}
          className="inline-flex items-center gap-2 rounded bg-primary px-7 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          {loginToRegister}
        </Link>
      )}
    </div>
  );
}
