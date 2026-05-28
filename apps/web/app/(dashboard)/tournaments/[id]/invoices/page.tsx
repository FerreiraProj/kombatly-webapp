'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft, FileText, Plus, Check, X, ChevronDown, ChevronUp,
  Loader2, AlertCircle, DollarSign, Users,
} from 'lucide-react';
import {
  invoicesApi, Invoice, PaymentMethod, PAYMENT_METHOD_LABELS,
} from '@/lib/api/invoices';
import { clubsApi } from '@/lib/api/clubs';
import { tournamentsApi } from '@/lib/api/tournaments';

type TFunc = ReturnType<typeof useTranslations<'invoices'>>;

const STATUS_CLS: Record<string, string> = {
  PENDING:   'badge-draft',
  PAID:      'badge-public',
  CANCELLED: 'bg-muted/20 text-muted-foreground text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wider',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(n: number) {
  return `€${Number(n).toFixed(2)}`;
}

export default function InvoicesPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('invoices');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);

  function reload() {
    invoicesApi.findForTournament(tournamentId).then(setInvoices);
  }

  useEffect(() => {
    invoicesApi
      .findForTournament(tournamentId)
      .then(setInvoices)
      .catch(() => router.push(`/tournaments/${tournamentId}`))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  const totalRevenue = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  const totalPending = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href={`/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t('backToTournament')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('finance')}</p>
          <h1 className="font-heading text-4xl text-foreground sm:text-5xl">{t('invoiceNotes')}</h1>
        </div>
        <button
          onClick={() => setShowGenerator((v) => !v)}
          className="flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shrink-0 mt-1"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('newInvoice')}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('totalInvoiced')}</p>
          <p className="mt-2 font-heading text-4xl text-gold">
            {formatAmount(totalRevenue + totalPending)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('collected')}</p>
          <p className="mt-2 font-heading text-4xl text-success">{formatAmount(totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('outstanding')}</p>
          <p className="mt-2 font-heading text-4xl text-foreground">{formatAmount(totalPending)}</p>
        </div>
      </div>

      {/* Generator panel */}
      {showGenerator && (
        <InvoiceGenerator
          t={t}
          tournamentId={tournamentId}
          onCreated={() => { reload(); setShowGenerator(false); }}
          onCancel={() => setShowGenerator(false)}
        />
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h2 className="font-heading text-xl text-muted-foreground">{t('noInvoicesTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('noInvoicesEmptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              t={t}
              invoice={inv}
              onPaid={(updated) => setInvoices((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
              onCancelled={(updated) => setInvoices((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceGenerator({
  t,
  tournamentId,
  onCreated,
  onCancel,
}: {
  t: TFunc;
  tournamentId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [clubs, setClubs] = useState<{ userId: string; name: string; sigla: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingClubs, setLoadingClubs] = useState(true);

  useEffect(() => {
    tournamentsApi.getRegistrations(tournamentId).then((regs) => {
      clubsApi.getPublic().then((allClubs) => {
        setClubs(allClubs.map((c: any) => ({
          userId: c.userId ?? '',
          name: c.name,
          sigla: c.sigla,
        })).filter((c: any) => c.userId));
      });
    }).finally(() => setLoadingClubs(false));
  }, [tournamentId]);

  async function handleSubmit() {
    if (!selectedUserId) { setError(t('errorSelectClub')); return; }
    setSubmitting(true);
    setError('');
    try {
      await invoicesApi.generate(tournamentId, selectedUserId, notes || undefined);
      onCreated();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? t('errorFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-surface p-5 space-y-4">
      <h3 className="font-heading text-lg text-foreground">{t('newInvoiceTitle')}</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('club')} <span className="text-primary">*</span>
          </label>
          {loadingClubs ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('loadingClubs')}
            </div>
          ) : (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">{t('selectClub')}</option>
              {clubs.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.sigla} — {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('notesOptional')}
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className="w-full rounded border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 rounded bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {t('generateInvoice')}
        </button>
      </div>
    </div>
  );
}

function InvoiceCard({
  t,
  invoice,
  onPaid,
  onCancelled,
}: {
  t: TFunc;
  invoice: Invoice;
  onPaid: (inv: Invoice) => void;
  onCancelled: (inv: Invoice) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('TRANSFER');
  const [actioning, setActioning] = useState(false);

  async function handleMarkPaid() {
    setActioning(true);
    try {
      const updated = await invoicesApi.markPaid(invoice.id, payMethod);
      onPaid(updated);
      setShowPayModal(false);
    } finally {
      setActioning(false);
    }
  }

  async function handleCancel() {
    if (!confirm(t('cancelConfirm'))) return;
    setActioning(true);
    try {
      const updated = await invoicesApi.cancel(invoice.id);
      onCancelled(updated);
    } finally {
      setActioning(false);
    }
  }

  const isPending = invoice.status === 'PENDING';

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
          <DollarSign className="h-5 w-5 text-gold" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">
              {invoice.receiver.firstName} {invoice.receiver.lastName}
            </p>
            <span className={STATUS_CLS[invoice.status]}>{invoice.status}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t('athleteCount', { count: invoice.numAthletes })}
            </span>
            <span>{t('issuedDate', { date: formatDate(invoice.issuedAt) })}</span>
            {invoice.paidAt && <span>{t('paidDate', { date: formatDate(invoice.paidAt) })}</span>}
            {invoice.paymentMethod && (
              <span>{PAYMENT_METHOD_LABELS[invoice.paymentMethod]}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="font-heading text-2xl text-gold">{formatAmount(Number(invoice.totalAmount))}</p>

          {isPending && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowPayModal(true)}
                disabled={actioning}
                className="flex items-center gap-1.5 rounded bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                {t('markPaid')}
              </button>
              <button
                onClick={handleCancel}
                disabled={actioning}
                className="flex items-center gap-1.5 rounded bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/20 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Pay modal (inline) */}
      {showPayModal && (
        <div className="border-t border-border bg-surface-elevated px-5 py-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{t('selectPaymentMethod')}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPayMethod(m)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  payMethod === m
                    ? 'bg-primary text-white'
                    : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {PAYMENT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPayModal(false)}
              className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={actioning}
              className="flex items-center gap-1.5 rounded bg-success px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {actioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {t('confirmPayment')}
            </button>
          </div>
        </div>
      )}

      {/* Expanded athlete list */}
      {expanded && invoice.registrations && invoice.registrations.length > 0 && (
        <div className="border-t border-border">
          <div className="hidden sm:grid grid-cols-12 gap-3 bg-surface-elevated px-5 py-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="col-span-4">{t('colAthlete')}</span>
            <span className="col-span-5">{t('colCategory')}</span>
            <span className="col-span-3">{t('colClub')}</span>
          </div>
          <ul className="divide-y divide-border">
            {invoice.registrations.map((reg) => (
              <li key={reg.id} className="grid grid-cols-1 gap-1 px-5 py-2.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                <div className="col-span-4 font-medium text-foreground">
                  {reg.athlete.firstName} {reg.athlete.lastName}
                </div>
                <div className="col-span-5 text-muted-foreground text-xs">
                  {reg.category.isCustom
                    ? reg.category.customName
                    : [
                        reg.category.grade?.names?.en,
                        reg.category.gender?.code === 'M' ? t('genderMale') : reg.category.gender?.code === 'F' ? t('genderFemale') : null,
                        reg.category.weightCategory?.displayNames?.en ?? reg.category.weightCategory?.strWeight,
                      ].filter(Boolean).join(' · ')}
                </div>
                <div className="col-span-3 text-xs text-muted-foreground">
                  {reg.club?.sigla ?? reg.club?.name ?? '—'}
                </div>
              </li>
            ))}
          </ul>
          {invoice.notes && (
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{t('notesLabel')}: </span>{invoice.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
