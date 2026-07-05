'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { motion } from 'framer-motion';
import { BetControlPanel } from './BetControlPanel';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

interface DealtCardInfo {
  card: Card;
  pile: 'andar' | 'bahar';
}

export function AndarBaharGame() {
  const { balance, refresh, fetchTransactions, setBalance } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [side, setSide] = useState<'andar' | 'bahar'>('andar');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);
  
  const [jokerCard, setJokerCard] = useState<Card | null>(null);
  const [andarPile, setAndarPile] = useState<Card[]>([]);
  const [baharPile, setBaharPile] = useState<Card[]>([]);
  
  const [winningSide, setWinningSide] = useState<'andar' | 'bahar' | null>(null);
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
    setJokerCard(null);
    setAndarPile([]);
    setBaharPile([]);
    setWinningSide(null);
    setPayout(0);
    playSound('click');

    try {
      const response = await fetch('/api/games/andar-bahar/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, side }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start Andar Bahar');

      setRoundId(data.roundId);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });
      
      if (data.newBalance !== undefined) {
        setBalance(data.newBalance);
      }

      // Joker reveal
      setTimeout(() => {
        playSound('card');
        setJokerCard(data.jokerCard);
      }, 500);

      // Distribute alternate deals with stagger delays
      const dealtCards: Card[] = data.dealtCards;
      const isBlack = data.jokerCard.suit === 'spades' || data.jokerCard.suit === 'clubs';
      
      let tempAndar: Card[] = [];
      let tempBahar: Card[] = [];

      dealtCards.forEach((card, index) => {
        const goesToAndar = isBlack ? index % 2 === 0 : index % 2 !== 0;

        setTimeout(() => {
          playSound('card');
          if (goesToAndar) {
            tempAndar = [...tempAndar, card];
            setAndarPile([...tempAndar]);
          } else {
            tempBahar = [...tempBahar, card];
            setBaharPile([...tempBahar]);
          }

          // If this was the last card, settle round
          if (index === dealtCards.length - 1) {
            setTimeout(async () => {
              setWinningSide(data.winningSide);
              setPayout(data.payout);
              setGameState('settled');

              if (data.won) {
                triggerWin(data.multiplier);
              } else {
                triggerLose();
              }

              fetchTransactions();
              setIsSubmitting(false);
            }, 500);
          }
        }, 1200 + index * 400); // 400ms deal speed
      });

    } catch (err: any) {
      setError(err.message || 'Error occurred starting Andar Bahar');
      setGameState('idle');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setJokerCard(null);
    setAndarPile([]);
    setBaharPile([]);
    setWinningSide(null);
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

  const CardFlip = ({ card, scale = 1 }: { card: Card | null; scale?: number }) => {
    if (!card) return null;
    return (
      <motion.div
        initial={{ rotateY: 180, scale: scale * 0.8 }}
        animate={{ rotateY: 0, scale }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
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
      gameId="andar-bahar"
      gameName="🎭 Andar Bahar"
      rtp={98.0}
      verifyData={verifyData ? { ...verifyData, result: winningSide || '' } : null}
      controls={
        gameState === 'idle' ? (
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2 bg-[#0b0f19]/80 p-1 border border-white/5 rounded-xl">
              <button
                onClick={() => setSide('andar')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  side === 'andar' 
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>Andar (Inside)</span>
                <span className="text-[10px] opacity-70">1.90x</span>
              </button>
              <button
                onClick={() => setSide('bahar')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  side === 'bahar' 
                    ? 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>Bahar (Outside)</span>
                <span className="text-[10px] opacity-70">2.00x</span>
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
                Deal Cards
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

      <div className="flex-1 w-full max-w-5xl flex flex-col justify-between items-center relative py-4">
        
        {/* Top Joker Reveal slot */}
        <div className="flex flex-col items-center gap-2 z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Joker Card</span>
          <div className="relative w-20 h-28 bg-[#1e293b]/20 border-2 border-dashed border-yellow-500/20 rounded-xl flex items-center justify-center p-1">
            {jokerCard ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15)_0%,transparent_80%)] rounded-xl">
                <CardFlip card={jokerCard} scale={1.1} />
              </div>
            ) : (
              <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Joker</span>
            )}
          </div>
        </div>

        {/* Central Card Table felt stacks */}
        <div className="grid grid-cols-2 gap-4 w-full my-4 z-10 max-h-[300px] overflow-hidden">
          
          {/* Andar Stack */}
          <div className={`rounded-2xl border p-4 flex flex-col items-center transition-all bg-[#0f2e1e]/20 border-green-900/30 ${
            winningSide === 'andar' ? 'border-yellow-500 bg-[#0f2e1e]/40 shadow-lg shadow-yellow-500/5' : ''
          }`}>
            <span className="text-xs uppercase font-black text-amber-500 tracking-wider mb-3">Andar</span>
            
            <div className="w-full flex flex-wrap gap-2 justify-center max-h-[220px] overflow-y-auto p-1">
              {andarPile.length === 0 ? (
                <div className="text-[9px] text-gray-600 font-bold py-10 uppercase tracking-widest">Empty</div>
              ) : (
                andarPile.map((card, idx) => (
                  <CardFlip key={`andar-${idx}`} card={card} />
                ))
              )}
            </div>
          </div>

          {/* Bahar Stack */}
          <div className={`rounded-2xl border p-4 flex flex-col items-center transition-all bg-[#0b1a2e]/20 border-blue-900/30 ${
            winningSide === 'bahar' ? 'border-yellow-500 bg-[#0b1a2e]/40 shadow-lg shadow-yellow-500/5' : ''
          }`}>
            <span className="text-xs uppercase font-black text-blue-500 tracking-wider mb-3">Bahar</span>
            
            <div className="w-full flex flex-wrap gap-2 justify-center max-h-[220px] overflow-y-auto p-1">
              {baharPile.length === 0 ? (
                <div className="text-[9px] text-gray-600 font-bold py-10 uppercase tracking-widest">Empty</div>
              ) : (
                baharPile.map((card, idx) => (
                  <CardFlip key={`bahar-${idx}`} card={card} />
                ))
              )}
            </div>
          </div>

        </div>

        {/* Win outcome banner */}
        <div className="min-h-[50px] flex items-center justify-center z-10">
          {gameState === 'settled' && winningSide && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-8 py-2.5 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-sm ${
                payout > 0 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-green-500/10' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/10'
              }`}
            >
              {payout > 0 ? `Winner: ${winningSide.toUpperCase()} (Won ₹${payout.toFixed(2)})` : `Winner: ${winningSide.toUpperCase()}`}
            </motion.div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs font-semibold text-center z-10 max-w-sm">
            {error}
          </div>
        )}

      </div>
    </GameViewportLayout>
  );
}
