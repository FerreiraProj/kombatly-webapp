'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, CheckCircle, Scale, FileCheck, Loader2, Search } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { joinTournamentRoom, onCheckinUpdated } from '@/lib/hooks/useSocket';

interface RegistrationForCheckin {
  id: string;
  athlete: { id: string; firstName: string; lastName: string };
  category: { customName?: string; grade?: any; gender?: any; weightCategory?: any };
  club?: { id: string; name: string };
  checkin: Checkin | null;
}

interface Checkin {
  id: string;
  actualWeight: string | null;
  weightVerified: boolean;
  documentsChecked: boolean;
  medicalCertificate: boolean;
  athleteCardNumber: string | null;
  notes: string | null;
}

export default function CheckinPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const t = useTranslations('checkin');
  const [registrations, setRegistrations] = useState<RegistrationForCheckin[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [weights, setWeights] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      apiClient.get(`/tournaments/${tournamentId}/registrations`).then(r => r.data),
      apiClient.get(`/tournaments/${tournamentId}/checkin`).then(r => r.data),
    ]).then(([regs, chk]) => {
      setRegistrations(regs);
      setCheckins(chk);
    }).finally(() => setLoading(false));

    joinTournamentRoom(tournamentId);
    return onCheckinUpdated((c) => {
      setCheckins(prev => {
        const idx = prev.findIndex(x => x.id === c.id);
        return idx >= 0 ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
      });
    });
  }, [tournamentId]);

  const checkinMap = Object.fromEntries(checkins.map(c => [(c as any).registrationId ?? c.id, c]));

  async function doCheckin(registrationId: string) {
    setActing(registrationId);
    try {
      const weight = weights[registrationId] ? parseFloat(weights[registrationId]) : undefined;
      const { data } = await apiClient.post(`/tournaments/${tournamentId}/checkin/${registrationId}`, {
        actualWeight: weight,
      });
      setCheckins(prev => {
        const exists = prev.find(x => (x as any).registrationId === registrationId);
        const patched = { ...data, registrationId };
        return exists ? prev.map(x => (x as any).registrationId === registrationId ? patched : x) : [...prev, patched];
      });
    } finally {
      setActing(null);
    }
  }

  async function approveWeight(checkinId: string) {
    setActing(checkinId);
    try {
      const { data } = await apiClient.patch(`/tournaments/${tournamentId}/checkin/${checkinId}/approve-weight`);
      setCheckins(prev => prev.map(x => x.id === checkinId ? data : x));
    } finally {
      setActing(null);
    }
  }

  async function verifyDocs(checkinId: string) {
    setActing(checkinId);
    try {
      const { data } = await apiClient.patch(`/tournaments/${tournamentId}/checkin/${checkinId}/verify-docs`);
      setCheckins(prev => prev.map(x => x.id === checkinId ? data : x));
    } finally {
      setActing(null);
    }
  }

  const filtered = registrations.filter(r => {
    const name = `${r.athlete.firstName} ${r.athlete.lastName}`.toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  const checkedIn = registrations.filter(r => checkinMap[r.id]).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider">
        <ChevronLeft className="h-3.5 w-3.5" /> {t('backToTournament')}
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('accessControl')}</p>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('title')}</h1>
        </div>
        <div className="stat-card text-center min-w-[100px]">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('present')}</p>
          <p className="font-heading text-4xl text-primary">{checkedIn}</p>
          <p className="text-xs text-muted-foreground">/ {registrations.length}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search')}
          className="w-full rounded border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">{t('athlete')}</th>
                <th className="px-4 py-3 text-left">{t('category')}</th>
                <th className="px-4 py-3 text-center">{t('colWeightKg')}</th>
                <th className="px-4 py-3 text-center">{t('colWeightCheck')}</th>
                <th className="px-4 py-3 text-center">{t('colDocsCheck')}</th>
                <th className="px-4 py-3 text-center">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const c = checkinMap[r.id] as Checkin | undefined;
                const isIn = !!c;
                return (
                  <tr key={r.id} className={`border-b border-border/50 transition-colors ${isIn ? 'bg-green-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.athlete.firstName} {r.athlete.lastName}</p>
                      {r.club && <p className="text-xs text-muted-foreground">{r.club.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.category?.customName ?? r.category?.grade?.nameEn ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isIn ? (
                        <span className="text-foreground">{c.actualWeight ?? '—'}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={weights[r.id] ?? ''}
                          onChange={e => setWeights(prev => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="0.0"
                          className="w-20 rounded border border-border bg-surface px-2 py-1 text-center text-sm focus:border-primary focus:outline-none"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isIn && (
                        c.weightVerified
                          ? <CheckCircle className="mx-auto h-4 w-4 text-green-400" />
                          : (
                            <button
                              onClick={() => approveWeight(c.id)}
                              disabled={acting === c.id || !c.actualWeight}
                              className="mx-auto flex items-center justify-center rounded p-1 text-muted-foreground hover:text-primary disabled:opacity-40"
                              title={t('approveWeight')}
                            >
                              {acting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
                            </button>
                          )
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isIn && (
                        c.documentsChecked
                          ? <CheckCircle className="mx-auto h-4 w-4 text-green-400" />
                          : (
                            <button
                              onClick={() => verifyDocs(c.id)}
                              disabled={acting === c.id}
                              className="mx-auto flex items-center justify-center rounded p-1 text-muted-foreground hover:text-primary disabled:opacity-40"
                              title={t('verifyDocs')}
                            >
                              {acting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                            </button>
                          )
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isIn ? (
                        <CheckCircle className="mx-auto h-5 w-5 text-green-400" />
                      ) : (
                        <button
                          onClick={() => doCheckin(r.id)}
                          disabled={acting === r.id}
                          className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {acting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : t('checkIn')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
