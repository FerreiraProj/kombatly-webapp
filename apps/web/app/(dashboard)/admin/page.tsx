'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Trophy, Activity, Search, CheckCircle, XCircle, Loader2, Download, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi, PlatformStats, AdminUser, FinancialReport } from '@/lib/api/admin';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const t = useTranslations('admin');
  const user = useAuthStore(s => s.user);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'financeiro'>('stats');
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/dashboard');
  }, [user, router]);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    adminApi.getUsers(page, 20, search || undefined)
      .then(d => { setUsers(d.users); setTotalUsers(d.total); setPages(d.pages); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    if (activeTab === 'financeiro' && !report) {
      setReportLoading(true);
      adminApi.getFinancialReport().then(setReport).finally(() => setReportLoading(false));
    }
  }, [activeTab, report]);

  async function toggleActive(u: AdminUser) {
    setUpdating(u.id);
    try {
      await adminApi.updateUser(u.id, { isActive: !u.isActive });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !u.isActive } : x));
    } finally {
      setUpdating(null);
    }
  }

  const tabs = [
    { key: 'stats' as const, label: t('tabStats') },
    { key: 'users' as const, label: t('tabUsers') },
    { key: 'financeiro' as const, label: t('tabFinancial') },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('controlPanel')}</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
              activeTab === key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="stat-card">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {t('stats.usersLabel')}
              </div>
              <p className="mt-2 font-heading text-5xl text-foreground">{stats.users.total}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(stats.users.byRole).map(([role, count]) => (
                  <span key={role} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                    {(t as any)(`roleLabels.${role}` as any, { default: role })}: {count}
                  </span>
                ))}
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Trophy className="h-3.5 w-3.5" /> {t('stats.tournamentsLabel')}
              </div>
              <p className="mt-2 font-heading text-5xl text-foreground">{stats.tournaments.total}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(stats.tournaments.byStatus).map(([status, count]) => (
                  <span key={status} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Activity className="h-3.5 w-3.5" /> {t('stats.registrationsLabel')}
              </div>
              <p className="mt-2 font-heading text-5xl text-foreground">{stats.registrations.total}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('stats.paidRegistrations', {
                  paid: stats.registrations.paid,
                  pct: stats.registrations.total > 0
                    ? Math.round(stats.registrations.paid / stats.registrations.total * 100)
                    : 0,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financials tab */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          {reportLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : report ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="stat-card">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> {t('financial.totalRevenue')}
                  </div>
                  <p className="mt-2 font-heading text-5xl text-gold">€{Number(report.totalRevenue).toFixed(2)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('financial.payments', { count: report.paymentCount })}</p>
                </div>
                <div className="stat-card flex items-end">
                  <a
                    href={adminApi.getExportCsvUrl()}
                    download="financial-report.csv"
                    className="flex items-center gap-2 rounded border border-border bg-surface-2 px-4 py-2 text-sm text-foreground hover:bg-surface-elevated transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {t('financial.exportCsv')}
                  </a>
                </div>
              </div>

              {report.byMonth.length > 0 && (
                <div className="rounded-lg border border-border bg-surface p-5">
                  <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">{t('financial.revenueByMonth')}</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={report.byMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v) => `€${v}`} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6 }}
                        formatter={(v: any) => [`€${Number(v).toFixed(2)}`, t('financial.revenue')]}
                      />
                      <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('users.searchPlaceholder')}
                className="w-full rounded border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground">{t('users.count', { count: totalUsers })}</span>
          </div>

          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">{t('users.name')}</th>
                  <th className="px-4 py-3 text-left">{t('users.email')}</th>
                  <th className="px-4 py-3 text-left">{t('users.role')}</th>
                  <th className="px-4 py-3 text-center">{t('users.emailVerified')}</th>
                  <th className="px-4 py-3 text-center">{t('users.active')}</th>
                  <th className="px-4 py-3 text-center">{t('users.tournaments')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface-2 px-2 py-0.5 text-xs">
                        {t(`roleLabels.${u.role}` as any) ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.emailVerifiedAt
                        ? <CheckCircle className="mx-auto h-4 w-4 text-green-400" />
                        : <XCircle className="mx-auto h-4 w-4 text-muted-foreground/40" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={updating === u.id}
                        className="mx-auto flex items-center justify-center"
                      >
                        {updating === u.id
                          ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          : u.isActive
                            ? <CheckCircle className="h-4 w-4 text-green-400 hover:text-red-400 transition-colors" />
                            : <XCircle className="h-4 w-4 text-red-400 hover:text-green-400 transition-colors" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{u._count.promotedTournaments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded border border-border px-3 py-1.5 text-xs disabled:opacity-40">←</button>
              <span className="text-xs text-muted-foreground">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="rounded border border-border px-3 py-1.5 text-xs disabled:opacity-40">→</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
