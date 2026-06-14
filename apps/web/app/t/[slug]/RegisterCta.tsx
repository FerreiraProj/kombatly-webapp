'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, ChevronDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { registrationsApi } from '@/lib/api/registrations';

interface Category {
  id: string;
  isCustom: boolean;
  customName?: string;
  grade?: { nameEn?: string; namePt?: string };
  gender?: { code: string };
  weightCategory?: { strWeight: string; displayNameEn: string };
}

interface Props {
  tournamentId: string;
  deadline: string;
  categories: Category[];
  ctaTitle: string;
  ctaDeadline: string;
  ctaBtn: string;
  loginToRegister: string;
}

function catLabel(cat: Category): string {
  if (cat.isCustom) return cat.customName ?? 'Categoria';
  const grade = cat.grade?.nameEn ?? cat.grade?.namePt ?? '';
  const gender = cat.gender?.code === 'M' ? 'Masculino' : cat.gender?.code === 'F' ? 'Feminino' : '';
  const weight = cat.weightCategory?.displayNameEn ?? cat.weightCategory?.strWeight ?? '';
  return [grade, gender, weight].filter(Boolean).join(' · ');
}

export function RegisterCta({ tournamentId, deadline, categories, ctaTitle, ctaDeadline, ctaBtn, loginToRegister }: Props) {
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [weight, setWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setHydrated(true); }, []);

  async function handleRegister() {
    if (!user || !categoryId) return;
    setSubmitting(true);
    setError('');
    try {
      await registrationsApi.register(tournamentId, {
        athleteId: user.id,
        categoryId,
        weight: weight ? parseFloat(weight) : undefined,
      });
      setSuccess(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao submeter inscrição.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-8 text-center space-y-3">
        <Users className="mx-auto h-10 w-10 text-primary" />
        <h2 className="font-heading text-2xl text-foreground">{ctaTitle}</h2>
        <p className="text-muted-foreground text-sm">{ctaDeadline}</p>
        <Link
          href={`/login?next=/t/${tournamentId}`}
          className="inline-flex items-center gap-2 rounded bg-primary px-7 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          {loginToRegister}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 px-6 py-8 text-center space-y-3">
        <CheckCircle className="mx-auto h-10 w-10 text-success" />
        <h2 className="font-heading text-2xl text-foreground">Inscrição submetida!</h2>
        <p className="text-muted-foreground text-sm">A tua inscrição foi recebida. Aguarda confirmação de pagamento.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-8 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">{ctaTitle}</h2>
          </div>
          <p className="text-muted-foreground text-sm">{ctaDeadline}</p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            {ctaBtn}
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-4 pt-2 border-t border-primary/20">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Selecionar categoria…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{catLabel(cat)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Peso atual (kg) — opcional</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="ex: 68.5"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleRegister}
              disabled={submitting || !categoryId}
              className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar inscrição
            </button>
            <button
              onClick={() => { setOpen(false); setError(''); }}
              className="rounded border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
