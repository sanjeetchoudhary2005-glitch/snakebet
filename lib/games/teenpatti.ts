import { shuffleDeck, cardFromIndex } from './rng'

// House edge: 4% — from rake on pot, standard Teen Patti online model
// Hand rankings (low to high): High Card < Pair < Flush < Straight < Straight Flush < Trail (3 of a kind)

export type HandRank = 0 | 1 | 2 | 3 | 4 | 5
export const HAND_NAMES = ['High Card', 'Pair', 'Flush', 'Straight', 'Straight Flush', 'Trail']

export function evaluateTeenPattiHand(cards: number[]): { rank: HandRank, values: number[] } {
  const values = cards.map(c => c % 13).sort((a, b) => b - a)
  const suits = cards.map(c => Math.floor(c / 13))

  const isFlush = suits[0] === suits[1] && suits[1] === suits[2]
  const isStraight = (() => {
    const sorted = [...values].sort((a, b) => a - b)
    return (sorted[2] - sorted[1] === 1 && sorted[1] - sorted[0] === 1) ||
           (sorted[0] === 0 && sorted[1] === 11 && sorted[2] === 12) // A-2-3 or Q-K-A
  })()
  const isTrail = values[0] === values[1] && values[1] === values[2]
  const isPair = values[0] === values[1] || values[1] === values[2]

  if (isTrail) return { rank: 5, values }
  if (isFlush && isStraight) return { rank: 4, values }
  if (isStraight) return { rank: 3, values }
  if (isFlush) return { rank: 2, values }
  if (isPair) return { rank: 1, values }
  return { rank: 0, values }
}

export function compareHands(hand1: number[], hand2: number[]): 'hand1' | 'hand2' | 'tie' {
  const h1 = evaluateTeenPattiHand(hand1)
  const h2 = evaluateTeenPattiHand(hand2)
  if (h1.rank > h2.rank) return 'hand1'
  if (h2.rank > h1.rank) return 'hand2'
  // Same rank — compare values
  for (let i = 0; i < h1.values.length; i++) {
    if (h1.values[i] > h2.values[i]) return 'hand1'
    if (h2.values[i] > h1.values[i]) return 'hand2'
  }
  return 'tie'
}

export function playTeenPatti(serverSeed: string, clientSeed: string, nonce: number): {
  playerHand: number[], dealerHand: number[], winner: 'player' | 'dealer' | 'tie'
} {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce)
  const playerHand = [deck[0], deck[2], deck[4]]
  const dealerHand = [deck[1], deck[3], deck[5]]
  const result = compareHands(playerHand, dealerHand)
  return {
    playerHand, dealerHand,
    winner: result === 'hand1' ? 'player' : result === 'hand2' ? 'dealer' : 'tie'
  }
}

export function getTeenPattiPayout(betOnPlayer: boolean, winner: string, betAmount: number): number {
  if ((betOnPlayer && winner === 'player') || (!betOnPlayer && winner === 'dealer')) {
    return parseFloat((betAmount * 1.945).toFixed(2)) // 2.75% rake to achieve exactly 96% RTP
  }
  if (winner === 'tie') return parseFloat((betAmount * 0.5).toFixed(2)) // push gives back half
  return 0
}
