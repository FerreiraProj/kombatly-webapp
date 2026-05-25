import { apiClient } from './client';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'MBWAY' | 'OTHER';

export interface InvoiceRegistration {
  id: string;
  athlete: { firstName: string; lastName: string };
  category: {
    isCustom: boolean;
    customName?: string;
    grade?: { names: Record<string, string> };
    gender?: { code: string };
    weightCategory?: { strWeight: string; displayNames: Record<string, string> };
  };
  club?: { name: string; sigla: string };
}

export interface Invoice {
  id: string;
  tournamentId: string;
  issuedAt: string;
  paidAt?: string;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  numAthletes: number;
  totalAmount: number;
  notes?: string;
  issuer: { firstName: string; lastName: string; email?: string };
  receiver: { firstName: string; lastName: string; email?: string };
  tournament?: { id: string; name: string; slug: string };
  registrations?: InvoiceRegistration[];
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH:     'Cash',
  TRANSFER: 'Bank Transfer',
  MBWAY:    'MBWay',
  OTHER:    'Other',
};

export const invoicesApi = {
  generate: (tournamentId: string, clubUserId: string, notes?: string) =>
    apiClient
      .post<Invoice>(`/tournaments/${tournamentId}/invoices`, { clubUserId, notes })
      .then((r) => r.data),

  findForTournament: (tournamentId: string) =>
    apiClient
      .get<Invoice[]>(`/tournaments/${tournamentId}/invoices`)
      .then((r) => r.data),

  findMine: () =>
    apiClient.get<Invoice[]>('/invoices/me').then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Invoice>(`/invoices/${id}`).then((r) => r.data),

  markPaid: (id: string, paymentMethod: PaymentMethod) =>
    apiClient
      .patch<Invoice>(`/invoices/${id}/pay`, { paymentMethod })
      .then((r) => r.data),

  cancel: (id: string) =>
    apiClient.patch<Invoice>(`/invoices/${id}/cancel`).then((r) => r.data),
};
