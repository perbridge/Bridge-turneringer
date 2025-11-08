export interface Result {
  boardNumber: number;
  pairNS: number;
  pairEW: number;
  contract: string;
  declarer: 'N' | 'S' | 'E' | 'W';
  isDoubled: boolean;
  isRedoubled: boolean;
  tricks: number;
  scoreNS: number;
  matchpointsNS: number;
  matchpointsEW: number;
}

export interface PairAssignment {
  table: number;
  ns: number;
  ew: number;
  boards: number[];
}

export interface Round {
  roundNumber: number;
  assignments: PairAssignment[];
}

export interface Schedule {
  rounds: Round[];
}

export type TournamentStatus = 'setup' | 'running' | 'completed';

export interface Pair {
  pairNumber: number;
  player1: string;
  player2: string;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  numTables: number;
  status: TournamentStatus;
  schedule: Schedule | null;
  results: Result[];
  pairs: Pair[];
}

export interface Standing {
  pair: number;
  playerNames: string;
  totalMatchpoints: number;
  percentage: number;
}
