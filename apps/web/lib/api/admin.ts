import { apiClient } from './client';

export interface PlatformStats {
  users: { total: number; byRole: Record<string, number> };
  tournaments: { total: number; byStatus: Record<string, number> };
  registrations: { total: number; paid: number };
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  _count: { promotedTournaments: number; apiKeys: number };
}

export interface FinancialReport {
  totalRevenue: number;
  paymentCount: number;
  byMonth: { month: string; revenue: number }[];
  payments: any[];
  topTournaments: any[];
}

export interface PlatformSettings {
  id: string;
  platformName: string;
  costPerAthlete: string;
  platformEmail: string;
  referralPointsPerReferral: number;
}

export const adminApi = {
  getStats: () => apiClient.get<PlatformStats>('/admin/stats').then(r => r.data),

  getUsers: (page = 1, limit = 20, search?: string, role?: string) =>
    apiClient.get('/admin/users', { params: { page, limit, search, role } }).then(r => r.data),

  updateUser: (id: string, data: { isActive?: boolean; role?: string }) =>
    apiClient.patch(`/admin/users/${id}`, data).then(r => r.data),

  getTournaments: (page = 1, limit = 20) =>
    apiClient.get('/admin/tournaments', { params: { page, limit } }).then(r => r.data),

  getSettings: () => apiClient.get<PlatformSettings>('/admin/settings').then(r => r.data),

  updateSettings: (data: Partial<PlatformSettings>) =>
    apiClient.patch('/admin/settings', data).then(r => r.data),

  getFinancialReport: (from?: string, to?: string) =>
    apiClient.get<FinancialReport>('/admin/reports/financial', { params: { from, to } }).then(r => r.data),

  getExportCsvUrl: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return `${base}/admin/reports/export${qs ? `?${qs}` : ''}`;
  },
};
