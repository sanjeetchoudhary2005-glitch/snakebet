import crypto from 'crypto'

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex')
}

export function generateFloat(serverSeed: string, clientSeed: string, nonce: number, cursor: number = 0): number {
  const hmac = crypto.createHmac('sha256', serverSeed)
  hmac.update(`${clientSeed}:${nonce}:${cursor}`)
  const hex = hmac.digest('hex')
  // Convert first 8 hex chars to a float between 0 and 1
  const decimal = parseInt(hex.slice(0, 8), 16)
  return decimal / 0xffffffff
}

export function generateInt(serverSeed: string, clientSeed: string, nonce: number, min: number, max: number, cursor: number = 0): number {
  const float = generateFloat(serverSeed, clientSeed, nonce, cursor)
  return Math.floor(float * (max - min + 1)) + min
}

export function shuffleDeck(serverSeed: string, clientSeed: string, nonce: number): number[] {
  const deck = Array.from({ length: 52 }, (_, i) => i)
  for (let i = 51; i > 0; i--) {
    const float = generateFloat(serverSeed, clientSeed, nonce, i)
    const j = Math.floor(float * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// Card helpers
export const SUITS = ['♠️', '♥️', '♦️', '♣️']
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function cardFromIndex(index: number) {
  return {
    suit: SUITS[Math.floor(index / 13)],
    rank: RANKS[index % 13],
    value: index % 13,  // 0=A, 1-9=pip, 10=J, 11=Q, 12=K
    index
  }
}

export function cardDisplayValue(rank: string): string {
  return rank
}
