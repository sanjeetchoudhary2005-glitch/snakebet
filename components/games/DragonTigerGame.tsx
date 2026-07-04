'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

export function DragonTigerGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [betType, setBetType] = useState<'dragon' | 'tiger' | 'tie'>('dragon');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);
  const [dragonCard, setDragonCard] = useState<Card | null>(null);
  const [tigerCard, setTigerCard] = useState<Card | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [payout, setPayout] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setDragonCard(null);
    setTigerCard(null);
    setWinner(null);
    setPayout(0);
    playSound('click');

    try {
      const response = await fetch('/api/games/dragontiger/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, betType }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to draw round');

      setRoundId(data.roundId);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });

      // Quick converging animation sequence
      setTimeout(() => {
        playSound('card');
        setDragonCard(data.dragonCard);
      }, 500);

      setTimeout(() => {
        playSound('card');
        setTigerCard(data.tigerCard);
      }, 1000);

      setTimeout(async () => {
        setWinner(data.winner);
        setPayout(data.payout);
        setGameState('settled');

        if (data.payout > 0) {
          triggerWin(data.multiplier);
        } else {
          triggerLose();
        }

        await refresh();
        fetchTransactions();
        setIsSubmitting(false);
      }, 1600);

    } catch (err: any) {
      setError(err.message || 'Error occurred starting game');
      setGameState('idle');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setDragonCard(null);
    setTigerCard(null);
    setWinner(null);
    setPayout(0);
    setRoundId(null);
    setError(null);
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

  const CardFlip = ({ card, active }: { card: Card | null; active: boolean }) => {
    if (!card) return (
      <div className="w-24 h-36 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
        <span className="text-[10px] text-gray-600 uppercase font-black">Waiting</span>
      </div>
    );

    return (
      <motion.div
        initial={{ rotateY: 180, scale: 0.8, y: -20, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className={`w-24 h-36 relative select-none shadow-2xl ${
          active ? 'ring-4 ring-yellow-400 shadow-yellow-500/20' : ''
        }`}
      >
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-white to-[#ece9d8] rounded-xl border border-yellow-600/30 flex flex-col justify-between p-2.5 ${
            isRed(card.suit) ? 'text-red-600' : 'text-black'
          }`}
        >
          <div className="text-xs font-black font-mono leading-none">{card.rank}</div>
          <div className="text-3xl font-black text-center leading-none">{suitSymbol(card.suit)}</div>
          <div className="text-xs font-black font-mono leading-none rotate-180 self-end">{card.rank}</div>
        </div>
      </motion.div>
    );
  };

  return (
    <GameViewportLayout
      gameId="dragontiger"
      gameName="🐉 Dragon Tiger"
      rtp={98.0}
      verifyData={verifyData ? { ...verifyData, result: winner || '' } : null}
      controls={
        gameState === 'idle' ? (
          <div className="flex flex-col gap-4 w-full">
            {/* Bet Type Picker */}
            <div className="grid grid-cols-3 gap-2 bg-[#0b0f19]/80 p-1 border border-white/5 rounded-xl">
              <button
                onClick={() => setBetType('dragon')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  betType === 'dragon' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>Dragon</span>
                <span className="text-[10px] opacity-70">1.98x</span>
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
                onClick={() => setBetType('tiger')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  betType === 'tiger' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>Tiger</span>
                <span className="text-[10px] opacity-70">1.98x</span>
              </button>
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex-1">
                <input 
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-center"
                />
              </div>
              <button
                onClick={startRound}
                disabled={isSubmitting || balance < betAmount}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 text-sm"
              >
                Place Wager
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

      {/* Asian motif felt backdrop grid */}
      <div className="flex-1 w-full max-w-4xl flex flex-col justify-between items-center relative py-6">
        
        {/* Particle/mist background aura */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.02)_10%,transparent_70%)]" />

        {/* Top Header Label */}
        <div className="text-center z-10">
          <span className="block text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Dragon Tiger Arena</span>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Fast Showdown</h2>
        </div>

        {/* Dual showdown containers */}
        <div className="grid grid-cols-2 gap-8 md:gap-16 w-full max-w-lg items-center my-6 z-10">
          
          {/* Dragon (Left) */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs uppercase font-black text-red-500 tracking-wider">Dragon</span>
            <div className={`p-4 rounded-2xl bg-red-950/10 border-2 border-red-500/20 transition-all ${
              winner === 'dragon' ? 'bg-red-500/5 border-red-500/50 shadow-lg shadow-red-500/10' : ''
            }`}>
              <CardFlip card={dragonCard} active={winner === 'dragon'} />
            </div>
          </div>

          {/* Tiger (Right) */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs uppercase font-black text-blue-500 tracking-wider">Tiger</span>
            <div className={`p-4 rounded-2xl bg-blue-950/10 border-2 border-blue-500/20 transition-all ${
              winner === 'tiger' ? 'bg-blue-500/5 border-blue-500/50 shadow-lg shadow-blue-500/10' : ''
            }`}>
              <CardFlip card={tigerCard} active={winner === 'tiger'} />
            </div>
          </div>

        </div>

        {/* Winner outcome slide-in */}
        <div className="min-h-[50px] flex items-center justify-center z-10">
          {gameState === 'settled' && winner && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-8 py-2.5 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-sm ${
                payout > 0 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-green-500/10' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/10'
              }`}
            >
              {payout > 0 ? `Winner: ${winner.toUpperCase()} (Won ₹${payout.toFixed(2)})` : `Winner: ${winner.toUpperCase()}`}
            </motion.div>
          )}
        </div>

        {/* Error panel */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs font-semibold text-center z-10 max-w-sm">
            {error}
          </div>
        )}

      </div>
    </GameViewportLayout>
  );
}
