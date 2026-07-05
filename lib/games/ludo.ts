import { generateInt } from './rng'

// House edge: 5% rake taken from pot on match completion
// Ludo is skill/luck hybrid — house doesn't play, takes a cut of the pot

export const LUDO_CONFIG = {
  BOARD_SIZE: 52,
  HOME_STRETCH: 6,
  SAFE_SQUARES: [0, 8, 13, 21, 26, 34, 39, 47], // standard safe squares
  START_POSITIONS: { red: 0, blue: 13, yellow: 26, green: 39 },
  TOKENS_PER_PLAYER: 4,
  HOUSE_RAKE_PCT: 0.05, // 5% of total pot
}

export function rollLudoDice(serverSeed: string, clientSeed: string, nonce: number): number {
  return generateInt(serverSeed, clientSeed, nonce, 1, 6)
}

export function calculateLudoPayout(totalPot: number): number {
  return parseFloat((totalPot * (1 - LUDO_CONFIG.HOUSE_RAKE_PCT)).toFixed(2))
}

export function isSafeSquare(position: number): boolean {
  return LUDO_CONFIG.SAFE_SQUARES.includes(position % LUDO_CONFIG.BOARD_SIZE)
}

export function canTokenMove(
  tokenPosition: number, diceValue: number,
  otherTokenPositions: number[], color: string
): boolean {
  if (tokenPosition === -1 && diceValue !== 6) return false // token in home, needs 6
  if (tokenPosition === -1 && diceValue === 6) return true  // can enter board
  const newPos = (tokenPosition + diceValue) % LUDO_CONFIG.BOARD_SIZE
  // Can always move — captures are handled separately
  return true
}

export function moveToken(
  tokenPosition: number, diceValue: number,
  startPosition: number
): { newPosition: number, capturedOpponent: boolean } {
  if (tokenPosition === -1) {
    return { newPosition: startPosition, capturedOpponent: false }
  }

  const newPosition = tokenPosition + diceValue
  // Check if in home stretch
  if (newPosition >= LUDO_CONFIG.BOARD_SIZE + LUDO_CONFIG.HOME_STRETCH) {
    return { newPosition: tokenPosition, capturedOpponent: false } // can't overshoot home
  }

  return { newPosition, capturedOpponent: false }
}

export function checkCapture(
  newPosition: number, opponentPositions: number[][]
): { captured: boolean, capturedColor: number, capturedTokenIndex: number } {
  if (isSafeSquare(newPosition)) return { captured: false, capturedColor: -1, capturedTokenIndex: -1 }

  for (let colorIndex = 0; colorIndex < opponentPositions.length; colorIndex++) {
    const tokens = opponentPositions[colorIndex]
    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
      if (tokens[tokenIndex] % LUDO_CONFIG.BOARD_SIZE === newPosition % LUDO_CONFIG.BOARD_SIZE) {
        return { captured: true, capturedColor: colorIndex, capturedTokenIndex: tokenIndex }
      }
    }
  }
  return { captured: false, capturedColor: -1, capturedTokenIndex: -1 }
}

export function hasPlayerWon(tokenPositions: number[]): boolean {
  // All 4 tokens must reach position >= BOARD_SIZE + HOME_STRETCH (home)
  return tokenPositions.every(pos => pos >= LUDO_CONFIG.BOARD_SIZE + LUDO_CONFIG.HOME_STRETCH)
}

export function shouldGetBonusRoll(diceValue: number, capturedToken: boolean): boolean {
  return diceValue === 6 || capturedToken
}
