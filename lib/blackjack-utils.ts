import { hmacRandom } from '@/lib/provably-fair';

export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";

export interface CardData {
  rank: string;
  suit: CardSuit;
  value: number;
}

export function createDeck(): CardData[] {
  const suits: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck: CardData[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      let value = parseInt(rank, 10);
      if (['J', 'Q', 'K'].includes(rank)) value = 10;
      if (rank === 'A') value = 11;
      deck.push({ rank, suit, value });
    }
  }
  return deck;
}

export function shuffleDeck(deck: CardData[], serverSeed: string, clientSeed: string, nonce: number): CardData[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const rand = hmacRandom(serverSeed, clientSeed, Number(nonce), i);
    const j = Math.floor(rand * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateHandValue(cards: CardData[]): number {
  let value = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') {
      value += 11;
      aces += 1;
    } else {
      value += card.value;
    }
  }
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return value;
}
