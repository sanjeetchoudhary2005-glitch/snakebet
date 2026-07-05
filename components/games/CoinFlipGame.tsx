'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { Coin3D } from './3d/Coin3D';
import { motion } from 'framer-motion';

export function CoinFlipGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);

  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [payout, setPayout] = useState(0);
  const [streak, setStreak] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Seed Data
  const [verifyData, setVerifyData] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);

  const flipCoin = async () => {
    if (balance < betAmount || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    setGameState('playing');
    setResult(null);
    setWon(null);
    setPayout(0);
    playSound('click');

    try {
      const response = await fetch('/api/games/coinflip/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, choice }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to flip coin');

      setRoundId(data.roundId);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });

      // Physics rotation variables
      const spins = 8;
      const targetX = spins * Math.PI * 2 + (data.result === 'heads' ? 0 : Math.PI); // 180 deg to show tails
      const targetY = spins * Math.PI * 2;

      const duration = 1800; // 1.8 seconds flip
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Eased rotation curve
        const ease = 1 - Math.pow(1 - progress, 3);
        setRotationX(targetX * ease);
        setRotationY(targetY * ease);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Flip ended
          setTimeout(async () => {
            setResult(data.result);
            setWon(data.won);
            setPayout(data.payout);
            setGameState('settled');

            if (data.won) {
              setStreak(prev => prev + 1);
              triggerWin(1.98);
            } else {
              setStreak(0);
              triggerLose();
            }

            await refresh();
            fetchTransactions();
            setIsSubmitting(false);
          }, 200);
        }
      };

      animate();

    } catch (err: any) {
      setError(err.message || 'Error occurred starting Coin Flip');
      setGameState('idle');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setResult(null);
    setWon(null);
    setPayout(0);
    setRoundId(null);
    setError(null);
  };

  return (
    <GameViewportLayout
      gameId="coinflip"
      gameName="🪙 Coin Flip 3D"
      rtp={98.0}
      verifyData={verifyData ? { ...verifyData, result: result || '' } : null}
      controls={
        gameState === 'idle' ? (
          <div className="flex flex-col gap-4 w-full">
            {/* Side Selection Grid */}
            <div className="grid grid-cols-2 gap-3 bg-[#0b0f19]/80 p-1 border border-white/5 rounded-xl">
              <button
                onClick={() => setChoice('heads')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  choice === 'heads' 
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>👑 Heads</span>
              </button>
              <button
                onClick={() => setChoice('tails')}
                className={`py-3 rounded-lg font-black text-sm transition-all flex flex-col items-center justify-center ${
                  choice === 'tails' 
                    ? 'bg-gray-600 text-white shadow-lg shadow-gray-600/20' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>🦅 Tails</span>
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
                onClick={flipCoin}
                disabled={isSubmitting || balance < betAmount}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 text-sm"
              >
                Flip Coin
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
        
        {/* R3F 3D coin layout panel */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,#111827,#030712_75%)] border border-white/5 rounded-2xl p-6 relative flex flex-col items-center justify-center shadow-2xl w-full min-h-[340px]">
          
          <div className="absolute top-4 left-4 bg-black/40 px-3 py-1 border border-white/5 rounded-lg text-[10px] uppercase font-bold text-gray-500">
            Streak: <span className="font-mono text-yellow-500 font-black">{streak}</span>
          </div>

          <Coin3D
            rotationX={rotationX}
            rotationY={rotationY}
            result={result}
          />

          {/* Outcome settlement overlay */}
          <div className="min-h-[40px] flex items-center justify-center mt-3">
            {gameState === 'settled' && result && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-8 py-2 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-xs ${
                  won 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {won ? `WIN! Mapped ${result.toUpperCase()} (Won ₹${payout.toFixed(2)})` : `LOSS! Mapped ${result.toUpperCase()}`}
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-48 bg-[#141b2b] border border-white/5 rounded-2xl p-4 flex flex-col shrink-0 justify-center">
          <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 block">Payout details</span>
          
          <div className="flex flex-col gap-2">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Wager placed</span>
              <span className="text-sm font-black text-white">₹{betAmount}</span>
            </div>
            
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Payout multiplier</span>
              <span className="text-sm font-black text-yellow-500">1.98x</span>
            </div>
          </div>
        </div>

      </div>
    </GameViewportLayout>
  );
}
