import { generateFloat } from './rng'

// House edge: 2% — pays 1.96x on win (fair would be 2x)
export const COINFLIP_MULTIPLIER = 1.96

export function flipCoin(serverSeed: string, clientSeed: string, nonce: number): 'heads' | 'tails' {
  const float = generateFloat(serverSeed, clientSeed, nonce)
  return float < 0.5 ? 'heads' : 'tails'
}

export function calculateCoinflipPayout(betAmount: number, choice: string, result: string): number {
  return choice === result ? parseFloat((betAmount * COINFLIP_MULTIPLIER).toFixed(2)) : 0
}
