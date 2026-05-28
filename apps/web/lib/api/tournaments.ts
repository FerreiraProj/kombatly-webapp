import { apiClient } from './client';

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string;
  registrationDeadline: string;
  startTime: string;
  numAreas: number;
  drawType: string;
  numRounds: number;
  hasVestLimitation: boolean;
  vestQty1: number;
  vestQty2: number;
  vestQty3: number;
  vestQty4: number;
  athletesVisible: boolean;
  drawVisible: boolean;
  areasVisible: boolean;
  flyerUrl?: string;
  status: 'PRIVATE' | 'PUBLIC' | 'ONGOING' | 'FINISHED';
  promoterId: string;
  promoter?: { firstName: string; lastName: string };
  _count?: { registrations: number; categories: number };
  categories?: TournamentCategory[];
}

export interface TournamentCategory {
  id: string;
  gradeId?: string;
  genderId?: string;
  weightCategoryId?: string;
  vestType?: number;
  isCustom: boolean;
  customName?: string;
  grade?: { id: string; nameEn: string; namePt: string; displayOrder: number };
  gender?: { id: string; code: string; nameEn: string; namePt: string };
  weightCategory?: { id: string; symbol?: string; weightValue: number; strWeight: string; displayNameEn: string; displayNamePt: string };
  _count?: { registrations: number };
}

export interface Grade {
  id: string;
  nameEn: string;
  namePt: string;
  minAge?: number;
  maxAge?: number;
  displayOrder: number;
}

export interface WeightCategory {
  id: string;
  gradeId: string;
  genderId: string;
  symbol?: string;
  weightValue: number;
  strWeight: string;
  displayNameEn: string;
  displayNamePt: string;
  vestType: number;
  isOfficial: boolean;
  displayOrder: number;
  grade: Grade;
  gender: { id: string; code: string };
}

export interface CreateTournamentDto {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  registrationDeadline: string;
  startTime: string;
  numAreas: number;
  drawType: string;
  numRounds: number;
  hasVestLimitation: boolean;
  vestQtyType1?: number;
  vestQtyType2?: number;
  vestQtyType3?: number;
  vestQtyType4?: number;
  athletesVisible?: 'NONE' | 'REGISTERED' | 'ALL';
  drawVisible?: boolean;
  areasVisible?: boolean;
  categoryIds?: string[];
}

export const tournamentsApi = {
  getGrades: () => apiClient.get<Grade[]>('/tournaments/reference/grades').then((r) => r.data),

  getStandardCategories: () =>
    apiClient.get<WeightCategory[]>('/tournaments/reference/categories').then((r) => r.data),

  getMine: (status?: string) =>
    apiClient
      .get<Tournament[]>('/tournaments/mine', { params: status ? { status } : undefined })
      .then((r) => r.data),

  getPublic: () => apiClient.get<Tournament[]>('/tournaments').then((r) => r.data),

  getOne: (id: string) => apiClient.get<Tournament>(`/tournaments/${id}`).then((r) => r.data),

  findBySlug: (slug: string) =>
    apiClient.get<Tournament>(`/tournaments/slug/${slug}`).then((r) => r.data),

  create: (dto: CreateTournamentDto) =>
    apiClient.post<Tournament>('/tournaments', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateTournamentDto>) =>
    apiClient.patch<Tournament>(`/tournaments/${id}`, dto).then((r) => r.data),

  setStatus: (id: string, status: string) =>
    apiClient.patch<Tournament>(`/tournaments/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/tournaments/${id}`),

  addCategories: (id: string, weightCategoryIds: string[]) =>
    apiClient.post(`/tournaments/${id}/categories`, { weightCategoryIds }).then((r) => r.data),

  removeCategory: (id: string, categoryId: string) =>
    apiClient.delete(`/tournaments/${id}/categories/${categoryId}`),

  getRegistrations: (id: string, filters?: { categoryId?: string; isPaid?: boolean }) =>
    apiClient
      .get(`/tournaments/${id}/registrations`, { params: filters })
      .then((r) => r.data),
};
