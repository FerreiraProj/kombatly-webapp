import { apiClient } from './client';

export type RefereeRole = 'MAIN' | 'JUDGE_1' | 'JUDGE_2' | 'AREA_JUDGE';

export interface RefereeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CombatReferee {
  id: string;
  combatId: string;
  refereeId: string;
  role: RefereeRole;
  canEditResults: boolean;
  assignedAt: string;
  referee: RefereeUser;
}

export const REFEREE_ROLE_LABELS: Record<RefereeRole, string> = {
  MAIN: 'Principal',
  JUDGE_1: 'Juiz 1',
  JUDGE_2: 'Juiz 2',
  AREA_JUDGE: 'Juiz de Área',
};

export const refereesApi = {
  list: (search?: string) =>
    apiClient.get<RefereeUser[]>('/referees', { params: search ? { search } : {} }).then(r => r.data),

  getCombatReferees: (combatId: string) =>
    apiClient.get<CombatReferee[]>(`/combats/${combatId}/referees`).then(r => r.data),

  assign: (combatId: string, refereeId: string, role: RefereeRole) =>
    apiClient.post<CombatReferee>(`/combats/${combatId}/referees`, { refereeId, role }).then(r => r.data),

  remove: (combatId: string, refereeId: string) =>
    apiClient.delete(`/combats/${combatId}/referees/${refereeId}`),
};
