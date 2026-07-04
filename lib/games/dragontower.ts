import { generateFloat } from './rng'

// House edge: 3% — multipliers calibrated per level and difficulty
// Each level has N tiles, one is a dragon (loss), rest are safe

export const DRAGON_TOWER_CONFIG = {
  easy:   { tilesPerRow: 4, dragons: 1 }, // 75% chance per tile
  medium: { tilesPerRow: 3, dragons: 1 }, // 66.7% chance per tile
  hard:   { tilesPerRow: 2, dragons: 1 }, // 50% chance per tile
  expert: { tilesPerRow: 4, dragons: 3 }, // 25% chance per tile
}

export function getDragonTowerMultiplier(level: number, difficulty: keyof typeof DRAGON_TOWER_CONFIG): number {
  if (level === 0) return 1.0;
  const config = DRAGON_TOWER_CONFIG[difficulty]
  const safeTiles = config.tilesPerRow - config.dragons
  const winProbabilityPerLevel = safeTiles / config.tilesPerRow
  // Cumulative multiplier after `level` safe reveals, with 3% house edge
  const fairMultiplier = Math.pow(1 / winProbabilityPerLevel, level)
  return parseFloat((fairMultiplier * 0.97).toFixed(4))
}

export function generateDragonPositions(
  serverSeed: string, clientSeed: string, nonce: number,
  levels: number, difficulty: keyof typeof DRAGON_TOWER_CONFIG
): number[][] {
  const config = DRAGON_TOWER_CONFIG[difficulty]
  const grid: number[][] = []

  for (let level = 0; level < levels; level++) {
    const dragonPositions: number[] = []
    const available = Array.from({ length: config.tilesPerRow }, (_, i) => i)

    for (let d = 0; d < config.dragons; d++) {
      const float = generateFloat(serverSeed, clientSeed, nonce, level * 10 + d)
      const idx = Math.floor(float * available.length)
      dragonPositions.push(available[idx])
      available.splice(idx, 1)
    }
    grid.push(dragonPositions)
  }
  return grid
}
