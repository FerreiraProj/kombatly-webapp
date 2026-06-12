import { apiClient } from './client';

export type ProtestStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface Protest {
  id: string;
  combatId: string;
  filedBy: string;
  filedAt: string;
  reason: string;
  status: ProtestStatus;
  decision: string | null;
  decidedAt: string | null;
  combat: {
    combatNumber: number;
    roundType: string;
    redAthlete: { athlete: { firstName: string; lastName: string } } | null;
    blueAthlete: { athlete: { firstName: string; lastName: string } } | null;
  };
  filedByUser: { firstName: string; lastName: string };
}

export const PROTEST_STATUS_LABELS: Record<ProtestStatus, string> = {
  PENDING: 'Pendente',
  UNDER_REVIEW: 'Em análise',
  ACCEPTED: 'Aceite',
  REJECTED: 'Rejeitado',
};

export const protestsApi = {
  list: (tournamentId: string) =>
    apiClient.get<Protest[]>(`/tournaments/${tournamentId}/protests`).then(r => r.data),

  file: (combatId: string, reason: string) =>
    apiClient.post<Protest>(`/combats/${combatId}/protests`, { reason }).then(r => r.data),

  resolve: (protestId: string, status: 'ACCEPTED' | 'REJECTED', decision: string) =>
    apiClient.patch<Protest>(`/protests/${protestId}`, { status, decision }).then(r => r.data),
};
