'use client';

import { Bell, BellOff, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { registerPush, unregisterPush, isPushSubscribed } from '@/lib/push';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isPushSubscribed().then(setSubscribed).catch(() => {});
  }, []);

  async function togglePush() {
    setLoading(true);
    try {
      if (subscribed) {
        await unregisterPush();
        setSubscribed(false);
      } else {
        const ok = await registerPush();
        setSubscribed(ok);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <p className="text-xs uppercase tracking-widest text-muted-foreground hidden sm:block">
          Elite Promoter Command
        </p>
      </div>
      <div className="flex items-center gap-4">
        {/* Push notifications toggle */}
        <button
          onClick={togglePush}
          disabled={loading}
          title={subscribed ? 'Desativar notificações' : 'Ativar notificações'}
          className={`relative flex h-8 w-8 items-center justify-center rounded border transition-colors
            ${subscribed
              ? 'border-primary text-primary hover:border-primary/70 hover:text-primary/70'
              : 'border-border text-muted-foreground hover:text-foreground'
            } disabled:opacity-50`}
        >
          {subscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
