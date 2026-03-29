export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  alive: boolean;
  score: number;
}

export interface ChainWord {
  word: string;
  playerId: string;
  playerName: string;
}

export interface Game {
  code: string;
  hostId: string;
  players: Player[];
  state: "waiting" | "playing" | "finished";
  chain: ChainWord[];
  usedWords: string[];
  currentTurnPlayerId: string | null;
  turnDeadline: number | null;
  turnTime: number; // seconds per turn
  eliminationReason: string | null;
  winnerName: string | null;
}
