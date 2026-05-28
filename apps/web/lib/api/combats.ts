import { apiClient } from './client';

export type CombatStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED' | 'POSTPONED';
export type PointType = 'PUNCH_BODY' | 'KICK_BODY' | 'KICK_HEAD' | 'SPIN_KICK_BODY' | 'SPIN_KICK_HEAD' | 'PENALTY';

export interface CombatPoint {
  id: string;
  athleteId: string;
  pointType: PointType;
  pointValue: number;
  roundNumber: number;
  timestamp: string;
}

export interface CombatAthlete {
  id: string;
  athlete: { id: string; firstName: string; lastName: string };
  club?: { id: string; name: string };
}

export interface Combat {
  id: string;
  tournamentId: string;
  categoryId: string;
  combatNumber: number;
  roundType: string;
  round: number;
  status: CombatStatus;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  winnerId: string | null;
  redScore: number;
  blueScore: number;
  scheduledTime: string | null;
  startTime: string | null;
  endTime: string | null;
  area: { id: string; name: string } | null;
  category: any;
  redAthlete: CombatAthlete | null;
  blueAthlete: CombatAthlete | null;
  points: CombatPoint[];
}

export const combatsApi = {
  get: (id: string) =>
    apiClient.get<Combat>(`/combats/${id}`).then(r => r.data),

  updateStatus: (id: string, status: CombatStatus, winnerId?: string) =>
    apiClient.patch<Combat>(`/combats/${id}/status`, { status, winnerId }).then(r => r.data),

  addPoint: (id: string, data: { athleteId: string; pointType: PointType; roundNumber: number }) =>
    apiClient.post<Combat>(`/combats/${id}/points`, data).then(r => r.data),

  removePoint: (id: string, pointId: string) =>
    apiClient.delete<Combat>(`/combats/${id}/points/${pointId}`).then(r => r.data),
};

export const POINT_LABELS: Record<PointType, string> = {
  PUNCH_BODY: 'Soco Corpo (+1)',
  KICK_BODY: 'Pontapé Corpo (+2)',
  KICK_HEAD: 'Pontapé Cabeça (+3)',
  SPIN_KICK_BODY: 'Giro Corpo (+4)',
  SPIN_KICK_HEAD: 'Giro Cabeça (+5)',
  PENALTY: 'Penalidade (-1)',
};

export const POINT_VALUES: Record<PointType, number> = {
  PUNCH_BODY: 1, KICK_BODY: 2, KICK_HEAD: 3,
  SPIN_KICK_BODY: 4, SPIN_KICK_HEAD: 5, PENALTY: 1,
};
