'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { BetControlPanel } from './BetControlPanel';
import { useGameEffects } from '@/hooks/useGameEffects';
import { Dices, Shield, HelpCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RollHistory {
  roll: number;
  won: boolean;
}

export function DiceGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();
  
  // Game states
  const [betAmount, setBetAmount] = useState(100);
  const [target, setTarget] = useState(50.00);
  const [direction, setDirection] = useState<'over' | 'under'>('under');
  const [isRolling, setIsRolling] = useState(false);
  const [displayedRoll, setDisplayedRoll] = useState<number | null>(50.00);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [history, setHistory] = useState<RollHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Provably Fair Verification State
  const [showVerify, setShowVerify] = useState(false);
  const [verifyData, setVerifyData] = useState<{
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    roll: number;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Calculations
  const HOUSE_EDGE = 0.01;
  const winChance = direction === 'over' ? 100 - target : target;
  const multiplier = winChance > 0 ? (100 / winChance) * (1 - HOUSE_EDGE) : 0;
  const potentialProfit = betAmount * multiplier - betAmount;

  // Spin animation timer
  const animationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (animationInterval.current) clearInterval(animationInterval.current);
    };
  }, []);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const executeRoll = async () => {
    if (balance < betAmount || isRolling) return;
    
    setError(null);
    setIsRolling(true);
    setLastWon(null);
    playSound('click');

    // Start decimal spinner animation
    let tickCount = 0;
    animationInterval.current = setInterval(() => {
      setDisplayedRoll(Math.floor(Math.random() * 10001) / 100);
      tickCount++;
      if (tickCount % 3 === 0) playSound('dice');
    }, 45);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/games/dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, target, direction }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to complete bet');

      // Ensure animation lasts at least 400ms for visual polish
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 450 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }

      setDisplayedRoll(data.roll);
      setLastWon(data.won);
      
      if (data.won) {
        triggerWin(multiplier);
      } else {
        triggerLose();
      }

      // Add to history
      setHistory((prev) => [{ roll: data.roll, won: data.won }, ...prev].slice(0, 10));
      
      // Store verification details
      setVerifyData({
        serverSeed: data.serverSeed,
        serverSeedHash: data.serverSeedHash || 'Hash not returned',
        clientSeed: data.clientSeed,
        nonce: data.nonce,
        roll: data.roll,
      });

      await refresh();
      fetchTransactions();
    } catch (err: any) {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }
      setError(err.message || 'Connection error. Please try again.');
      setDisplayedRoll(50.0);
    } finally {
      setIsRolling(false);
    }
  };

  // Safe percentage offset for slider positioning
  const greenWidth = direction === 'under' ? target : 100 - target;
  const sliderProgress = target;

  return (
    <div className="relative min-h-[600px] w-full flex flex-col lg:flex-row gap-6 p-1 overflow-hidden select-none">
      <WinFlashOverlay />

      {/* Control Panel (Left column) */}
      <div className="w-full lg:w-[320px] shrink-0 z-10">
        <BetControlPanel
          betAmount={betAmount}
          onChangeBetAmount={setBetAmount}
          onSubmit={executeRoll}
          isSubmitting={isRolling}
          submitLabel={isRolling ? 'Rolling...' : 'Roll Bet'}
          balance={balance}
          multiplier={multiplier}
          profit={potentialProfit > 0 ? potentialProfit : 0}
        >
          {/* Custom Slider Direction Selector */}
          <div className="flex gap-2 p-1 bg-[#171a25] rounded-lg border border-white/5">
            <button
              onClick={() => setDirection('under')}
              disabled={isRolling}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-150 ${
                direction === 'under'
                  ? 'bg-[#242b3c] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Roll Under
            </button>
            <button
              onClick={() => setDirection('over')}
              disabled={isRolling}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-150 ${
                direction === 'over'
                  ? 'bg-[#242b3c] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Roll Over
            </button>
          </div>

          {/* Slider Chance Fields */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="bg-[#171a25] rounded-lg p-3 border border-white/5 text-center">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Win Chance</span>
              <span className="font-mono text-sm font-black text-white">{winChance.toFixed(2)}%</span>
            </div>
            <div className="bg-[#171a25] rounded-lg p-3 border border-white/5 text-center">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Multiplier</span>
              <span className="font-mono text-sm font-black text-yellow-500">{multiplier.toFixed(4)}x</span>
            </div>
          </div>
        </BetControlPanel>
      </div>

      {/* Main Game Screen (Right column) */}
      <div className="flex-1 min-h-[450px] bg-[#111622] rounded-xl border border-white/5 p-6 flex flex-col justify-between relative overflow-hidden">
        {/* Slow Animated Background blobs */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <div className="absolute w-[350px] h-[350px] rounded-full bg-gradient-to-br from-purple-800 to-indigo-900 blur-[100px] top-[-50px] left-[10%] animate-[pulse_10s_infinite_ease-in-out]" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-blue-900 to-pink-900 blur-[90px] bottom-[-50px] right-[10%] animate-[pulse_8s_infinite_ease-in-out_1s]" />
        </div>

        {/* Top bar (history + details) */}
        <div className="flex justify-between items-center z-10">
          <div className="flex gap-1.5 overflow-x-auto max-w-[70%] no-scrollbar pb-1">
            <AnimatePresence>
              {history.map((h, i) => (
                <motion.span
                  key={history.length - i}
                  initial={{ scale: 0, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`px-3 py-1 font-mono text-xs font-black rounded-full shrink-0 border ${
                    h.won 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {h.roll.toFixed(2)}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            {verifyData && (
              <button
                onClick={() => setShowVerify(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition duration-150"
              >
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span>Verify Fairness</span>
              </button>
            )}
          </div>
        </div>

        {/* Error panel */}
        {error && (
          <div className="my-2 p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs font-semibold text-center z-10">
            {error}
          </div>
        )}

        {/* Big digit spinner center display */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 z-10">
          <div className="relative">
            <div className={`text-6xl md:text-8xl font-mono font-black tracking-tight select-none transition-all duration-150 ${
              isRolling 
                ? 'blur-[2px] scale-98 text-gray-300' 
                : lastWon === true 
                  ? 'text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                  : lastWon === false 
                    ? 'text-red-400' 
                    : 'text-white'
            }`}>
              {displayedRoll !== null ? displayedRoll.toFixed(2) : '50.00'}
            </div>
            
            {!isRolling && lastWon !== null && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`absolute -top-6 -right-6 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  lastWon 
                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/30' 
                    : 'bg-red-500 text-white'
                }`}
              >
                {lastWon ? 'WIN' : 'LOSS'}
              </motion.div>
            )}
          </div>
          
          <div className="text-gray-400 text-xs mt-3 flex items-center gap-1.5">
            <Dices className="w-3.5 h-3.5" />
            <span>Target: {direction === 'over' ? '>' : '<'} {target.toFixed(2)}</span>
          </div>
        </div>

        {/* Slider Controls */}
        <div className="w-full bg-[#171b26]/80 backdrop-blur-sm rounded-xl p-6 border border-white/5 flex flex-col gap-6 z-10">
          <div className="relative w-full h-8 flex items-center">
            {/* Background slider track */}
            <div className="absolute inset-0 h-2 bg-[#ff3b30] rounded-full overflow-hidden">
              {/* Dynamic green zone fill */}
              <div 
                className="absolute h-full bg-[#34c759] transition-all duration-150"
                style={{
                  width: `${greenWidth}%`,
                  left: direction === 'under' ? 0 : `${target}%`
                }}
              />
            </div>

            {/* Custom Range Input */}
            <input
              type="range"
              min="2.00"
              max="98.00"
              step="0.01"
              value={target}
              disabled={isRolling}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTarget(val);
                playSound('bounce');
              }}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              className="absolute w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Draggable indicator handle */}
            <div 
              className={`absolute w-6 h-6 rounded-full bg-white border border-gray-300 shadow-md transform -translate-x-1/2 pointer-events-none transition-transform duration-100 flex items-center justify-center ${
                isDragging ? 'scale-125 shadow-lg shadow-white/20' : ''
              }`}
              style={{ left: `${sliderProgress}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#111622]" />
            </div>

            {/* Tick labels */}
            <div className="absolute bottom-[-24px] inset-x-0 flex justify-between px-1 text-[10px] font-bold text-gray-500 font-mono">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fairness verification modal overlay */}
      {showVerify && verifyData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2330] rounded-xl border border-white/10 max-w-lg w-full overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#171a25]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Fairness Verification</span>
              </h3>
              <button 
                onClick={() => setShowVerify(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Dice outcomes are determined deterministically using HMAC-SHA256. You can copy the seeds below to verify the result using a standard SHA256 script.
              </p>

              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Server Seed (Unhashed)</span>
                <div className="flex items-center justify-between bg-[#171a25] rounded p-2 text-xs font-mono text-white border border-white/5 overflow-hidden">
                  <span className="truncate max-w-[85%]">{verifyData.serverSeed}</span>
                  <button 
                    onClick={() => handleCopy(verifyData.serverSeed, 'server')}
                    className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded"
                  >
                    {copiedText === 'server' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Server Seed Hash (Committed)</span>
                <div className="flex items-center justify-between bg-[#171a25] rounded p-2 text-xs font-mono text-white border border-white/5 overflow-hidden">
                  <span className="truncate max-w-[85%]">{verifyData.serverSeedHash}</span>
                  <button 
                    onClick={() => handleCopy(verifyData.serverSeedHash, 'hash')}
                    className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded"
                  >
                    {copiedText === 'hash' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Client Seed</span>
                  <div className="flex items-center justify-between bg-[#171a25] rounded p-2 text-xs font-mono text-white border border-white/5 overflow-hidden">
                    <span className="truncate max-w-[70%]">{verifyData.clientSeed}</span>
                    <button 
                      onClick={() => handleCopy(verifyData.clientSeed, 'client')}
                      className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded"
                    >
                      {copiedText === 'client' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Nonce</span>
                  <div className="flex items-center justify-between bg-[#171a25] rounded p-2 text-xs font-mono text-white border border-white/5 overflow-hidden">
                    <span>{verifyData.nonce.toString()}</span>
                    <button 
                      onClick={() => handleCopy(verifyData.nonce.toString(), 'nonce')}
                      className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded"
                    >
                      {copiedText === 'nonce' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-2 p-3 bg-green-500/5 border border-green-500/10 rounded flex justify-between items-center text-xs">
                <span className="font-bold text-gray-400">Outcome Rolled</span>
                <span className="font-mono font-black text-green-400 text-sm">{verifyData.roll.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-[#171a25] flex justify-end">
              <button
                onClick={() => setShowVerify(false)}
                className="px-4 py-2 bg-primary text-black font-bold text-xs rounded transition duration-150 hover:brightness-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
