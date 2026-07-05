import { shuffleDeck, cardFromIndex } from './rng'

// House edge: 3% — odds calculated from remaining deck, multiplied by 0.97

export function getHiLoOdds(currentCardValue: number, remaining: number[], direction: 'higher' | 'lower' | 'equal'): {
  odds: number, winCount: number, totalRemaining: number
} {
  const totalRemaining = remaining.length
  let winCount = 0

  if (direction === 'higher') {
    winCount = remaining.filter(i => (i % 13) > currentCardValue).length
  } else if (direction === 'lower') {
    winCount = remaining.filter(i => (i % 13) < currentCardValue).length
  } else {
    winCount = remaining.filter(i => (i % 13) === currentCardValue).length
  }

  if (winCount === 0) return { odds: 0, winCount: 0, totalRemaining }

  // Fair odds * 0.97 for house edge
  const fairOdds = totalRemaining / winCount
  const odds = parseFloat((fairOdds * 0.97).toFixed(4))
  return { odds, winCount, totalRemaining }
}

export function startHiLoGame(serverSeed: string, clientSeed: string, nonce: number) {
  const shuffledDeck = shuffleDeck(serverSeed, clientSeed, nonce)
  const firstCardIndex = shuffledDeck[0]
  const firstCard = cardFromIndex(firstCardIndex)
  const remaining = shuffledDeck.slice(1)
  return { deck: shuffledDeck, currentCard: firstCard, remaining, currentCardIndex: 0 }
}
