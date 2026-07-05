import { generateInt } from './rng'

// House edge: 2.7% from single zero (European wheel — better than American double zero)
// All standard bets pay at fair-minus-zero odds, which creates exactly 2.7% house edge

export const ROULETTE_PAYOUTS: Record<string, number> = {
  straight: 35,    // Single number — 1/37 chance, pays 35:1 (fair would be 36:1)
  split: 17,       // 2 numbers
  street: 11,      // 3 numbers
  corner: 8,       // 4 numbers
  line: 5,         // 6 numbers
  column: 2,       // 12 numbers
  dozen: 2,        // 12 numbers
  red: 1, black: 1, // 18 numbers (18/37 = 48.6%)
  odd: 1, even: 1,
  low: 1, high: 1, // 1-18, 19-36
}

export const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
export const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]

export function spinRoulette(serverSeed: string, clientSeed: string, nonce: number): number {
  return generateInt(serverSeed, clientSeed, nonce, 0, 36)
}

export function evaluateBet(
  betType: string, betValue: any, result: number, betAmount: number
): { won: boolean, payout: number } {
  let won = false

  if (betType === 'straight') won = result === Number(betValue)
  else if (betType === 'red') won = RED_NUMBERS.includes(result)
  else if (betType === 'black') won = BLACK_NUMBERS.includes(result)
  else if (betType === 'odd') won = result !== 0 && result % 2 === 1
  else if (betType === 'even') won = result !== 0 && result % 2 === 0
  else if (betType === 'low') won = result >= 1 && result <= 18
  else if (betType === 'high') won = result >= 19 && result <= 36
  else if (betType === 'dozen') {
    const d = Number(betValue)
    won = (d === 1 && result >= 1 && result <= 12) ||
          (d === 2 && result >= 13 && result <= 24) ||
          (d === 3 && result >= 25 && result <= 36)
  }
  else if (betType === 'column') {
    const col = Number(betValue)
    won = result !== 0 && result % 3 === col % 3
  }
  else if (betType === 'split' && Array.isArray(betValue)) {
    won = betValue.includes(result)
  }

  const payout = won ? parseFloat((betAmount * (1 + ROULETTE_PAYOUTS[betType])).toFixed(2)) : 0
  return { won, payout }
}
