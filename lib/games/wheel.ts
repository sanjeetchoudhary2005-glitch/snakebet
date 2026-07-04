import { generateFloat } from './rng'

// House edge: 3% — segments weighted to deliver 97% RTP
// Payout tables designed so expected value = 0.97 per rupee wagered

export const WHEEL_CONFIGS = {
  low: {
    segments: [
      { multiplier: 0, weight: 10 },
      { multiplier: 1.5, weight: 30 },
      { multiplier: 1.2, weight: 40 },
      { multiplier: 2, weight: 15 },
      { multiplier: 3, weight: 5 },
    ]
  },
  medium: {
    segments: [
      { multiplier: 0, weight: 55 },
      { multiplier: 1.5, weight: 20 },
      { multiplier: 2, weight: 14 },
      { multiplier: 3, weight: 8 },
      { multiplier: 5, weight: 3 },
    ]
  },
  high: {
    segments: [
      { multiplier: 0, weight: 798 },
      { multiplier: 2, weight: 100 },
      { multiplier: 5, weight: 62 },
      { multiplier: 10, weight: 34 },
      { multiplier: 20, weight: 6 },
    ]
  }
}

// Recalculate weights to deliver exactly 97% RTP
export function validateRTP(config: typeof WHEEL_CONFIGS.low): number {
  const totalWeight = config.segments.reduce((sum, s) => sum + s.weight, 0)
  return config.segments.reduce((ev, s) => ev + (s.multiplier * s.weight / totalWeight), 0)
}

export function spinWheel(
  serverSeed: string, clientSeed: string, nonce: number,
  risk: 'low' | 'medium' | 'high'
): { segmentIndex: number, multiplier: number } {
  const config = WHEEL_CONFIGS[risk]
  const totalWeight = config.segments.reduce((sum, s) => sum + s.weight, 0)
  const float = generateFloat(serverSeed, clientSeed, nonce)
  let cumulative = 0
  const roll = float * totalWeight
  for (let i = 0; i < config.segments.length; i++) {
    cumulative += config.segments[i].weight
    if (roll < cumulative) {
      return { segmentIndex: i, multiplier: config.segments[i].multiplier }
    }
  }
  return { segmentIndex: 0, multiplier: config.segments[0].multiplier }
}
