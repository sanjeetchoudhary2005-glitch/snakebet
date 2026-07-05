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

export function HiLoGame() {
  const { balance, refresh, fetchTransactions, setBalance } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'busted' | 'cashed_out'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [streak, setStreak] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextMultipliers, setNextMultipliers] = useState<{
    higher: number;
    lower: number;
    equal: number;
  }>({ higher: 1.5, lower: 1.5, equal: 12 });

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
    setStreak([]);
    setNextCard(null);
    playSound('click');

    try {
      const response = await fetch('/api/games/hilo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start round');

      setRoundId(data.roundId);
      setCurrentCard(data.currentCard);
      setStreak([data.currentCard]);
      setCurrentMultiplier(data.currentMultiplier);
      setNextMultipliers(data.nextMultipliers);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });
      
      if (data.newBalance !== undefined) {
        setBalance(data.newBalance);
      }

      playSound('card');
    } catch (err: any) {
      setError(err.message || 'Error occurred starting game');
      setGameState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuess = async (guess: 'higher' | 'lower' | 'equal') => {
    if (!roundId || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    playSound('click');

    try {
      const response = await fetch('/api/games/hilo/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, guess }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to guess');

      setNextCard(data.nextCard);
      playSound('card');
      
      if (data.newBalance !== undefined) {
        setBalance(data.newBalance);
      }

      setTimeout(async () => {
        setCurrentCard(data.nextCard);
        setNextCard(null);
        setCurrentMultiplier(data.currentMultiplier);
        
        if (data.isCorrect) {
          setStreak(prev => [...prev, data.nextCard]);
          setNextMultipliers(data.nextMultipliers);
          triggerWin(data.currentMultiplier);
        } else {
          setGameState('busted');
          triggerLose();
          fetchTransactions();
        }
        setIsSubmitting(false);
      }, 600);

    } catch (err: any) {
      setError(err.message || 'Error occurred during guess');
      setIsSubmitting(false);
    }
  };

  const handleCashout = async () => {
    if (!roundId || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    playSound('click');

    try {
      const response = await fetch('/api/games/hilo/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cashout');

      setGameState('cashed_out');
      triggerWin(currentMultiplier * 5); // Confetti spark
      
      if (data.newBalance !== undefined) {
        setBalance(data.newBalance);
      }
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Error occurred cashing out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setCurrentCard(null);
    setNextCard(null);
    setStreak([]);
    setCurrentMultiplier(1.0);
    setRoundId(null);
    setError(null);
  };

  return (
    <GameViewportLayout
      gameId="hilo"
      gameName="🃏 HiLo"
      rtp={98.0}
      verifyData={verifyData ? { ...verifyData, result: currentMultiplier } : null}
      controls={
        gameState === 'idle' ? (
          <BetControlPanel
            betAmount={betAmount}
            onChangeBetAmount={setBetAmount}
            onSubmit={startRound}
            isSubmitting={isSubmitting}
            submitLabel="Start Game"
            balance={balance}
            minBet={10}
            maxBet={50000}
          />
        ) : (
          <div className="flex gap-4 w-full max-w-lg items-center">
            {gameState === 'playing' ? (
              <>
                <button
                  onClick={() => handleGuess('higher')}
                  disabled={isSubmitting || nextMultipliers.higher === 0}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl transition duration-150 active:scale-98 flex flex-col items-center justify-center"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-green-200">Higher</span>
                  <span className="font-mono font-black text-lg">x{nextMultipliers.higher}</span>
                </button>
                <button
                  onClick={() => handleGuess('lower')}
                  disabled={isSubmitting || nextMultipliers.lower === 0}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition duration-150 active:scale-98 flex flex-col items-center justify-center"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-red-200">Lower</span>
                  <span className="font-mono font-black text-lg">x{nextMultipliers.lower}</span>
                </button>
                {streak.length > 1 && (
                  <button
                    onClick={handleCashout}
                    disabled={isSubmitting}
                    className="px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 flex flex-col items-center justify-center"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">Cash Out</span>
                    <span className="font-mono font-bold text-sm">₹{(betAmount * currentMultiplier).toFixed(2)}</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleReset}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:brightness-110 rounded-xl text-base font-black transition duration-150 active:scale-98"
              >
                Play Again
              </button>
            )}
          </div>
        )
      }
      >
        <WinFlashOverlay />

        {/* Game view area */}
        <div className="flex-1 w-full flex flex-col justify-between items-center py-4 relative">
          
          {/* Top Multiplier Progress */}
          <div className="text-center z-10">
            <span className="block text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Current Multiplier</span>
            <motion.h2 
              key={currentMultiplier}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-5xl font-black text-yellow-500 tracking-tight font-mono"
            >
              x{currentMultiplier.toFixed(2)}
            </motion.h2>
          </div>

          {/* Cards Display Grid */}
          <div className="flex items-center gap-8 justify-center my-6 z-10">
            {/* Left Card: Current */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Current</span>
              <div className="relative">
                {currentCard ? <CardFace card={currentCard} /> : <CardBack />}
              </div>
            </div>

            {/* Next card reveal slot */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Next Card</span>
              <div className="relative">
                <AnimatePresence mode="wait">
                  {nextCard ? (
                    <motion.div
                      key="next-face"
                      initial={{ rotateY: 180, scale: 0.8, x: 20 }}
                      animate={{ rotateY: 0, scale: 1, x: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                    >
                      <CardFace card={nextCard} />
                    </motion.div>
                  ) : (
                    <motion.div key="back">
                      <CardBack />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Error Message Panel */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs font-semibold text-center z-10 max-w-sm">
              {error}
            </div>
          )}

          {/* Outcome Status Layer */}
          {gameState !== 'playing' && gameState !== 'idle' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-8 py-3 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-sm z-20 ${
                gameState === 'cashed_out'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {gameState === 'cashed_out' ? `CASHED OUT: ₹${(betAmount * currentMultiplier).toFixed(2)}` : 'BUSTED'}
            </motion.div>
          )}

          {/* Streak History Strip */}
          <div className="w-full max-w-lg overflow-x-auto flex gap-2 items-center justify-center p-2 bg-black/20 border border-white/5 rounded-xl">
            {streak.length === 0 ? (
              <span className="text-[10px] text-gray-500 uppercase font-black">History empty</span>
            ) : (
              streak.map((c, i) => (
                <div 
                  key={`streak-${i}`}
                  className={`px-2.5 py-1 rounded text-xs font-black font-mono border bg-white flex items-center gap-1 ${
                    isRed(c.suit) ? 'text-red-600 border-red-200' : 'text-black border-gray-300'
                  }`}
                >
                  <span>{c.rank}</span>
                  <span>{suitSymbol(c.suit)}</span>
                </div>
              ))
            )}
          </div>

        </div>
      </GameViewportLayout>
    );
  }

// --- MODULE SCOPE HELPER SUB-COMPONENTS AND UTILITIES ---

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

function CardFace({ card, hidden }: { card: Card | null; hidden?: boolean }) {
  if (!card) return null;
  return (
    <div 
      className={`w-28 h-40 rounded-xl bg-gradient-to-br from-white to-[#ece9d8] border-2 border-yellow-600/30 flex flex-col justify-between p-3 select-none shadow-2xl relative transition-all duration-300 ${
        hidden ? 'rotate-y-180' : ''
      } ${isRed(card.suit) ? 'text-red-600' : 'text-black'}`}
    >
      <div className="text-sm font-black font-mono leading-none">{card.rank}</div>
      <div className="text-4xl font-black text-center leading-none">{suitSymbol(card.suit)}</div>
      <div className="text-sm font-black font-mono leading-none rotate-180 self-end">{card.rank}</div>
    </div>
  );
}

function CardBack() {
  return (
    <div className="w-28 h-40 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-blue-500/30 rounded-xl p-1.5 flex items-center justify-center shadow-2xl">
      <div className="w-full h-full rounded border border-blue-500/10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.25)_0%,transparent_70%)] flex items-center justify-center bg-[length:8px_8px] bg-[linear-gradient(45deg,#0b0f19_25%,transparent_25%,transparent_75%,#0b0f19_75%)]">
        <span className="text-[10px] text-blue-500/40 font-black tracking-widest uppercase font-mono">BV</span>
      </div>
    </div>
  );
}
