'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { BetControlPanel } from './BetControlPanel';

export function KenoGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [pickedNumbers, setPickedNumbers] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);
  
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [revealedDrawn, setRevealedDrawn] = useState<number[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [multiplier, setMultiplier] = useState(0);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Seed Data
  const [verifyData, setVerifyData] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);

  const toggleNumber = (num: number) => {
    if (gameState === 'playing') return;
    playSound('click');

    if (pickedNumbers.includes(num)) {
      setPickedNumbers(pickedNumbers.filter(n => n !== num));
    } else if (pickedNumbers.length < 10) {
      setPickedNumbers([...pickedNumbers, num]);
    }
  };

  const handleQuickPick = () => {
    if (gameState === 'playing') return;
    playSound('click');
    const newPicks: number[] = [];
    while (newPicks.length < 10) {
      const randomNum = Math.floor(Math.random() * 40) + 1;
      if (!newPicks.includes(randomNum)) {
        newPicks.push(randomNum);
      }
    }
    setPickedNumbers(newPicks);
  };

  const playRound = async () => {
    if (balance < betAmount || isSubmitting || pickedNumbers.length === 0) return;
    setError(null);
    setIsSubmitting(true);
    setGameState('playing');
    setDrawnNumbers([]);
    setRevealedDrawn([]);
    setMatchCount(0);
    setMultiplier(0);
    playSound('click');

    try {
      const res = await fetch('/api/games/keno/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, pickedNumbers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete Keno round');

      setRoundId(data.roundId);
      setDrawnNumbers(data.drawnNumbers);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });

      // Animate Keno drawings staggered
      let delayIndex = 0;
      const totalDrawings = data.drawnNumbers;

      const runDrawing = () => {
        if (delayIndex < totalDrawings.length) {
          const num = totalDrawings[delayIndex];
          playSound('bounce');
          
          setRevealedDrawn(prev => [...prev, num]);
          if (pickedNumbers.includes(num)) {
            setMatchCount(prev => prev + 1);
          }

          delayIndex++;
          setTimeout(runDrawing, 250); // 250ms draw speed
        } else {
          // Finished drawings
          setTimeout(async () => {
            setMultiplier(data.multiplier);
            setGameState('settled');

            if (data.multiplier > 0) {
              triggerWin(data.multiplier);
            } else {
              triggerLose();
            }

            await refresh();
            fetchTransactions();
            setIsSubmitting(false);
          }, 300);
        }
      };

      runDrawing();

    } catch (err: any) {
      setError(err.message || 'Error occurred starting Keno');
      setGameState('idle');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setDrawnNumbers([]);
    setRevealedDrawn([]);
    setMatchCount(0);
    setMultiplier(0);
    setRoundId(null);
    setError(null);
  };

  return (
    <GameViewportLayout
      gameId="keno"
      gameName="🎯 Keno Arena"
      rtp={96.0}
      verifyData={verifyData ? { ...verifyData, result: `${matchCount} matches (x${multiplier})` } : null}
      controls={
        gameState === 'idle' ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-2 justify-between">
              <button
                onClick={handleQuickPick}
                className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold rounded-lg text-xs transition duration-150 active:scale-98"
              >
                Quick Pick 10
              </button>
              <button
                onClick={() => setPickedNumbers([])}
                disabled={pickedNumbers.length === 0}
                className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold rounded-lg text-xs transition duration-150 active:scale-98 disabled:opacity-50"
              >
                Clear picks
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
                onClick={playRound}
                disabled={isSubmitting || pickedNumbers.length === 0 || balance < betAmount}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 text-sm"
              >
                Deal Numbers
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
        
        {/* Keno Grid Board */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,#111827,#030712_75%)] border border-white/5 rounded-2xl p-6 relative flex flex-col justify-between shadow-2xl w-full">
          <div className="grid grid-cols-8 gap-2.5 max-w-lg mx-auto w-full my-auto">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => {
              const isPicked = pickedNumbers.includes(num);
              const isDrawn = revealedDrawn.includes(num);
              const isMatch = isPicked && isDrawn;

              return (
                <button
                  key={num}
                  disabled={gameState === 'playing'}
                  onClick={() => toggleNumber(num)}
                  className={`w-11 h-11 rounded-xl text-xs font-black transition-all duration-200 border relative ${
                    isMatch
                      ? 'bg-yellow-500 border-yellow-400 text-black font-black scale-105 shadow-lg shadow-yellow-500/20'
                      : isPicked
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/10'
                        : isDrawn
                          ? 'bg-gray-700/60 border-gray-600 text-gray-400 opacity-60'
                          : 'bg-gray-800/30 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payout summaries (Right sidebar) */}
        <div className="w-full lg:w-48 bg-[#141b2b] border border-white/5 rounded-2xl p-4 flex flex-col shrink-0 justify-center">
          <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 block">Matches Info</span>
          
          <div className="flex flex-col gap-2">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Selected</span>
              <span className="text-sm font-black text-white">{pickedNumbers.length} / 10</span>
            </div>
            
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Matches Hit</span>
              <span className="text-sm font-black text-yellow-500">{matchCount}</span>
            </div>

            {gameState === 'settled' && (
              <div className={`p-3 rounded-xl border flex flex-col ${
                multiplier > 0 ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
              }`}>
                <span className="text-[10px] uppercase font-bold opacity-70">Payout</span>
                <span className="text-sm font-black font-mono">
                  {multiplier > 0 ? `x${multiplier.toFixed(2)}` : '0.00x'}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </GameViewportLayout>
  );
}
