export interface Participant {
  id: string;
  name: string;
  seed: number;
  eloRating: number;
  skillLevel: string;
  province?: string;
  district?: string;
  totalMatches?: number;
  lastMatchDate?: Date | null;
  teamId?: string;
  player1?: {
    id: string;
    name: string;
    eloRating: number;
    skillLevel: string;
    province?: string;
    district?: string;
    totalMatches?: number;
    lastMatchDate?: Date | null;
  };
  player2?: {
    id: string;
    name: string;
    eloRating: number;
    skillLevel: string;
    province?: string;
    district?: string;
    totalMatches?: number;
    lastMatchDate?: Date | null;
  };
}

export interface Match {
  matchNumber: number;
  player1Name: string;
  player2Name: string;
  player1Id?: string;
  player2Id?: string;
  position?: string;
}

export interface Round {
  roundNumber: number;
  roundName: string;
  matches: Match[];
}

export interface BracketData {
  rounds: Round[];
  totalRounds: number;
  participants: Participant[];
}

export interface TournamentBracket {
  id: string;
  tournamentId: string;
  name: string;
  eventType: 'singles' | 'doubles';
  skillLevelMin: number;
  skillLevelMax: number;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'hybrid';
  maxParticipants: number;
  participants: Participant[];
  bracketData: BracketData;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}