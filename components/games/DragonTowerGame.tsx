'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { motion, AnimatePresence } from 'framer-motion';

interface TowerLevel {
  level: number;
  trapPositions: number[];
}

export function DragonTowerGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'busted' | 'won' | 'cashed_out'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);

  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [historyLayouts, setHistoryLayouts] = useState<Record<number, TowerLevel>>({});
  const [historySelections, setHistorySelections] = useState<Record<number, number>>({});
  const [currentLevelLayout, setCurrentLevelLayout] = useState<TowerLevel | null>(null);
  
  const [revealedTile, setRevealedTile] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);

  // Verification Seed Data
  const [verifyData, setVerifyData] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);

  // Tower multipliers based on standard configs
  const getMultiplierLadder = () => {
    switch (difficulty) {
      case 'Easy': // 4 tiles, 1 trap (3/4 safe) -> approx 1.30x multiplier steps
        return [1.3, 1.69, 2.2, 2.86, 3.72, 4.84, 6.29, 8.18, 10.63];
      case 'Medium': // 3 tiles, 1 trap (2/3 safe) -> approx 1.45x multiplier steps
        return [1.45, 2.1, 3.05, 4.42, 6.41, 9.3, 13.48, 19.55, 28.35];
      case 'Hard': // 2 tiles, 1 trap (1/2 safe) -> approx 1.95x multiplier steps
        return [1.95, 3.8, 7.41, 14.45, 28.18, 54.95, 107.15, 208.95, 407.45];
      case 'Expert': // 4 tiles, 3 traps (1/4 safe) -> approx 3.88x multiplier steps
        return [3.88, 15.05, 58.4, 226.6, 879.2, 3411.3, 13236.0, 51355.0, 199260.0];
    }
  };

  const getTilesPerLevel = () => {
    switch (difficulty) {
      case 'Easy': return 4;
      case 'Medium': return 3;
      case 'Hard': return 2;
      case 'Expert': return 4;
    }
  };

  const startRound = async () => {
    if (balance < betAmount || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    setGameState('playing');
    setCurrentLevel(0);
    setCurrentMultiplier(1.0);
    setHistoryLayouts({});
    setHistorySelections({});
    setRevealedTile(null);
    setLastPayout(0);
    playSound('click');

    try {
      const res = await fetch('/api/games/dragontower/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, difficulty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start Tower climbing');

      setRoundId(data.roundId);
      setCurrentLevel(data.currentLevel);
      setCurrentMultiplier(data.currentMultiplier);
      setCurrentLevelLayout(data.layout);
      
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });

      playSound('bounce');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Error starting Dragon Tower');
      setGameState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTile = async (tileIndex: number) => {
    if (!roundId || gameState !== 'playing' || isSubmitting || revealedTile !== null) return;
    setError(null);
    setIsSubmitting(true);
    setRevealedTile(tileIndex);
    playSound('click');

    try {
      const res = await fetch('/api/games/dragontower/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, tileIndex }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to select tile');

      // Stave off state updates so flip card can settle
      setTimeout(async () => {
        // Record Selection Layouts to print in the completed stack rows
        if (currentLevelLayout) {
          setHistoryLayouts(prev => ({ ...prev, [currentLevel]: currentLevelLayout }));
          setHistorySelections(prev => ({ ...prev, [currentLevel]: tileIndex }));
        }

        if (data.isTrap) {
          playSound('lose');
          setGameState('busted');
          setLastPayout(0);
          triggerLose();
          await refresh();
          fetchTransactions();
          setIsSubmitting(false);
        } else if (data.status === 'won') {
          playSound('win');
          setGameState('won');
          setLastPayout(data.payout || (betAmount * data.currentMultiplier));
          triggerWin(data.currentMultiplier);
          await refresh();
          fetchTransactions();
          setIsSubmitting(false);
        } else {
          playSound('bounce');
          setCurrentLevel(data.currentLevel);
          setCurrentMultiplier(data.currentMultiplier);
          setCurrentLevelLayout(data.nextLevelLayout);
          setRevealedTile(null);
          setIsSubmitting(false);
        }
      }, 700);

    } catch (err: any) {
      setError(err.message || 'Error occurred during selection');
      setIsSubmitting(false);
      setRevealedTile(null);
    }
  };

  const handleCashout = async () => {
    if (!roundId || gameState !== 'playing' || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    playSound('click');

    try {
      const res = await fetch('/api/games/dragontower/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cashout');

      setGameState('cashed_out');
      setLastPayout(data.payout);
      triggerWin(currentMultiplier * 5); // Confetti spark
      
      await refresh();
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
    setCurrentLevel(0);
    setCurrentMultiplier(1.0);
    setHistoryLayouts({});
    setHistorySelections({});
    setRevealedTile(null);
    setLastPayout(0);
    setRoundId(null);
    setError(null);
  };

  const multipliers = getMultiplierLadder();
  const tilesCount = getTilesPerLevel();

  return (
    <GameViewportLayout
      gameId="dragontower"
      gameName="🐉 Dragon Tower"
      rtp={96.5}
      verifyData={verifyData ? { ...verifyData, result: `${currentMultiplier.toFixed(2)}x` } : null}
      controls={
        gameState === 'idle' ? (
          <div className="flex flex-col gap-4 w-full">
            {/* Difficulty selectors */}
            <div className="grid grid-cols-4 gap-2 bg-[#0b0f19]/80 p-1 border border-white/5 rounded-xl">
              {['Easy', 'Medium', 'Hard', 'Expert'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d as any)}
                  className={`py-3 rounded-lg font-black text-xs transition-all flex flex-col items-center justify-center ${
                    difficulty === d 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25' 
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{d}</span>
                </button>
              ))}
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
          <div className="flex gap-4 w-full max-w-lg items-center">
            {gameState === 'playing' ? (
              <button
                onClick={handleCashout}
                disabled={isSubmitting || currentLevel === 0}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 flex flex-col items-center justify-center"
              >
                <span className="text-xs uppercase font-bold tracking-wider">Cash Out</span>
                <span className="font-mono font-bold text-sm">₹{(betAmount * currentMultiplier).toFixed(2)}</span>
              </button>
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

      {/* Atmospheric dark fantasy background overlay */}
      <div className="flex-1 w-full max-w-5xl flex flex-col lg:flex-row gap-6 relative justify-center items-center py-4">
        
        {/* 9-level Vertical Climbing Tower felt board grid */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,#111827,#030712_75%)] border border-white/5 rounded-2xl p-6 relative flex flex-col justify-between shadow-2xl h-[420px] overflow-y-auto">
          {/* Moody purple fog highlight */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.03)_15%,transparent_70%)]" />

          {/* Render 9 Tower rows from Level 9 (top) down to Level 0 (bottom) */}
          <div className="w-full flex flex-col gap-2.5 z-10">
            {Array.from({ length: 9 }, (_, i) => 8 - i).map((lvlIndex) => {
              const level = lvlIndex;
              const isActive = level === currentLevel && gameState === 'playing';
              const isCompleted = level < currentLevel || gameState === 'won' || gameState === 'busted' || gameState === 'cashed_out';
              const isSelection = historySelections[level] !== undefined;

              return (
                <div 
                  key={`level-${level}`}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-purple-600/10 border border-purple-500/30 shadow-lg shadow-purple-500/5' 
                      : isCompleted 
                        ? 'bg-black/20 border border-transparent opacity-60' 
                        : 'bg-black/40 border border-transparent opacity-30 pointer-events-none'
                  }`}
                >
                  {/* Row Level Index */}
                  <span className="text-[10px] uppercase font-mono font-black text-gray-500 select-none">
                    Lvl {level + 1}
                  </span>

                  {/* Horizontal Selection Tiles row */}
                  <div className="flex gap-3 justify-center flex-1 mx-4">
                    {Array.from({ length: tilesCount }, (_, tileIdx) => {
                      const selection = historySelections[level];
                      const wasSelected = selection === tileIdx || (isActive && revealedTile === tileIdx);
                      const levelLayout = historyLayouts[level] || (isActive ? currentLevelLayout : null);
                      const isTrap = levelLayout?.trapPositions.includes(tileIdx);

                      return (
                        <button
                          key={`tile-${level}-${tileIdx}`}
                          disabled={!isActive || isSubmitting || revealedTile !== null}
                          onClick={() => selectTile(tileIdx)}
                          className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300 relative ${
                            wasSelected
                              ? isTrap
                                ? 'bg-red-600 border border-red-500 text-white'
                                : 'bg-yellow-500 border border-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                              : 'bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-500'
                          }`}
                        >
                          {wasSelected ? (isTrap ? '🔥' : '💎') : '?'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Step multiplier */}
                  <span className="text-[10px] font-mono font-black text-yellow-500/70 select-none">
                    x{multipliers[level].toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Outcome Status Overlay */}
          {gameState !== 'playing' && gameState !== 'idle' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-8 py-3 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-sm ${
                  gameState === 'won' || gameState === 'cashed_out'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {gameState === 'won' ? 'TOWER COMPLETED!' : gameState === 'cashed_out' ? `CASHED OUT: ₹${lastPayout.toFixed(2)}` : 'BUSTED'}
              </motion.div>
            </div>
          )}

        </div>

        {/* Vertical Multiplier Ladder sidebar */}
        <div className="w-full lg:w-44 bg-[#141b2b] border border-white/5 rounded-2xl p-4 flex flex-col shrink-0 lg:h-[420px]">
          <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 block">Payout Ladder</span>
          
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 justify-start">
            {multipliers.map((mult, idx) => {
              const isActive = idx === currentLevel && gameState === 'playing';
              return (
                <div 
                  key={`ladder-${idx}`}
                  className={`flex justify-between items-center px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 ${
                    isActive 
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 font-bold' 
                      : 'bg-black/20 border-transparent text-gray-400'
                  }`}
                >
                  <span>Level {idx + 1}</span>
                  <span>x{mult.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </GameViewportLayout>
  );
}
