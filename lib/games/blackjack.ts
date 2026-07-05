import { shuffleDeck, cardFromIndex } from './rng'

// House edge: 0.5% — from blackjack rules (dealer hits soft 17, BJ pays 3:2)
// Perfect basic strategy by player yields ~99.5% RTP

export function getCardBlackjackValue(cardIndex: number): number {
  const rank = cardIndex % 13
  if (rank === 0) return 11 // Ace (soft)
  if (rank >= 10) return 10 // J, Q, K
  return rank + 1 // 2-10
}

export function handValue(hand: number[]): { value: number, soft: boolean } {
  let value = 0
  let aces = 0

  for (const cardIndex of hand) {
    const v = getCardBlackjackValue(cardIndex)
    if (v === 11) { aces++; value += 11 }
    else value += v
  }

  let soft = aces > 0 && value <= 21
  while (value > 21 && aces > 0) {
    value -= 10
    aces--
    if (aces === 0) soft = false
  }

  return { value, soft }
}

export function isBlackjack(hand: number[]): boolean {
  return hand.length === 2 && handValue(hand).value === 21
}

// Dealer must hit on soft 17 (standard Vegas rule — gives house extra 0.2% edge)
export function shouldDealerHit(hand: number[]): boolean {
  const { value, soft } = handValue(hand)
  return value < 17 || (soft && value === 17)
}

export function playDealerHand(deck: number[], dealerHand: number[], deckPosition: number): {
  finalHand: number[], finalDeckPosition: number
} {
  let hand = [...dealerHand]
  let pos = deckPosition

  while (shouldDealerHit(hand)) {
    hand.push(deck[pos++])
  }

  return { finalHand: hand, finalDeckPosition: pos }
}

export function determineBlackjackResult(playerHand: number[], dealerHand: number[]): {
  result: 'blackjack' | 'win' | 'push' | 'lose', multiplier: number
} {
  const playerBJ = isBlackjack(playerHand)
  const dealerBJ = isBlackjack(dealerHand)
  const { value: playerValue } = handValue(playerHand)
  const { value: dealerValue } = handValue(dealerHand)

  if (playerBJ && dealerBJ) return { result: 'push', multiplier: 1 }
  if (playerBJ) return { result: 'blackjack', multiplier: 2.5 }  // 3:2 payout = 2.5x total return
  if (dealerBJ) return { result: 'lose', multiplier: 0 }
  if (playerValue > 21) return { result: 'lose', multiplier: 0 }
  if (dealerValue > 21) return { result: 'win', multiplier: 2 }
  if (playerValue > dealerValue) return { result: 'win', multiplier: 2 }
  if (playerValue === dealerValue) return { result: 'push', multiplier: 1 }
  return { result: 'lose', multiplier: 0 }
}
