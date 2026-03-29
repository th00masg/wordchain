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

export const THEMES = [
  { id: "free", label: "Fritt", emoji: "🌈", description: "Alle ord er lov!" },
  { id: "animals", label: "Dyr", emoji: "🦁", description: "Dyr, insekter, fugler, fisk..." },
  { id: "food", label: "Mat", emoji: "🍕", description: "Mat, drikke, frukt, grønnsaker..." },
  { id: "nature", label: "Natur", emoji: "🌲", description: "Natur, vær, planter, landskap..." },
  { id: "body", label: "Kropp", emoji: "🫀", description: "Kroppen, helse, følelser..." },
  { id: "sports", label: "Sport", emoji: "⚽", description: "Sport, spill, aktiviteter..." },
  { id: "home", label: "Hjemme", emoji: "🏠", description: "Ting du finner hjemme..." },
  { id: "school", label: "Skole", emoji: "📚", description: "Skole, fag, ting i klasserommet..." },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

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
  theme: ThemeId;
}
