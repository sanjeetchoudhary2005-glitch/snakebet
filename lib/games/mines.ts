import { generateFloat } from './rng'

// House edge: 3% — multiplier table based on grid size and mines count
// Each reveal increases multiplier; final payout = betAmount * currentMultiplier
// Multipliers calibrated so expected value across all possible paths = 0.97x bet

export function generateMinePositions(
  serverSeed: string, clientSeed: string, nonce: number,
  mineCount: number, gridSize: number = 25
): number[] {
  const positions: number[] = []
  const available = Array.from({ length: gridSize }, (_, i) => i)

  for (let i = 0; i < mineCount; i++) {
    const float = generateFloat(serverSeed, clientSeed, nonce, i)
    const index = Math.floor(float * available.length)
    positions.push(available[index])
    available.splice(index, 1)
  }
  return positions
}

export function getMinesMultiplier(
  revealed: number, mineCount: number, gridSize: number = 25
): number {
  if (revealed === 0) return 1.0;
  // Hypergeometric probability calculation for provably fair multiplier
  // P(safe at step k) = (gridSize - mineCount - k + 1) / (gridSize - k + 1)
  let probability = 1
  const safeSquares = gridSize - mineCount

  for (let i = 0; i < revealed; i++) {
    probability *= (safeSquares - i) / (gridSize - i)
  }

  // 3% house edge applied to fair multiplier
  const fairMultiplier = 1 / probability
  return parseFloat((fairMultiplier * 0.97).toFixed(4))
}
