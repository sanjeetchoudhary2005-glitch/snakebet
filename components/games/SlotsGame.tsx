'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { BetControlPanel } from './BetControlPanel';

const SYMBOLS = ['7', 'BAR', 'BELL', 'CHERRY', 'LEMON', 'SCATTER'];

export function SlotsGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'tumbing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);

  // Grid is 5 rows, 4 columns
  const [grid, setGrid] = useState<string[][]>([
    ['CHERRY', 'LEMON', 'BELL', 'BAR'],
    ['LEMON', '7', 'CHERRY', 'BELL'],
    ['BELL', 'BAR', 'SCATTER', 'LEMON'],
    ['CHERRY', 'BELL', 'BAR', '7'],
    ['BAR', 'CHERRY', 'LEMON', 'SCATTER'],
  ]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentTumbleIdx, setCurrentTumbleIdx] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [winningTiles, setWinningTiles] = useState<Set<string>>(new Set());

  // Verification Seed Data
  const [verifyData, setVerifyData] = useState<any | null>(null);

  // Custom designed vector SVG symbols
  const SlotSymbol = ({ symbol }: { symbol: string }) => {
    switch (symbol) {
      case '7':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]">
            <defs>
              <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
            </defs>
            <path d="M16 12h32v8L28 52h-8l16-28H16v-8z" fill="url(#grad7)" stroke="#fef08a" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        );
      case 'BAR':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(245,158,11,0.2)]">
            <defs>
              <linearGradient id="gradBar" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="goldBar" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <rect x="4" y="16" width="56" height="32" rx="6" fill="url(#gradBar)" stroke="url(#goldBar)" strokeWidth="3" />
            <rect x="8" y="20" width="48" height="24" rx="4" fill="url(#goldBar)" />
            <text x="32" y="38" fill="#000000" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="1.5" fontFamily="monospace">BAR</text>
          </svg>
        );
      case 'BELL':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]">
            <defs>
              <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <path d="M32 8c-8 0-13 6-13 13v12l-4 6v3h34v-3l-4-6V21c0-7-5-13-13-13z" fill="url(#bellGrad)" stroke="#fef08a" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="32" cy="46" r="4.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1" />
          </svg>
        );
      case 'CHERRY':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(239,68,68,0.3)]">
            <defs>
              <linearGradient id="cherryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="50%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>
            <path d="M32 14c-4 9-10 15-12 22M32 14c4 9 10 15 12 22" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M32 14c2-2 6-2 8 0" stroke="#22c55e" strokeWidth="2.5" fill="none" />
            <circle cx="20" cy="38" r="10" fill="url(#cherryGrad)" stroke="#ef4444" strokeWidth="1" />
            <circle cx="17" cy="35" r="3.5" fill="#ffffff" opacity="0.6" />
            <circle cx="44" cy="38" r="10" fill="url(#cherryGrad)" stroke="#ef4444" strokeWidth="1" />
            <circle cx="41" cy="35" r="3.5" fill="#ffffff" opacity="0.6" />
          </svg>
        );
      case 'LEMON':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(234,179,8,0.25)]">
            <defs>
              <linearGradient id="lemonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="21" fill="url(#lemonGrad)" stroke="#fef08a" strokeWidth="2.5" />
            <circle cx="32" cy="32" r="17" fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="4,2" />
            <path d="M32 15v34M15 32h34M20 20l24 24M20 44l24-24" stroke="#fef08a" strokeWidth="1.5" opacity="0.8" />
            <circle cx="32" cy="32" r="4.5" fill="#fef08a" />
          </svg>
        );
      case 'SCATTER':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]">
            <defs>
              <linearGradient id="scatterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
            </defs>
            <path d="M32 6l7.5 16.5 18 1.5-13.5 12 4.5 18-16.5-10-16.5 10 4.5-18-13.5-12 18-1.5z" fill="url(#scatterGrad)" stroke="#e9d5ff" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        );
      default:
        return <span className="text-gray-400 font-bold">?</span>;
    }
  };

  const triggerSpin = async () => {
    if (balance < betAmount || isSpinning) return;
    setError(null);
    setIsSpinning(true);
    setGameState('playing');
    setWinningTiles(new Set());
    setTotalWin(0);
    playSound('click');

    try {
      const response = await fetch('/api/games/slots/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to spin slots');

      setRoundId(data.roundId);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
        result: `Win: ₹${data.totalWin.toFixed(2)}`,
      });

      // Animate vertical spinning blur reels
      // We will loop a blur animation for 1.5 seconds, then settle Reel by Reel
      playSound('dice'); // Spinning hum
      setTimeout(() => {
        // Stop spinning and load first grid of the tumble sequence
        setIsSpinning(false);
        setGameState('tumbing');
        
        const sequence = data.tumbleSequence;
        animateTumbles(sequence, 0, data.totalWin, data.finalMultiplier);
      }, 1600);

    } catch (err: any) {
      setError(err.message || 'Error occurred during Slots spin');
      setIsSpinning(false);
      setGameState('idle');
    }
  };

  const animateTumbles = (sequence: any[], index: number, targetWin: number, finalMultiplier: number) => {
    if (index >= sequence.length) {
      // Completed all tumbles
      setTimeout(async () => {
        setTotalWin(targetWin);
        setGameState('settled');

        if (targetWin > 0) {
          triggerWin(finalMultiplier || 2.0);
        } else {
          triggerLose();
        }

        await refresh();
        fetchTransactions();
      }, 300);
      return;
    }

    const currentTumble = sequence[index];
    // Show grid
    setGrid(currentTumble.grid);
    setCurrentTumbleIdx(index);

    // If there are winning clusters, highlight them first
    if (currentTumble.clusters && currentTumble.clusters.length > 0) {
      const wins = new Set<string>();
      currentTumble.clusters.forEach((cluster: any) => {
        cluster.coords.forEach((coord: [number, number]) => {
          wins.add(`${coord[0]}-${coord[1]}`);
        });
      });

      setWinningTiles(wins);
      playSound('bounce');

      // Explode after 700ms and animate next tumble drop
      setTimeout(() => {
        setWinningTiles(new Set());
        animateTumbles(sequence, index + 1, targetWin, finalMultiplier);
      }, 900);
    } else {
      // No clusters, end tumble
      animateTumbles(sequence, index + 1, targetWin, finalMultiplier);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setTotalWin(0);
    setWinningTiles(new Set());
    setRoundId(null);
    setError(null);
    setCurrentTumbleIdx(0);
  };

  return (
    <GameViewportLayout
      gameId="slots"
      gameName="🎰 Mystic Slots"
      rtp={96.0}
      verifyData={verifyData}
      controls={
        gameState === 'idle' ? (
          <BetControlPanel
            betAmount={betAmount}
            onChangeBetAmount={setBetAmount}
            onSubmit={triggerSpin}
            isSubmitting={isSpinning}
            submitLabel="Spin Reels"
            balance={balance}
            minBet={10}
            maxBet={25000}
          />
        ) : (
          <button
            onClick={handleReset}
            disabled={gameState === 'playing' || gameState === 'tumbing'}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:brightness-110 rounded-xl text-base font-black transition duration-150 active:scale-98 disabled:opacity-50"
          >
            Play Again
          </button>
        )
      }
    >
      <WinFlashOverlay />

      <div className="flex-1 w-full max-w-4xl flex flex-col lg:flex-row gap-6 relative justify-center items-center py-4">
        
        {/* 5-Reel Slots Board */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,#1e1b4b,#030712_75%)] border-2 border-purple-500/25 rounded-2xl p-6 relative flex flex-col justify-between shadow-2xl w-full max-w-md">
          {/* Neon purple glow overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.06)_15%,transparent_60%)]" />

          {/* 5x4 grid container representing 4 reels of 5 rows */}
          <div className="grid grid-cols-4 gap-2 bg-[#090d16] p-4 rounded-xl border border-white/5 relative overflow-hidden">
            {Array.from({ length: 20 }).map((_, idx) => {
              const row = Math.floor(idx / 4);
              const col = idx % 4;
              const symbol = grid[row]?.[col] || 'LEMON';
              const isWin = winningTiles.has(`${row}-${col}`);

              return (
                <div
                  key={idx}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl bg-[#111827]/80 border transition-all duration-300 ${
                    isSpinning 
                      ? 'blur-[3px] animate-[bounce_0.2s_infinite]' 
                      : isWin 
                        ? 'bg-yellow-500/20 border-yellow-400 scale-105 shadow-lg shadow-yellow-500/10' 
                        : 'border-white/5'
                  }`}
                >
                  <SlotSymbol symbol={symbol} />
                </div>
              );
            })}
          </div>

          {/* Outcome Status Overlay */}
          <div className="min-h-[40px] flex items-center justify-center mt-4">
            {gameState === 'settled' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-8 py-2 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-xs ${
                  totalWin > 0
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {totalWin > 0 ? `WIN! Payout ₹${totalWin.toFixed(2)}` : 'NO MATCHES'}
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-48 bg-[#141b2b] border border-white/5 rounded-2xl p-4 flex flex-col shrink-0 justify-center">
          <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 block">Reels Status</span>
          
          <div className="flex flex-col gap-2">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Wager placed</span>
              <span className="text-sm font-black text-white">₹{betAmount}</span>
            </div>
            
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Tumbles Run</span>
              <span className="text-sm font-black text-purple-400">{currentTumbleIdx + 1}</span>
            </div>
          </div>
        </div>

      </div>
    </GameViewportLayout>
  );
}
