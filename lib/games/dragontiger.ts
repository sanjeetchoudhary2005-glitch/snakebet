import { shuffleDeck } from './rng'

// House edges: Dragon/Tiger 3.73%, Tie 32.77% (never play tie)
// Dragon/Tiger pays 1:1 but ties are a push (player loses on ties)

export function playDragonTiger(serverSeed: string, clientSeed: string, nonce: number): {
  dragonCard: number, tigerCard: number,
  dragonValue: number, tigerValue: number,
  winner: 'dragon' | 'tiger' | 'tie'
} {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce)
  const dragonCard = deck[0]
  const tigerCard = deck[1]

  // Ace low: A=1, 2-10=face, J=11, Q=12, K=13
  const getVal = (c: number) => {
    const r = c % 13
    if (r === 0) return 1 // Ace
    return r + 1
  }

  const dragonValue = getVal(dragonCard)
  const tigerValue = getVal(tigerCard)
  const winner = dragonValue > tigerValue ? 'dragon' : tigerValue > dragonValue ? 'tiger' : 'tie'

  return { dragonCard, tigerCard, dragonValue, tigerValue, winner }
}

export function getDragonTigerPayout(
  bet: 'dragon' | 'tiger' | 'tie', winner: string, betAmount: number
): number {
  if (bet === 'tie') {
    return winner === 'tie' ? parseFloat((betAmount * 9).toFixed(2)) : 0
  }
  if (winner === 'tie') return parseFloat((betAmount * 0.5).toFixed(2)) // half stake back on tie
  if (bet === winner) return parseFloat((betAmount * 2).toFixed(2))
  return 0
}
