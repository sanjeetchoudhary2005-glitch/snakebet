import { generateFloat } from './rng'

// House edge: 3% — payout multiplier slightly below fair odds
// Fair odds for rolling under X% = 100/X
// Snakebet pays: (100/X) * 0.97 — this is the 3% house edge

export function rollDice(serverSeed: string, clientSeed: string, nonce: number): number {
  const float = generateFloat(serverSeed, clientSeed, nonce)
  return parseFloat((float * 100).toFixed(2)) // 0.00 to 99.99
}

export function calculateDicePayout(betAmount: number, target: number, direction: 'over' | 'under'): {
  multiplier: number, winChance: number, houseEdge: number
} {
  const winChance = direction === 'under' ? target : (100 - target)
  const fairMultiplier = 100 / winChance
  const multiplier = parseFloat((fairMultiplier * 0.97).toFixed(4)) // 3% house edge
  return { multiplier, winChance, houseEdge: 3 }
}

export function didWinDice(roll: number, target: number, direction: 'over' | 'under'): boolean {
  return direction === 'under' ? roll < target : roll > target
}
