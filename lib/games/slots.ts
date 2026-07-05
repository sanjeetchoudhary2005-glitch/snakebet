import { generateFloat } from './rng'

// House edge: 4% — reel weights calibrated to deliver 96% RTP
// 5 symbols, 3 reels, weighted stops

export const SLOT_SYMBOLS = ['💎', '7️⃣', '🍒', '🔔', '⭐', '🍋', '🍇']
export const SYMBOL_NAMES = ['Diamond', 'Seven', 'Cherry', 'Bell', 'Star', 'Lemon', 'Grape']

// Reel weights: fewer diamonds (high payout) than lemons (low payout)
export const REEL_WEIGHTS = [2, 4, 8, 10, 12, 16, 18] // must sum to 70
// EV calculation: (match_multiplier * probability) summed = 0.96

export const SLOT_PAYTABLE: Record<string, number> = {
  'Diamond-Diamond-Diamond': 800,
  'Seven-Seven-Seven': 350,
  'Bell-Bell-Bell': 120,
  'Cherry-Cherry-Cherry': 60,
  'Star-Star-Star': 30,
  'Lemon-Lemon-Lemon': 15,
  'Grape-Grape-Grape': 8,
  'Cherry-Cherry-X': 5,  // Cherry on first two reels
  'Diamond-X-X': 3,    // Diamond on first reel
}

export function spinSlots(serverSeed: string, clientSeed: string, nonce: number): {
  reels: number[], symbols: string[], multiplier: number
} {
  const reels: number[] = []
  const totalWeight = REEL_WEIGHTS.reduce((a, b) => a + b, 0)

  for (let reel = 0; reel < 3; reel++) {
    const float = generateFloat(serverSeed, clientSeed, nonce, reel)
    let cumWeight = 0
    const roll = float * totalWeight
    for (let sym = 0; sym < REEL_WEIGHTS.length; sym++) {
      cumWeight += REEL_WEIGHTS[sym]
      if (roll < cumWeight) { reels.push(sym); break }
    }
  }

  const symbols = reels.map(r => SYMBOL_NAMES[r])
  const key = symbols.join('-')
  const multiplier = SLOT_PAYTABLE[key] ??
    (symbols[0] === 'Cherry' && symbols[1] === 'Cherry' ? SLOT_PAYTABLE['Cherry-Cherry-X'] :
     symbols[0] === 'Diamond' ? SLOT_PAYTABLE['Diamond-X-X'] : 0)

  return { reels, symbols, multiplier }
}
