'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Trophy, Users, DollarSign, Settings, LogOut, ShieldAlert, Globe, Key,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const navItems = [
    { label: t('dashboard'),   href: '/dashboard',   icon: LayoutDashboard },
    { label: t('events'),      href: '/events', icon: Globe },
    { label: t('tournaments'), href: '/tournaments',  icon: Trophy },
    { label: t('athletes'),    href: '/athletes',     icon: Users },
    { label: t('financials'),  href: '/financials',   icon: DollarSign },
    { label: t('settings'),    href: '/settings',     icon: Settings },
    { label: 'API Keys',       href: '/api-keys',     icon: Key },
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

  function handleNavClick() {
    onClose?.();
  }

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200',
      'lg:relative lg:flex lg:w-52 lg:translate-x-0',
      isOpen ? 'flex translate-x-0' : '-translate-x-full lg:translate-x-0',
      !isOpen && 'hidden lg:flex',
    )}>
      <div className="flex h-14 items-center justify-between px-5 border-b border-border">
        <span className="font-heading text-xl tracking-widest">
          <span className="text-primary">KOMBATLY</span><span className="text-foreground">PRO</span>
        </span>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-muted-foreground hover:text-foreground p-1"
          aria-label="Fechar menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <Link
        href="/settings"
        onClick={handleNavClick}
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

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
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
                  onClick={handleNavClick}
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
          onClick={handleNavClick}
          className="block w-full rounded bg-primary py-3 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700 transition-colors"
        >
          {t('createTournament')}
        </Link>
      </div>
    </aside>
  );
}
