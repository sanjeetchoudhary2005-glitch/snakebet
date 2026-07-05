'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { BetControlPanel } from './BetControlPanel';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

interface Bead {
  winner: 'player' | 'banker' | 'tie';
}

export function BaccaratGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [betType, setBetType] = useState<'player' | 'banker' | 'tie'>('player');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);

  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [playerTotal, setPlayerTotal] = useState<number>(0);
  const [bankerTotal, setBankerTotal] = useState<number>(0);
  
  const [winner, setWinner] = useState<'player' | 'banker' | 'tie' | null>(null);
  const [payout, setPayout] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bead Road History
  const [beadRoad, setBeadRoad] = useState<Bead[]>([]);

  // Verification Seed Data
  const [verifyData, setVerifyData] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);

  const startRound = async () => {
    if (balance < betAmount || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    setGameState('playing');
    setPlayerCards([]);
    setBankerCards([]);
    setPlayerTotal(0);
    setBankerTotal(0);
    setWinner(null);
    setPayout(0);
    setStatusMessage('Dealing initial hands...');
    playSound('click');

    try {
      const response = await fetch('/api/games/baccarat/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, betType }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start Baccarat round');

      setRoundId(data.roundId);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });

      const pCards: Card[] = data.playerCards;
      const bCards: Card[] = data.bankerCards;

      // Card dealing timeline animation
      // Card 1 Player
      setTimeout(() => {
        playSound('card');
        setPlayerCards([pCards[0]]);
        setPlayerTotal(calculateLocalTotal([pCards[0]]));
      }, 500);

      // Card 1 Banker
      setTimeout(() => {
        playSound('card');
        setBankerCards([bCards[0]]);
        setBankerTotal(calculateLocalTotal([bCards[0]]));
      }, 900);

      // Card 2 Player
      setTimeout(() => {
        playSound('card');
        setPlayerCards([pCards[0], pCards[1]]);
        setPlayerTotal(calculateLocalTotal([pCards[0], pCards[1]]));
      }, 1300);

      // Card 2 Banker
      setTimeout(() => {
        playSound('card');
        setBankerCards([bCards[0], bCards[1]]);
        setBankerTotal(calculateLocalTotal([bCards[0], bCards[1]]));
      }, 1700);

      // Evaluate Third Card Draws if applicable
      let timelineDelay = 2100;

      if (pCards.length === 3) {
        setTimeout(() => {
          setStatusMessage('Player draws a third card...');
          playSound('card');
          setPlayerCards([pCards[0], pCards[1], pCards[2]]);
          setPlayerTotal(calculateLocalTotal([pCards[0], pCards[1], pCards[2]]));
        }, timelineDelay);
        timelineDelay += 1000;
      }

      if (bCards.length === 3) {
        setTimeout(() => {
          setStatusMessage('Banker draws a third card...');
          playSound('card');
          setBankerCards([bCards[0], bCards[1], bCards[2]]);
          setBankerTotal(calculateLocalTotal([bCards[0], bCards[1], bCards[2]]));
        }, timelineDelay);
        timelineDelay += 1000;
      }

      // Showdown settlement
      setTimeout(async () => {
        setStatusMessage('');
        setWinner(data.winner);
        setPayout(data.payout);
        setGameState('settled');
        setBeadRoad(prev => [...prev, { winner: data.winner }]);

        if (data.won) {
          triggerWin(data.multiplier);
        } else {
          triggerLose();
        }

        await refresh();
        fetchTransactions();
        setIsSubmitting(false);
      }, timelineDelay);

    } catch (err: any) {
      setError(err.message || 'Error occurred during Baccarat game');
      setGameState('idle');
      setIsSubmitting(false);
    }
  };

  const calculateLocalTotal = (cards: Card[]): number => {
    let sum = 0;
    cards.forEach(c => {
      if (['10', 'J', 'Q', 'K'].includes(c.rank)) {
        sum += 0;
      } else if (c.rank === 'A') {
        sum += 1;
      } else {
        sum += parseInt(c.rank);
      }
    });
    return sum % 10;
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setPlayerCards([]);
    setBankerCards([]);
    setPlayerTotal(0);
    setBankerTotal(0);
    setWinner(null);
    setPayout(0);
    setRoundId(null);
    setError(null);
    setStatusMessage('');
  };

  const suitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const isRed = (suit: string) => suit === 'hearts' || suit === 'diamonds';

  const CardFlip = ({ card }: { card: Card }) => {
    return (
      <motion.div
        initial={{ rotateY: 180, scale: 0.8 }}
        animate={{ rotateY: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className="w-16 h-24 select-none shadow-lg relative shrink-0"
      >
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-white to-[#ece9d8] rounded-lg border border-yellow-600/30 flex flex-col justify-between p-1.5 ${
            isRed(card.suit) ? 'text-red-600' : 'text-black'
          }`}
        >
          <div className="text-[10px] font-black font-mono leading-none">{card.rank}</div>
          <div className="text-xl font-black text-center leading-none">{suitSymbol(card.suit)}</div>
          <div className="text-[10px] font-black font-mono leading-none rotate-180 self-end">{card.rank}</div>
        </div>
      </motion.div>
    );
  };

  return (
    <GameViewportLayout
      gameId="baccarat"
      gameName="💎 Baccarat"
      rtp={98.9}
      verifyData={verifyData ? { ...verifyData, result: winner || '' } : null}
      controls={
        gameState === 'idle' ? (
          <div className="flex flex-col gap-4 w-full">
            {/* Bet Type grid */}
            <div className="grid grid-cols-3 gap-2 bg-[#0b0f19]/80 p-1 border border-white/5 rounded-xl">
              <button
                onClick={() => setBetType('player')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  betType === 'player' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>Player</span>
                <span className="text-[10px] opacity-70">2.00x</span>
              </button>
              <button
                onClick={() => setBetType('tie')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  betType === 'tie' 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>Tie</span>
                <span className="text-[10px] opacity-70">9.00x</span>
              </button>
              <button
                onClick={() => setBetType('banker')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  betType === 'banker' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>Banker</span>
                <span className="text-[10px] opacity-70">1.95x</span>
              </button>
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex-1">
                <input 
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(50, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-center"
                />
              </div>
              <button
                onClick={startRound}
                disabled={isSubmitting || balance < betAmount}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 text-sm"
              >
                Deal Wager
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleReset}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:brightness-110 rounded-xl text-base font-black transition duration-150 active:scale-98"
          >
            Play Again
          </button>
        )
      }
    >
      <WinFlashOverlay />

      <div className="flex-1 w-full max-w-5xl flex flex-col lg:flex-row gap-6 relative justify-center items-center py-4">
        
        {/* Felt Board (Left/Center area) */}
        <div className="flex-1 min-h-[360px] bg-[radial-gradient(circle_at_center,#052b1b,#01130a_75%)] border border-white/5 rounded-2xl p-6 relative flex flex-col justify-between shadow-inner w-full">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.04)_10%,transparent_60%)]" />

          {/* Status Message Overlay */}
          <div className="text-center min-h-[20px]">
            {statusMessage && (
              <span className="text-xs font-semibold text-yellow-400 animate-pulse">{statusMessage}</span>
            )}
          </div>

          {/* Player & Banker Areas */}
          <div className="grid grid-cols-2 gap-8 items-center my-4">
            
            {/* Player Hand Zone */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black text-blue-400 tracking-wider">Player</span>
                <span className="font-mono text-xs font-black bg-black/40 px-2 py-0.5 rounded border border-white/5">
                  {playerTotal}
                </span>
              </div>
              
              <div className="flex gap-2 min-h-[96px] justify-center">
                {playerCards.map((c, i) => (
                  <CardFlip key={`player-card-${i}`} card={c} />
                ))}
              </div>
            </div>

            {/* Banker Hand Zone */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black text-red-400 tracking-wider">Banker</span>
                <span className="font-mono text-xs font-black bg-black/40 px-2 py-0.5 rounded border border-white/5">
                  {bankerTotal}
                </span>
              </div>
              
              <div className="flex gap-2 min-h-[96px] justify-center">
                {bankerCards.map((c, i) => (
                  <CardFlip key={`banker-card-${i}`} card={c} />
                ))}
              </div>
            </div>

          </div>

          {/* Outcome settlement overlay */}
          <div className="min-h-[50px] flex items-center justify-center">
            {gameState === 'settled' && winner && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-8 py-2.5 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-xs ${
                  payout > 0 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {payout > 0 ? `Winner: ${winner.toUpperCase()} (Won ₹${payout.toFixed(2)})` : `Winner: ${winner.toUpperCase()}`}
              </motion.div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs font-semibold text-center max-w-sm mx-auto">
              {error}
            </div>
          )}

        </div>

        {/* Bead Road Panel (Right Sidebar) conforming to overflow-y: auto */}
        <div className="w-full lg:w-48 bg-[#141b2b] border border-white/5 rounded-2xl p-4 flex flex-col shrink-0 lg:h-[360px]">
          <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 block">Bead Road History</span>
          
          <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap lg:grid lg:grid-cols-4 gap-2 content-start min-h-[60px]">
            {beadRoad.length === 0 ? (
              <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block py-12 text-center w-full">No rounds</span>
            ) : (
              beadRoad.map((bead, i) => (
                <div 
                  key={`bead-${i}`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black uppercase text-white shadow-md ${
                    bead.winner === 'player' 
                      ? 'bg-blue-600' 
                      : bead.winner === 'banker' 
                        ? 'bg-red-600' 
                        : 'bg-green-600'
                  }`}
                >
                  {bead.winner[0]}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </GameViewportLayout>
  );
}
