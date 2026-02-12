export type TournamentStatus = "live" | "upcoming";

export interface Player {
  id: string;
  name: string;
  chipCount: number;
  tableId: string;
  seatNumber: number;
}

export interface Seat {
  position: number;
  player: Player | null;
}

export interface PokerTable {
  id: string;
  number: number;
  seats: Seat[];
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number; // minutes
  isBreak?: boolean;
}

export interface PrizepoolEntry {
  place: string;
  amount: number;
  percentage: number;
}

export interface Prizepool {
  guaranteed: number;
  totalEntries: number;
  totalPool: number;
  placesPaid: number;
  breakdown: PrizepoolEntry[];
}

export interface RedrawAssignment {
  playerId: string;
  playerName: string;
  fromTable: number;
  fromSeat: number;
  toTable: number;
  toSeat: number;
}

export interface PaidOutPlayer {
  place: number;
  placeLabel: string;
  playerName: string;
  amount: number;
}

export interface Tournament {
  id: string;
  name: string;
  buyIn: number;
  status: TournamentStatus;
  tables: PokerTable[];
  blindStructure: BlindLevel[];
  prizepool: Prizepool;
  lateRegEndLevel: number;
  currentLevel: number;
  clockRunning: boolean;
  clockTimeRemaining: number; // seconds remaining in current level
  handsPerTable: number;
  startingChips: number;
  gameType: string;
  pendingRedraw?: RedrawAssignment[];
  paidOutPlayers?: PaidOutPlayer[];
}

export type NotificationType = "redraw" | "level" | "registration" | "action" | "alert";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  tournamentId: string;
}

export interface TournamentState {
  tournaments: Tournament[];
  selectedTournamentId: string;
  notifications: Notification[];
}
