
/**
 * Provably Fair Utilities for Snakebet Gaming Platform
 * Uses commit-reveal HMAC_SHA256 scheme for crash point generation
 */

import crypto from 'crypto';

export function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

// Generate deterministic mine positions from seed
export function placeMines(serverSeed: string, clientSeed: string, nonce: number, mineCount: number): number[] {
  const positions: number[] = [];
  let index = 0;
  
  while (positions.length < mineCount) {
    const hmac = crypto.createHmac('sha256', serverSeed)
      .update(`${clientSeed}:${nonce}:${index}`)
      .digest('hex');
    
    const pos = parseInt(hmac.substring(0, 8), 16) % 25;
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
    index++;
  }
  
  return positions.sort((a, b) => a - b);
}

export function calculateMultiplier(revealed: number, mines: number): number {
  if (revealed === 0) return 1;
  
  let prob = 1;
  for (let i = 0; i < revealed; i++) {
    prob *= (25 - mines - i) / (25 - i);
  }
  
  return Math.round((1 / prob) * 0.99 * 100) / 100;
}

// Generate crash point using HMAC-SHA256 commit-reveal scheme
export function generateCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): number {
  const data = `${clientSeed}:${nonce}`;
  const hmac = crypto.createHmac('sha256', serverSeed).update(data).digest();

  // Take first 4 bytes for calculation
  const hex = hmac.toString('hex').substring(0, 8);
  const n = parseInt(hex, 16);
  const e = 2 ** 52;

  // 1/101 chance to crash at 1.00x (house edge)
  if (n % 101 === 0) {
    return 1.00;
  }

  // Otherwise, standard crash distribution
  const h = n % e;
  const crash = Math.floor((100 * e - h) / (e - h)) / 100;
  return crash;
}

// Verify crash point
export function verifyCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  crashPoint: number
): boolean {
  const computed = generateCrashPoint(serverSeed, clientSeed, nonce);
  return Math.abs(computed - crashPoint) < 0.001;
}

export class ProvablyFair {
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly clientSeed: string;
  readonly nonce: number;

  constructor(serverSeed: string, clientSeed: string, nonce: number = 0) {
    this.serverSeed = serverSeed;
    this.serverSeedHash = hashSeed(serverSeed);
    this.clientSeed = clientSeed;
    this.nonce = nonce;
  }

  static generateServerSeed(): string {
    return generateSeed();
  }

  static hashServerSeed(serverSeed: string): string {
    return hashSeed(serverSeed);
  }

