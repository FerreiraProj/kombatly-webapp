'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, FileText, ChevronDown, ChevronUp, Users, ExternalLink } from 'lucide-react';
import { invoicesApi, Invoice, PAYMENT_METHOD_LABELS } from '@/lib/api/invoices';

const STATUS_CLS: Record<string, string> = {
  PENDING:   'badge-draft',
  PAID:      'badge-public',
  CANCELLED: 'bg-muted/20 text-muted-foreground text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wider',
};

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FinancialsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesApi.findMine().then(setInvoices).finally(() => setLoading(false));
  }, []);

  const paid     = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount), 0);
  const pending  = invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + Number(i.totalAmount), 0);
  const total    = paid + pending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Finance</p>
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">FINANCIALS</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Invoiced</p>
          <p className="mt-2 font-heading text-4xl text-foreground">€{total.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Paid</p>
          <p className="mt-2 font-heading text-4xl text-success">€{paid.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Outstanding</p>
          <p className="mt-2 font-heading text-4xl text-gold">€{pending.toFixed(2)}</p>
        </div>
      </div>

      {/* Invoice list */}
      <div>
        <h2 className="font-heading text-2xl text-foreground mb-4">MY INVOICE NOTES</h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h2 className="font-heading text-xl text-muted-foreground">NO INVOICES YET</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invoice notes from promoters will appear here once generated
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <FinancialCard key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FinancialCard({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
          <DollarSign className="h-5 w-5 text-gold" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">
              {invoice.tournament?.name ?? 'Tournament'}
            </p>
            <span className={STATUS_CLS[invoice.status]}>{invoice.status}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>From: {invoice.issuer.firstName} {invoice.issuer.lastName}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {invoice.numAthletes} athlete{invoice.numAthletes !== 1 ? 's' : ''}
            </span>
            <span>Issued {fmt(invoice.issuedAt)}</span>
            {invoice.paidAt && <span>Paid {fmt(invoice.paidAt)}</span>}
            {invoice.paymentMethod && <span>{PAYMENT_METHOD_LABELS[invoice.paymentMethod]}</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="font-heading text-2xl text-gold">€{Number(invoice.totalAmount).toFixed(2)}</p>
          {invoice.tournament && (
            <Link
              href={`/tournaments/${invoice.tournament.id}`}
              className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="View tournament"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && invoice.registrations && invoice.registrations.length > 0 && (
        <div className="border-t border-border">
          <div className="hidden sm:grid grid-cols-12 gap-3 bg-surface-elevated px-5 py-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="col-span-5">Athlete</span>
            <span className="col-span-7">Category</span>
          </div>
          <ul className="divide-y divide-border">
            {invoice.registrations.map((reg) => (
              <li key={reg.id} className="grid grid-cols-1 gap-1 px-5 py-2.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                <div className="col-span-5 font-medium text-foreground">
                  {reg.athlete.firstName} {reg.athlete.lastName}
                </div>
                <div className="col-span-7 text-xs text-muted-foreground">
                  {reg.category.isCustom
                    ? reg.category.customName
                    : [
                        reg.category.grade?.names?.en,
                        reg.category.gender?.code === 'M' ? 'Male' : reg.category.gender?.code === 'F' ? 'Female' : null,
                        reg.category.weightCategory?.displayNames?.en ?? reg.category.weightCategory?.strWeight,
                      ].filter(Boolean).join(' · ')}
                </div>
              </li>
            ))}
          </ul>
          {invoice.notes && (
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Notes: </span>{invoice.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
