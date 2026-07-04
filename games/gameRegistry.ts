
import { GameModule } from '@/lib/gameTypes';

// Register all games here
export const gameRegistry: GameModule[] = [
  {
    id: 'ludo',
    name: '🎲 Ludo',
    category: 'ludo',
    minBet: 50,
    maxBet: 100000,
    rtp: 95,
    thumbnailUrl: '/games/ludo/thumbnails/main-thumbnail.svg',
    players: 1234,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount: 0, multiplier: 1.9, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'mines',
    name: '💎 Mines Pro',
    category: 'mines',
    minBet: 10,
    maxBet: 100000,
    rtp: 97.5,
    thumbnailUrl: '/images/games/thumbnails/mines.jpg',
    players: 4567,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true
  },
  {
    id: 'crash',
    name: '🚀 Crash',
    category: 'crash',
    minBet: 10,
    maxBet: 100000,
    rtp: 97,
    thumbnailUrl: '',
    players: 5234,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true
  },
  {
    id: 'plinko',
    name: '🎱 Plinko',
    category: 'plinko',
    minBet: 10,
    maxBet: 50000,
    rtp: 97,
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    players: 3456,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'dice',
    name: '🎲 Dice',
    category: 'dice',
    minBet: 10,
    maxBet: 100000,
    rtp: 97,
    thumbnailUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=600&q=80',
    players: 4123,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true
  },
  {
    id: 'coinflip',
    name: '🪙 Coin Flip',
    category: 'coinflip',
    minBet: 10,
    maxBet: 50000,
    rtp: 98,
    thumbnailUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
    players: 2890,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'wheel',
    name: '🎡 Wheel',
    category: 'wheel',
    minBet: 10,
    maxBet: 50000,
    rtp: 97,
    thumbnailUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=600&q=80',
    players: 3120,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'hilo',
    name: '🎴 HiLo',
    category: 'hilo',
    minBet: 10,
    maxBet: 50000,
    rtp: 97.5,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
    players: 2650,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'andar-bahar',
    name: 'Andar Bahar',
    category: 'table',
    minBet: 10,
    maxBet: 50000,
    rtp: 98,
    thumbnailUrl: '/images/games/thumbnails/andar-bahar.jpg',
    players: 3180,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount: 0, multiplier: 1.86, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'baccarat',
    name: 'Baccarat',
    category: 'table',
    minBet: 50,
    maxBet: 100000,
    rtp: 98.9,
    thumbnailUrl: '/images/games/thumbnails/baccarat.jpg',
    players: 2140,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount: 0, multiplier: 1.95, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'teen-patti',
    name: 'Teen Patti',
    category: 'table',
    minBet: 10,
    maxBet: 50000,
    rtp: 96,
    thumbnailUrl: '/images/games/thumbnails/teen-patti.jpg',
    players: 3860,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount: 0, multiplier: 1.7, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true
  },
  {
    id: 'keno',
    name: '🎯 Keno',
    category: 'keno',
    minBet: 10,
    maxBet: 50000,
    rtp: 96,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
    players: 2400,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true,
  },
  {
    id: 'dragontower',
    name: '🐉 Dragon Tower',
    category: 'dragontower',
    minBet: 10,
    maxBet: 50000,
    rtp: 97,
    thumbnailUrl: '/images/games/thumbnails/dragontower.jpg',
    players: 2200,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true,
  },
  {
    id: 'dragontiger',
    name: '🐉 Dragon Tiger',
    category: 'table',
    minBet: 10,
    maxBet: 50000,
    rtp: 96.2,
    thumbnailUrl: '/images/games/thumbnails/dragon-tiger.jpg',
    players: 2450,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount: 0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
    new: true,
  },
  {
    id: 'roulette',
    name: '🎰 Roulette',
    category: 'roulette',
    minBet: 10,
    maxBet: 100000,
    rtp: 97.3,
    thumbnailUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80',
    players: 4000,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
  },
  {
    id: 'blackjack',
    name: '🃏 Blackjack',
    category: 'blackjack',
    minBet: 50,
    maxBet: 100000,
    rtp: 99.5,
    thumbnailUrl: '/images/games/thumbnails/blackjack.jpg',
    players: 3800,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
  },
  {
    id: 'slots',
    name: '🎰 Slots',
    category: 'slots',
    minBet: 10,
    maxBet: 50000,
    rtp: 96.5,
    thumbnailUrl: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&w=600&q=80',
    players: 3500,
    renderComponent: null,
    resolveRound: () => ({
      win: false, amount:0, multiplier: 2.0, metadata: {}, serverSeed: '', clientSeed: '', nonce: 0
    }),
    trending: true,
  },
];

export function getGameById(id: string): GameModule | undefined {
  return gameRegistry.find(game => game.id === id);
}

export function getGamesByCategory(category: string): GameModule[] {
  return gameRegistry.filter(game => game.category === category);
}

export function getTrendingGames(limit = 10): GameModule[] {
  return [...gameRegistry]
    .sort((a, b) => b.players - a.players)
    .slice(0, limit);
}
