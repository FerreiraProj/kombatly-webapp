export type TournamentStatus = 'DRAFT' | 'PRIVATE' | 'PUBLIC' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
export type DrawType = 'RANDOM' | 'RANKING';
export type AthletesVisible = 'NONE' | 'REGISTERED' | 'ALL';
export type CombatStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED' | 'POSTPONED';
export type RoundType = 'ROUND_OF_64' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | 'REPECHAGE' | 'BRONZE';

export interface TournamentSummary {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  registrationDeadline: string;
  numAreas: number;
  status: TournamentStatus;
  flyerUrl?: string;
  totalAthletes: number;
  totalCategories: number;
}

export interface TournamentDetail extends TournamentSummary {
  description?: string;
  startTime: string;
  endDate?: string;
  drawType: DrawType;
  numRounds: number;
  hasVestLimitation: boolean;
  vestQtyType1?: number;
  vestQtyType2?: number;
  vestQtyType3?: number;
  vestQtyType4?: number;
  athletesVisible: AthletesVisible;
  drawVisible: boolean;
  areasVisible: boolean;
  sponsorLogos?: string[];
  bracketsGenerated: boolean;
  promoter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTournamentDto {
  name: string;
  description?: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  registrationDeadline: string;
  numAreas: number;
  drawType: DrawType;
  numRounds?: number;
  hasVestLimitation?: boolean;
  vestQtyType1?: number;
  vestQtyType2?: number;
  vestQtyType3?: number;
  vestQtyType4?: number;
  athletesVisible?: AthletesVisible;
  drawVisible?: boolean;
  areasVisible?: boolean;
  categoryIds?: string[];
}

export interface TournamentCategory {
  id: string;
  vestType: number;
  isCustom: boolean;
  customName?: string;
  grade?: { id: string; nameEn: string; namePt: string };
  gender?: { id: string; code: string; nameEn: string };
  weightCategory?: {
    id: string;
    strWeight: string;
    displayNameEn: string;
    displayNamePt: string;
    vestType: number;
  };
  avgCombatDuration: number;
  totalAthletes?: number;
}

export interface BracketCombat {
  id: string;
  combatNumber: number;
  roundNumber: number;
  roundType: RoundType;
  bracketPosition?: number;
  status: CombatStatus;
  scheduledTime?: string;
  redScore: number;
  blueScore: number;
  redAthlete?: { id: string; athleteId: string; athleteName: string; clubName?: string } | null;
  blueAthlete?: { id: string; athleteId: string; athleteName: string; clubName?: string } | null;
  winner?: { id: string; athleteId: string; athleteName: string } | null;
}
