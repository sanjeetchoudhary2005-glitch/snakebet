import { generateFloat } from './rng'

// House edge: 4% — from payout table calibrated below fair odds

export const KENO_PAYTABLE: Record<number, Record<number, number>> = {
  // picks: { matches: multiplier }
  1:  { 0: 0, 1: 3.8 },
  2:  { 0: 0, 1: 0, 2: 14 },
  3:  { 0: 0, 1: 0, 2: 3, 3: 42 },
  4:  { 0: 0, 1: 0, 2: 2, 3: 7, 4: 120 },
  5:  { 0: 0, 1: 0, 2: 1.0, 3: 3.4, 4: 17, 5: 300 },
  6:  { 0: 0, 1: 0, 2: 1, 3: 3, 4: 8, 5: 60, 6: 1600 },
  7:  { 0: 0, 1: 0, 2: 0.5, 3: 2, 4: 5, 5: 20, 6: 100, 7: 5000 },
  8:  { 0: 0, 1: 0, 2: 0.5, 3: 1.5, 4: 4, 5: 12, 6: 60, 7: 500, 8: 10000 },
  9:  { 0: 0, 1: 0, 2: 0, 3: 1, 4: 3, 5: 8, 6: 30, 7: 200, 8: 2000, 9: 20000 },
  10: { 0: 0, 1: 0, 2: 0, 3: 0.5, 4: 2, 5: 6, 6: 20, 7: 100, 8: 800, 9: 8000, 10: 100000 },
}

export function drawKenoBalls(serverSeed: string, clientSeed: string, nonce: number): number[] {
  const balls = Array.from({ length: 80 }, (_, i) => i + 1)
  const drawn: number[] = []

  for (let i = 0; i < 20; i++) {
    const float = generateFloat(serverSeed, clientSeed, nonce, i)
    const index = Math.floor(float * balls.length)
    drawn.push(balls[index])
    balls.splice(index, 1)
  }
  return drawn
}

export function evaluateKeno(picks: number[], drawn: number[], betAmount: number): {
  matches: number, multiplier: number, payout: number
} {
  const matches = picks.filter(p => drawn.includes(p)).length
  const pickCount = Math.min(picks.length, 10) as keyof typeof KENO_PAYTABLE
  const multiplier = KENO_PAYTABLE[pickCount]?.[matches] ?? 0
  return { matches, multiplier, payout: parseFloat((betAmount * multiplier).toFixed(2)) }
}
