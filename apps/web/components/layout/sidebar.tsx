'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Trophy, Users, DollarSign, Settings, LogOut, ShieldAlert, Globe,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const navItems = [
    { label: t('dashboard'),   href: '/dashboard',   icon: LayoutDashboard },
    { label: t('events'),      href: '/events',       icon: Globe },
    { label: t('tournaments'), href: '/tournaments',  icon: Trophy },
    { label: t('athletes'),    href: '/athletes',     icon: Users },
    { label: t('financials'),  href: '/financials',   icon: DollarSign },
    { label: t('settings'),    href: '/settings',     icon: Settings },
  ];

  const adminItems = [
    { label: t('admin'), href: '/admin', icon: ShieldAlert },
  ];

  async function handleLogout() {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    router.push('/login');
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <aside className="hidden w-52 flex-shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-14 items-center px-5 border-b border-border">
        <span className="font-heading text-xl text-primary tracking-widest">TAEKWOMBATS</span>
      </div>

      <Link
        href="/settings"
        className="flex items-center gap-3 border-b border-border px-5 py-4 hover:bg-surface-elevated transition-colors group"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {user ? `${user.firstName} ${user.lastName}` : t('loading')}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {user?.role ?? 'Promoter'}
          </p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {user?.role === 'ADMIN' && (
          <>
            <div className="my-1.5 border-t border-border" />
            {adminItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-border px-3 py-4 space-y-0.5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </div>

      <div className="px-3 pb-4">
        <Link
          href="/tournaments/create"
          className="block w-full rounded bg-primary py-3 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700 transition-colors"
        >
          {t('createTournament')}
        </Link>
      </div>
    </aside>
  );
}
