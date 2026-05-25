import { apiClient } from './client';

export interface Registration {
  id: string;
  tournamentId: string;
  athleteId: string;
  categoryId: string;
  clubId?: string;
  weight?: number;
  ranking: number;
  isPaid: boolean;
  checkedIn: boolean;
  athlete?: { firstName: string; lastName: string; email: string };
  category?: {
    id: string;
    isCustom: boolean;
    customName?: string;
    grade?: { names: Record<string, string> };
    gender?: { code: string };
    weightCategory?: { strWeight: string; displayNames: Record<string, string> };
  };
  club?: { name: string; sigla: string };
  invoiceNote?: { id: string; status: string; totalAmount: number };
}

export interface CreateRegistrationDto {
  athleteId: string;
  categoryId: string;
  clubId?: string;
  weight?: number;
  ranking?: number;
}

export interface SuggestedCategory {
  id: string;
  weightCategory?: { strWeight: string; displayNames: Record<string, string> };
  grade?: { names: Record<string, string> };
  gender?: { code: string };
}

export const registrationsApi = {
  register: (tournamentId: string, dto: CreateRegistrationDto) =>
    apiClient
      .post<Registration>(`/tournaments/${tournamentId}/registrations`, dto)
      .then((r) => r.data),

  bulkRegister: (tournamentId: string, registrations: CreateRegistrationDto[]) =>
    apiClient
      .post<Registration[]>(`/tournaments/${tournamentId}/registrations/bulk`, registrations)
      .then((r) => r.data),

  cancel: (registrationId: string) =>
    apiClient.delete(`/registrations/${registrationId}`),

  suggestCategory: (
    tournamentId: string,
    weight: number,
    gradeId: string,
    genderId: string,
  ) =>
    apiClient
      .get<SuggestedCategory>(`/tournaments/${tournamentId}/registrations/suggest-category`, {
        params: { weight, gradeId, genderId },
      })
      .then((r) => r.data),
};
