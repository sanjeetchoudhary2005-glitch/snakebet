import { generateServerSeed, hashServerSeed, generateFloat, shuffleDeck } from '../lib/games/rng'
import { rollDice, calculateDicePayout, didWinDice } from '../lib/games/dice'
import { flipCoin, calculateCoinflipPayout } from '../lib/games/coinflip'
import { spinWheel } from '../lib/games/wheel'
import { dropBall, getPlinkoMultiplier } from '../lib/games/plinko'
import { startHiLoGame, getHiLoOdds } from '../lib/games/hilo'
import { generateMinePositions, getMinesMultiplier } from '../lib/games/mines'
import { playDealerHand, determineBlackjackResult, handValue } from '../lib/games/blackjack'
import { spinRoulette, evaluateBet } from '../lib/games/roulette'
import { playBaccarat, getBaccaratPayout } from '../lib/games/baccarat'
import { playAndarBahar, getAndarBaharPayout } from '../lib/games/andarbahar'
import { playTeenPatti, getTeenPattiPayout } from '../lib/games/teenpatti'
import { playDragonTiger, getDragonTigerPayout } from '../lib/games/dragontiger'
import { drawKenoBalls, evaluateKeno } from '../lib/games/keno'
import { generateDragonPositions, getDragonTowerMultiplier } from '../lib/games/dragontower'
import { calculateLudoPayout } from '../lib/games/ludo'
import { spinSlots } from '../lib/games/slots'

