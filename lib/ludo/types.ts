export type PlayerColor = 'red' | 'yellow' | 'green' | 'blue';

export interface Token {
  id: number;
  position: number;
}

export interface Player {
  id: string;
  color: PlayerColor;
  tokens: Token[];
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  consecutiveSixes: number;
  isGameOver: boolean;
  winnerId: string | null;
}

export const HOME_STRETCH_START: Record<PlayerColor, number> = {
  red: 1,
  yellow: 14,
  green: 27,
  blue: 40,
};

export const STAR_CELLS = [5, 12, 18, 25, 31, 38, 44, 51];
