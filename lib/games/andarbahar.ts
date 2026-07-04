import { shuffleDeck, cardFromIndex } from './rng'

// House edge: 3% on Andar (first), 3.15% on Bahar
// Andar wins slightly more often (first card dealt) — standard Andar Bahar math

export function playAndarBahar(serverSeed: string, clientSeed: string, nonce: number): {
  jokerCard: number, andarCards: number[], baharCards: number[],
  winner: 'andar' | 'bahar', totalCards: number
} {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce)
  const jokerCard = deck[0]
  const jokerValue = jokerCard % 13

  const andarCards: number[] = []
  const baharCards: number[] = []
  let pos = 1
  let winner: 'andar' | 'bahar' | null = null

  while (winner === null && pos < 52) {
    // Andar gets first card
    const andarCard = deck[pos++]
    andarCards.push(andarCard)
    if (andarCard % 13 === jokerValue) { winner = 'andar'; break }

    // Bahar gets second card
    if (pos < 52) {
      const baharCard = deck[pos++]
      baharCards.push(baharCard)
      if (baharCard % 13 === jokerValue) { winner = 'bahar'; break }
    }
  }

  return {
    jokerCard, andarCards, baharCards,
    winner: winner ?? 'andar',
    totalCards: andarCards.length + baharCards.length
  }
}

export function getAndarBaharPayout(bet: 'andar' | 'bahar', winner: string, betAmount: number): number {
  if (bet !== winner) return 0
  // Andar: 0.9x profit (pays 1.9x total) — house edge 3% accounting for Andar's slight advantage
  // Bahar: 1x profit (pays 2x total) — house edge 3.15%
  const multiplier = bet === 'andar' ? 1.9 : 2.0
  return parseFloat((betAmount * multiplier).toFixed(2))
}