async function runSimulation() {
  const ROUNDS = 15000
  const clientSeed = 'test_client_seed'
  console.log(`Running House Edge / RTP Simulation (${ROUNDS} rounds per game)...\n`)

  const results: Record<string, { target: number; actual: number }> = {}

  // 1. DICE
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const target = 50
      const direction = 'under'
      const { multiplier } = calculateDicePayout(bet, target, direction)
      const roll = rollDice(serverSeed, clientSeed, i)
      const won = didWinDice(roll, target, direction)
      const payout = won ? bet * multiplier : 0
      totalBet += bet
      totalPayout += payout
    }
    results['Dice'] = { target: 0.97, actual: totalPayout / totalBet }
  }

  // 2. COINFLIP
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const choice = 'heads'
      const result = flipCoin(serverSeed, clientSeed, i)
      const payout = calculateCoinflipPayout(bet, choice, result)
      totalBet += bet
      totalPayout += payout
    }
    results['Coinflip'] = { target: 0.98, actual: totalPayout / totalBet }
  }

  // 3. WHEEL
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const risk = 'medium'
      const { multiplier } = spinWheel(serverSeed, clientSeed, i, risk)
      totalBet += bet
      totalPayout += bet * multiplier
    }
    results['Wheel'] = { target: 0.97, actual: totalPayout / totalBet }
  }

  // 4. PLINKO
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const rows = 12
      const risk = 'medium'
      const { bucket } = dropBall(serverSeed, clientSeed, i, rows)
      const multiplier = getPlinkoMultiplier(bucket, rows, risk)
      totalBet += bet
      totalPayout += bet * multiplier
    }
    results['Plinko'] = { target: 0.97, actual: totalPayout / totalBet }
  }

  // 5. HILO
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const game = startHiLoGame(serverSeed, clientSeed, i)
      const currentCardVal = game.currentCard.value
      const remainingVals = game.remaining
      // Predict higher if current <= 6, lower otherwise
      const prediction = currentCardVal <= 6 ? 'higher' : 'lower'
      const { odds, winCount } = getHiLoOdds(currentCardVal, remainingVals, prediction)
      if (winCount > 0) {
        const actualNextCard = remainingVals[0] % 13
        const won = prediction === 'higher' ? actualNextCard > currentCardVal : actualNextCard < currentCardVal
        const payout = won ? bet * odds : 0
        totalBet += bet
        totalPayout += payout
      }
    }
    results['Hilo'] = { target: 0.97, actual: totalPayout / totalBet }
  }

  // 6. MINES
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const mineCount = 3
      const mines = generateMinePositions(serverSeed, clientSeed, i, mineCount)
      // Pick 3 random distinct tiles (e.g., 0, 1, 2)
      const selections = [0, 1, 2]
      const hitMine = selections.some(s => mines.includes(s))
      const payout = hitMine ? 0 : bet * getMinesMultiplier(3, mineCount)
      totalBet += bet
      totalPayout += payout
    }
    results['Mines'] = { target: 0.97, actual: totalPayout / totalBet }
  }

  // 7. BLACKJACK
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const deck = shuffleDeck(serverSeed, clientSeed, i)
      // Deal initial cards
      let pos = 0
      let playerHand = [deck[pos++], deck[pos++]]
      let dealerHand = [deck[pos++], deck[pos++]]

      // Basic Player Strategy: hit below 17
      while (handValue(playerHand).value < 17) {
        playerHand.push(deck[pos++])
      }

      // Dealer turn if player didn't bust
      if (handValue(playerHand).value <= 21) {
        const dealerResult = playDealerHand(deck, dealerHand, pos)
        dealerHand = dealerResult.finalHand
      }

      const { multiplier } = determineBlackjackResult(playerHand, dealerHand)
      totalBet += bet
      totalPayout += bet * multiplier
    }
    results['Blackjack'] = { target: 0.995, actual: totalPayout / totalBet }
  }

  // 8. ROULETTE
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const result = spinRoulette(serverSeed, clientSeed, i)
      const { payout } = evaluateBet('red', null, result, bet)
      totalBet += bet
      totalPayout += payout
    }
    results['Roulette'] = { target: 0.973, actual: totalPayout / totalBet }
  }

  // 9. BACCARAT
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const deck = shuffleDeck(serverSeed, clientSeed, i)
      const outcome = playBaccarat(deck)
      const payout = getBaccaratPayout('player', outcome.winner, bet)
      totalBet += bet
      totalPayout += payout
    }
    results['Baccarat'] = { target: 0.989, actual: totalPayout / totalBet }
  }

  // 10. ANDAR BAHAR
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const outcome = playAndarBahar(serverSeed, clientSeed, i)
      const payout = getAndarBaharPayout('andar', outcome.winner, bet)
      totalBet += bet
      totalPayout += payout
    }
    results['Andar Bahar'] = { target: 0.97, actual: totalPayout / totalBet }
  }

  // 11. TEEN PATTI
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const outcome = playTeenPatti(serverSeed, clientSeed, i)
      const payout = getTeenPattiPayout(true, outcome.winner, bet)
      totalBet += bet
      totalPayout += payout
    }
    results['Teen Patti'] = { target: 0.96, actual: totalPayout / totalBet }
  }

  // 12. DRAGON TIGER
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const outcome = playDragonTiger(serverSeed, clientSeed, i)
      const payout = getDragonTigerPayout('dragon', outcome.winner, bet)
      totalBet += bet
      totalPayout += payout
    }
    results['Dragon Tiger'] = { target: 0.962, actual: totalPayout / totalBet }
  }

  // 13. KENO
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const picks = [1, 2, 3, 4, 5]
      const drawn = drawKenoBalls(serverSeed, clientSeed, i)
      const { payout } = evaluateKeno(picks, drawn, bet)
      totalBet += bet
      totalPayout += payout
    }
    results['Keno'] = { target: 0.96, actual: totalPayout / totalBet }
  }

  // 14. DRAGON TOWER
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const difficulty = 'medium'
      const layout = generateDragonPositions(serverSeed, clientSeed, i, 3, difficulty)
      // Pick tile 0 at levels 0, 1, 2
      const hitTrap = layout.some((row, level) => row.includes(0))
      const payout = hitTrap ? 0 : bet * getDragonTowerMultiplier(3, difficulty)
      totalBet += bet
      totalPayout += payout
    }
    results['Dragon Tower'] = { target: 0.97, actual: totalPayout / totalBet }
  }

  // 15. LUDO
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const bet = 10
      // 2 players, winner gets pot minus rake
      const pot = bet * 2
      const winPayout = calculateLudoPayout(pot)
      // Simulate 50% win probability
      const won = Math.random() < 0.5
      const payout = won ? winPayout : 0
      totalBet += bet
      totalPayout += payout
    }
    results['Ludo'] = { target: 0.95, actual: totalPayout / totalBet }
  }

  // 16. SLOTS
  {
    let totalBet = 0
    let totalPayout = 0
    for (let i = 0; i < ROUNDS; i++) {
      const serverSeed = generateServerSeed()
      const bet = 10
      const { multiplier } = spinSlots(serverSeed, clientSeed, i)
      totalBet += bet
      totalPayout += bet * multiplier
    }
    results['Slots'] = { target: 0.96, actual: totalPayout / totalBet }
  }

  console.log('| Game | Target RTP | Simulated RTP | Pass? |')
  console.log('| --- | --- | --- | --- |')
  for (const game of Object.keys(results)) {
    const { target, actual } = results[game]
    const diff = Math.abs(target - actual)
    const pass = diff <= 0.02 ? '✅' : '❌'
    console.log(`| ${game} | ${(target * 100).toFixed(1)}% | ${(actual * 100).toFixed(2)}% | ${pass} |`)
  }
}

runSimulation()
