import { apiClient } from './client';

export interface Club {
  id: string;
  name: string;
  sigla: string;
  logoUrl?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gradeId?: string;
  genderId?: string;
  grade?: { id: string; nameEn: string; namePt: string; displayOrder: number };
  gender?: { id: string; code: string };
}

export interface CreateAthleteDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gradeId?: string;
  genderId?: string;
}

export const clubsApi = {
  getMyClub: () => apiClient.get<Club>('/clubs/me').then((r) => r.data),

  getMyAthletes: () => apiClient.get<Athlete[]>('/clubs/me/athletes').then((r) => r.data),

  createAthlete: (dto: CreateAthleteDto) =>
    apiClient.post<Athlete>('/clubs/me/athletes', dto).then((r) => r.data),

  getPublic: () => apiClient.get<Club[]>('/clubs').then((r) => r.data),
};
