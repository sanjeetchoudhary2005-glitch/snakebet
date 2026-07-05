import React from 'react';

export interface GameModule {
  id: string;
  name: string;
  category: 'crash' | 'dice' | 'plinko' | 'mines' | 'slots' | 'table' | 'other' | 'roulette' | 'blackjack' | 'sports' | 'ludo' | 'coinflip' | 'wheel' | 'hilo' | 'keno' | 'dragontower';
  minBet: number;
  maxBet: number;
  rtp: number;
  thumbnailUrl: string;
  players: number;
  renderComponent: React.FC<GameProps> | null;
  resolveRound: (seed: string, input: any) => GameResult;
  trending?: boolean;
  new?: boolean;
  playable?: boolean;
  comingSoon?: boolean;
}

export interface GameProps {
  gameId: string;
  onBet: (betAmount: number, input: any) => void;
  onCashOut: () => void;
  isPlaying: boolean;
  currentMultiplier?: number;
  gameState?: any;
  userBalance: number;
}

export interface GameResult {
  win: boolean;
  amount: number;
  multiplier?: number;
  metadata: any;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface GameCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}
