import { shuffleDeck, cardFromIndex } from './rng'

// House edges: Player 1.24%, Banker 1.06%, Tie 14.36%
// Banker bet: 0.95:1 payout (5% commission) — standard Baccarat rule
// Tie pays 8:1 but wins only 9.5% of the time — massive house edge on tie

export function getBaccaratValue(cardIndex: number): number {
  const rank = cardIndex % 13
  if (rank >= 9) return 0 // 10, J, Q, K = 0
  if (rank === 0) return 1 // Ace = 1
  return rank + 1
}

export function handBaccaratTotal(hand: number[]): number {
  return hand.reduce((sum, c) => (sum + getBaccaratValue(c)) % 10, 0)
}

export function shouldPlayerDraw(playerTotal: number): boolean {
  return playerTotal <= 5
}

export function shouldBankerDraw(bankerTotal: number, playerThirdCard: number | null): boolean {
  if (playerThirdCard === null) return bankerTotal <= 5
  // Standard banker drawing rules based on player's third card
  if (bankerTotal <= 2) return true
  if (bankerTotal === 3) return playerThirdCard !== 8
  if (bankerTotal === 4) return [2,3,4,5,6,7].includes(playerThirdCard)
  if (bankerTotal === 5) return [4,5,6,7].includes(playerThirdCard)
  if (bankerTotal === 6) return [6,7].includes(playerThirdCard)
  return false
}

export function playBaccarat(deck: number[]): {
  playerHand: number[], bankerHand: number[],
  playerTotal: number, bankerTotal: number,
  winner: 'player' | 'banker' | 'tie'
} {
  let pos = 0
  const playerHand = [deck[pos++], deck[pos++]]
  const bankerHand = [deck[pos++], deck[pos++]]

  let playerThirdCard: number | null = null
  const pTotal = handBaccaratTotal(playerHand)
  const bTotal = handBaccaratTotal(bankerHand)

  if (pTotal < 8 && bTotal < 8) {
    if (shouldPlayerDraw(pTotal)) {
      playerThirdCard = deck[pos++]
      playerHand.push(playerThirdCard)
      const pCardValue = getBaccaratValue(playerThirdCard)
      if (shouldBankerDraw(handBaccaratTotal(bankerHand), pCardValue)) {
        bankerHand.push(deck[pos++])
      }
    } else if (shouldBankerDraw(bTotal, null)) {
      bankerHand.push(deck[pos++])
    }
  }

  const playerTotal = handBaccaratTotal(playerHand)
  const bankerTotal = handBaccaratTotal(bankerHand)
  const winner = playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie'

  return { playerHand, bankerHand, playerTotal, bankerTotal, winner }
}

export function getBaccaratPayout(betType: 'player' | 'banker' | 'tie', winner: string, betAmount: number): number {
  if (winner === 'tie' && (betType === 'player' || betType === 'banker')) {
    return betAmount // push, get betAmount back
  }
  if (betType !== winner) return 0
  if (betType === 'player') return parseFloat((betAmount * 2).toFixed(2))
  if (betType === 'banker') return parseFloat((betAmount * 1.95).toFixed(2)) // 5% commission
  if (betType === 'tie') return parseFloat((betAmount * 9).toFixed(2)) // 8:1 + stake back
  return 0
}
