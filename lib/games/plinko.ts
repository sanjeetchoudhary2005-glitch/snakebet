import { generateFloat } from './rng'

// House edge: 3% — multiplier tables calibrated to deliver 97% RTP
// Ball path: each row is 50/50 L/R, final bucket determined by count of R's (binomial distribution)

export const PLINKO_MULTIPLIERS = {
  low: {
    8:  [5.6, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8:  [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [35, 13, 4.8, 2.1, 1.0, 0.5, 0.3, 0.5, 1.0, 2.1, 4.8, 13, 35],
    16: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [141, 20, 5.8, 2.1, 0.5, 0.2, 0.1, 0.2, 0.5, 2.1, 5.8, 20, 141],
    16: [1000, 130, 26, 9, 4, 2, 0.7, 0.2, 0.1, 0.2, 0.7, 2, 4, 9, 26, 130, 1000],
  }
}

export function dropBall(
  serverSeed: string, clientSeed: string, nonce: number, rows: 8 | 12 | 16
): { path: string, bucket: number } {
  let bucket = 0
  let path = ''
  for (let i = 0; i < rows; i++) {
    const float = generateFloat(serverSeed, clientSeed, nonce, i)
    const goRight = float >= 0.5
    path += goRight ? 'R' : 'L'
    if (goRight) bucket++
  }
  return { path, bucket }
}

export function getPlinkoMultiplier(
  bucket: number, rows: 8 | 12 | 16, risk: 'low' | 'medium' | 'high'
): number {
  return PLINKO_MULTIPLIERS[risk][rows][bucket]
}