  static generateClientSeed(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  getPublicCommit(): { serverSeedHash: string; clientSeed: string; nonce: number } {
    return {
      serverSeedHash: this.serverSeedHash,
      clientSeed: this.clientSeed,
      nonce: this.nonce,
    };
  }
}

// Shared helper: returns a float in [0, 1), deterministic from the seed scheme
export function hmacRandom(serverSeed: string, clientSeed: string, nonce: number, cursor: number): number {
  const hmac = crypto.createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}:${cursor}`)
    .digest('hex');

  const value = parseInt(hmac.substring(0, 16), 16);
  return value / (2 ** 64);
}

// Fisher-Yates shuffle, deterministic using hmacRandom
export function shuffle<T>(array: T[], serverSeed: string, clientSeed: string, nonce: number): T[] {
  const arr = [...array];
  let cursor = 0;
  for (let i = arr.length - 1; i > 0; i--) {
    const r = hmacRandom(serverSeed, clientSeed, nonce, cursor);
    const j = Math.floor(r * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    cursor++;
  }
  return arr;
}

// Generate deterministic dice roll from seed (0-100)
export function rollDice(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = hmacRandom(serverSeed, clientSeed, nonce, 0);
  return Math.floor(r * 101);
}

// Generate precise deterministic dice roll from seed (0.00-100.00)
export function rollDicePrecise(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = hmacRandom(serverSeed, clientSeed, nonce, 0);
  return Math.floor(r * 10001) / 100;
}

// --- Plinko Helpers ---
const HOUSE_EDGE = 0.02;

const PLINKO_MULTIPLIERS: Record<number, Record<string, number[]>> = {
  8: {
    Low: [0.5, 1, 2, 3, 5, 3, 2, 1, 0.5],
    Medium: [0.3, 0.8, 1.5, 4, 8, 4, 1.5, 0.8, 0.3],
    High: [0.2, 0.5, 1.2, 6, 18, 6, 1.2, 0.5, 0.2]
  },
  12: {
    Low: [0.4, 0.8, 1.2, 2, 4, 8, 8, 4, 2, 1.2, 0.8, 0.4],
    Medium: [0.2, 0.5, 1, 3, 8, 20, 20, 8, 3, 1, 0.5, 0.2],
    High: [0.1, 0.3, 0.8, 2, 6, 30, 60, 30, 6, 2, 0.8, 0.3]
  },
  16: {
    Low: [0.3, 0.6, 1, 1.5, 3, 6, 12, 20, 20, 12, 6, 3, 1.5, 1, 0.6, 0.3],
    Medium: [0.15, 0.4, 0.8, 1.5, 4, 10, 25, 50, 50, 25, 10, 4, 1.5, 0.8, 0.4, 0.15],
    High: [0.05, 0.2, 0.5, 1.2, 3, 10, 25, 100, 200, 100, 25, 10, 3, 1.2, 0.5, 0.2, 0.05]
  }
};

export function generatePlinkoPath(serverSeed: string, clientSeed: string, nonce: number, rows: number): { path: number[], bucketIndex: number } {
  const path: number[] = [];
  for (let i = 0; i < rows; i++) {
    const r = hmacRandom(serverSeed, clientSeed, nonce, i);
    path.push(r < 0.5 ? 0 : 1);
  }
  const bucketIndex = path.reduce((sum, step) => sum + step, 0);
  return { path, bucketIndex };
}

export function getPlinkoMultiplier(rows: number, riskLevel: string, bucketIndex: number): number {
  const multipliers = PLINKO_MULTIPLIERS[rows as keyof typeof PLINKO_MULTIPLIERS]?.[riskLevel] || PLINKO_MULTIPLIERS[12].Medium;
  return multipliers[bucketIndex] * (1 - HOUSE_EDGE);
}

// --- Limbo Helpers ---
export function generateLimboResult(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = hmacRandom(serverSeed, clientSeed, nonce, 0);
  const result = Math.max(1.00, (1 - HOUSE_EDGE) / (1 - r));
  return Math.min(result, 1_000_000);
}

// --- Wheel Helpers ---
const WHEEL_SEGMENTS: Record<string, { multiplier: number; weight: number }[]> = {
  Low: [
    { multiplier: 0, weight: 30 },
    { multiplier: 1.5, weight: 40 },
    { multiplier: 3, weight: 20 },
    { multiplier: 10, weight: 9 },
    { multiplier: 50, weight: 1 }
  ],
  Medium: [
    { multiplier: 0, weight: 50 },
    { multiplier: 2, weight: 30 },
    { multiplier: 5, weight: 15 },
    { multiplier: 25, weight: 4 },
    { multiplier: 100, weight: 1 }
  ],
  High: [
    { multiplier: 0, weight: 70 },
    { multiplier: 3, weight: 20 },
    { multiplier: 10, weight: 8 },
    { multiplier: 100, weight: 1.5 },
    { multiplier: 500, weight: 0.5 }
  ]
};

export function selectWheelSegment(serverSeed: string, clientSeed: string, nonce: number, riskLevel: string): { index: number; multiplier: number } {
  const segments = WHEEL_SEGMENTS[riskLevel] || WHEEL_SEGMENTS.Low;
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  const r = hmacRandom(serverSeed, clientSeed, nonce, 0) * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < segments.length; i++) {
    cumulative += segments[i].weight;
    if (r <= cumulative) {
      return { index: i, multiplier: segments[i].multiplier * (1 - HOUSE_EDGE) };
    }
  }
  return { index: 0, multiplier: segments[0].multiplier * (1 - HOUSE_EDGE) };
}

// --- Keno Helpers ---
const KENO_PAYOUTS: Record<number, Record<number, number>> = {
  1: { 0: 0, 1: 2.5 },
  2: { 0: 0, 1: 0.5, 2: 6 },
  3: { 0: 0, 1: 0.5, 2: 2, 3: 25 },
  4: { 0: 0, 1: 0.5, 2: 1, 3: 5, 4: 50 },
  5: { 0: 0, 1: 0.5, 2: 1, 3: 4, 4: 20, 5: 100 },
  6: { 0: 0, 1: 0.5, 2: 1, 3: 3, 4: 10, 5: 50, 6: 200 },
  7: { 0: 0, 1: 0.5, 2: 0.8, 3: 2, 4: 8, 5: 25, 6: 100, 7: 400 },
  8: { 0: 0, 1: 0.5, 2: 0.8, 3: 1.5, 4: 5, 5: 20, 6: 80, 7: 300, 8: 1000 },
  9: { 0: 0, 1: 0.5, 2: 0.8, 3: 1.2, 4: 4, 5: 15, 6: 50, 7: 200, 8: 800, 9: 3000 },
  10: { 0: 0, 1: 0.5, 2: 0.8, 3: 1, 4: 3, 5: 10, 6: 30, 7: 100, 8: 500, 9: 2000, 10: 10000 }
};

export function generateKenoDraw(serverSeed: string, clientSeed: string, nonce: number): number[] {
  const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
  const shuffled = shuffle(numbers, serverSeed, clientSeed, nonce);
  return shuffled.slice(0, 10);
}

export function getKenoMultiplier(pickedCount: number, matchCount: number): number {
  return (KENO_PAYOUTS[pickedCount]?.[matchCount] || 0) * (1 - HOUSE_EDGE);
}

// --- HiLo Helpers ---
export type BlackjackCard = { suit: "hearts" | "diamonds" | "clubs" | "spades", rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" };

const BJ_RANKS: BlackjackCard["rank"][] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const BJ_SUITS: BlackjackCard["suit"][] = ["hearts", "diamonds", "clubs", "spades"];

export function createBlackjackDeck(): BlackjackCard[] {
  const deck: BlackjackCard[] = [];
  for (let i = 0; i < 6; i++) {
    for (const suit of BJ_SUITS) {
      for (const rank of BJ_RANKS) {
        deck.push({ suit, rank });
      }
    }
  }
  return deck;
}

export function shuffleBlackjackDeck(serverSeed: string, clientSeed: string, nonce: number): BlackjackCard[] {
  return shuffle(createBlackjackDeck(), serverSeed, clientSeed, nonce);
}

export function calculateBlackjackScore(cards: BlackjackCard[]): number {
  let score = 0;
  let aces = 0;
  cards.forEach(card => {
    if (["J", "Q", "K"].includes(card.rank)) {
      score += 10;
    } else if (card.rank === "A") {
      score += 11;
      aces += 1;
    } else {
      score += parseInt(card.rank);
    }
  });
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

export function shouldDealerHit(score: number): boolean {
  return score < 17;
}

export function calculateBlackjackPayout(playerScore: number, dealerScore: number, playerHasBlackjack: boolean, dealerHasBlackjack: boolean): number {
  if (playerHasBlackjack && dealerHasBlackjack) return 1;
  if (playerHasBlackjack) return 2.5;
  if (dealerHasBlackjack) return 0;
  if (playerScore > 21) return 0;
  if (dealerScore > 21) return 2;
  if (playerScore > dealerScore) return 2;
  if (dealerScore > playerScore) return 0;
  return 1;
}

// --- Dragon Tower Helpers ---
const DRAGON_TOWER_LAYOUT: Record<string, { tiles: number; traps: number }[]> = {
  Easy: Array(9).fill({ tiles: 4, traps: 1 }),
  Medium: Array(9).fill({ tiles: 3, traps: 1 }),
  Hard: Array(9).fill({ tiles: 2, traps: 1 }),
  Expert: Array(9).fill({ tiles: 4, traps: 3 })
};

export function generateDragonTowerLayout(serverSeed: string, clientSeed: string, nonce: number, difficulty: string): { level: number; trapPositions: number[] }[] {
  const layout = DRAGON_TOWER_LAYOUT[difficulty] || DRAGON_TOWER_LAYOUT.Medium;
  const levels: { level: number; trapPositions: number[] }[] = [];
  let cursor = 0;

  for (let i = 0; i < layout.length; i++) {
    const { tiles, traps } = layout[i];
    const trapPositions: number[] = [];

    while (trapPositions.length < traps) {
      const r = hmacRandom(serverSeed, clientSeed, nonce, cursor);
      const pos = Math.floor(r * tiles);
      if (!trapPositions.includes(pos)) {
        trapPositions.push(pos);
      }
      cursor++;
    }
    levels.push({ level: i, trapPositions: trapPositions.sort((a, b) => a - b) });
  }
  return levels;
}

export function getDragonTowerMultiplier(difficulty: string, currentLevel: number): number {
  const layout = DRAGON_TOWER_LAYOUT[difficulty] || DRAGON_TOWER_LAYOUT.Medium;
  let multiplier = 1;
  for (let i = 0; i < currentLevel; i++) {
    const { tiles, traps } = layout[i];
    const safe = tiles - traps;
    multiplier *= (tiles / safe) * (1 - HOUSE_EDGE);
  }
  return Math.round(multiplier * 100) / 100;
}

// --- Coin Flip Helpers ---
export function flipCoin(serverSeed: string, clientSeed: string, nonce: number): "heads" | "tails" {
  const r = hmacRandom(serverSeed, clientSeed, nonce, 0);
  return r < 0.5 ? "heads" : "tails";
}

// --- Roulette Helpers ---
const ROULETTE_POCKETS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
  11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
  22, 18, 29, 7, 28, 12, 35, 3, 26
];
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function spinRoulette(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = hmacRandom(serverSeed, clientSeed, nonce, 0);
  const index = Math.floor(r * 37);
  return ROULETTE_POCKETS[index];
}

export function calculateRoulettePayout(bets: Array<{ type: string, value?: number, amount: number }>, result: number): number {
  let total = 0;
  bets.forEach(bet => {
    switch (bet.type) {
      case "red":
        if (RED_NUMBERS.includes(result)) total += bet.amount * 2;
        break;
      case "black":
        if (!RED_NUMBERS.includes(result) && result !== 0) total += bet.amount * 2;
        break;
      case "odd":
        if (result !== 0 && result % 2 === 1) total += bet.amount * 2;
        break;
      case "even":
        if (result !== 0 && result % 2 === 0) total += bet.amount * 2;
        break;
      case "number":
        if (bet.value === result) total += bet.amount * 36;
        break;
    }
  });
  return total;
}

// --- Slots Helpers ---
import { findClusters, RNGSequence } from './odds-engine';

const SLOT_SYMBOLS = [
  { symbol: '7', weight: 5, payout: 20 },
  { symbol: 'BAR', weight: 8, payout: 10 },
  { symbol: 'BELL', weight: 10, payout: 8 },
  { symbol: 'CHERRY', weight: 15, payout: 5 },
  { symbol: 'LEMON', weight: 20, payout: 3 },
  { symbol: 'SCATTER', weight: 2, payout: 50 }
];

function getWeightedSymbol(rng: RNGSequence): string {
  const rand = rng.next();
  let total = 0;
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  for (const s of SLOT_SYMBOLS) {
    total += s.weight / totalWeight;
    if (rand <= total) return s.symbol;
  }
  return SLOT_SYMBOLS[0].symbol;
}

function generateSlotGrid(rng: RNGSequence, rows: number = 5, cols: number = 4): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(getWeightedSymbol(rng));
    }
    grid.push(row);
  }
  return grid;
}

function getSymbolPayout(symbol: string): number {
  const s = SLOT_SYMBOLS.find(s => s.symbol === symbol);
  return s ? s.payout : 0;
}

interface TumbleResult {
  grid: string[][];
  clusters: any[];
  tumbleWin: number;
}

function tumbleOnce(grid: string[][], rng: RNGSequence): TumbleResult {
  const clusters = findClusters(grid, 5);
  let tumbleWin = 0;
  clusters.forEach(cluster => {
    tumbleWin += getSymbolPayout(cluster.symbols) * cluster.size;
  });

  const toClear = new Set<string>();
  clusters.forEach(cluster => {
    cluster.positions.forEach((p: any) => toClear.add(`${p.row},${p.col}`));
  });

  const newGrid: string[][] = [];
  for (let r = 0; r < grid.length; r++) newGrid.push(new Array(grid[0].length).fill(''));

  for (let c = 0; c < grid[0].length; c++) {
    let writeRow = grid.length - 1;
    for (let r = grid.length - 1; r >= 0; r--) {
      if (!toClear.has(`${r},${c}`)) {
        newGrid[writeRow][c] = grid[r][c];
        writeRow--;
      }
    }
    for (let r = writeRow; r >= 0; r--) {
      newGrid[r][c] = getWeightedSymbol(rng);
    }
  }
  return { grid: newGrid, clusters, tumbleWin };
}

export function runSlotsSpin(serverSeed: string, clientSeed: string, nonce: number, betAmount: number) {
  const rng = new RNGSequence(serverSeed, clientSeed, nonce);
  const tumbleSequence: TumbleResult[] = [];
  let totalWin = 0;
  let currentMultiplier = 1;
  let currentGrid = generateSlotGrid(rng);
  let hasMoreClusters = true;

  while (hasMoreClusters) {
    const tumble = tumbleOnce(currentGrid, rng);
    tumbleSequence.push(tumble);
    if (tumble.clusters.length > 0) {
      totalWin += tumble.tumbleWin * currentMultiplier;
      currentMultiplier++;
      currentGrid = tumble.grid;
    } else {
      hasMoreClusters = false;
    }
  }

  return {
    tumbleSequence,
    totalWin: totalWin * (1 - HOUSE_EDGE),
    tumbleCount: tumbleSequence.length - 1,
    finalMultiplier: currentMultiplier - 1
  };
}

export default ProvablyFair;
