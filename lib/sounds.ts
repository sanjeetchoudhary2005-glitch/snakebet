import { Howl } from 'howler'

export const SOUNDS = typeof window !== 'undefined' ? {
  betPlace: new Howl({ src: ['/sounds/bet-place.mp3'], volume: 0.5 }),
  win:      new Howl({ src: ['/sounds/win.mp3'],       volume: 0.7 }),
  lose:     new Howl({ src: ['/sounds/lose.mp3'],      volume: 0.5 }),
  diceRoll: new Howl({ src: ['/sounds/dice-roll.mp3'], volume: 0.6 }),
  coinFlip: new Howl({ src: ['/sounds/coin-flip.mp3'], volume: 0.6 }),
  wheelSpin:new Howl({ src: ['/sounds/wheel-spin.mp3'],volume: 0.5 }),
  cardDeal: new Howl({ src: ['/sounds/card-deal.mp3'], volume: 0.6 }),
  bgMusic:  new Howl({ src: ['/sounds/casino-bg.mp3'], volume: 0.2, loop: true }),
} : {} as any

// Generate sounds programmatically if files don't exist or fail to load
export function playBeep(frequency: number = 440, duration: number = 0.1, type: OscillatorType = 'sine') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = frequency
    osc.type = type
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    console.error('AudioContext beep failed:', e)
  }
}

export const GameSounds = {
  win: () => {
    try { SOUNDS.win?.play() } catch { playBeep(880, 0.3, 'sine') }
  },
  lose: () => {
    try { SOUNDS.lose?.play() } catch { playBeep(220, 0.4, 'sawtooth') }
  },
  bet: () => {
    try { SOUNDS.betPlace?.play() } catch { playBeep(440, 0.1, 'square') }
  },
  tick: () => {
    try { playBeep(660, 0.05, 'sine') } catch {}
  }
}
