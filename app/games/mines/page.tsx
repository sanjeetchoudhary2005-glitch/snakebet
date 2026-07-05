'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Bomb, Settings2, HelpCircle, ChevronDown, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { calculateMultiplier } from '@/lib/provably-fair';
import { useWallet } from '@/context/WalletContext';
import { playSound } from '@/lib/sound';

// ----------------------------------------------------
// Number Tween Component
// ----------------------------------------------------
function NumberTween({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 300; // ms
    const startTime = performance.now();
    let animationFrameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuad
      const ease = progress * (2 - progress);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        prevValueRef.current = end;
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// ----------------------------------------------------
// Custom SVG Components for Gem and Bomb
// ----------------------------------------------------
function SvgGem({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 3L2 9L12 21L22 9L18 3H6Z"
        fill="url(#gem-gradient)"
        stroke="#00ffff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 3L12 9M18 3L12 9M2 9H22M12 9V21"
        stroke="#00ffff"
        strokeWidth="1.2"
        strokeOpacity="0.7"
      />
      <defs>
        <linearGradient id="gem-gradient" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="50%" stopColor="#00e701" />
          <stop offset="100%" stopColor="#005b82" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SvgBomb({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Bomb Body */}
      <circle cx="11" cy="13" r="7" fill="url(#bomb-gradient)" stroke="#ff4f4f" strokeWidth="1.5" />
      {/* Fuse Cap */}
      <rect x="9" y="5.5" width="4" height="2" rx="0.5" fill="#4a5568" stroke="#ff4f4f" strokeWidth="1" />
      {/* Spark */}
      <path
        d="M13 5C14.5 3.5 17 4 17 2.5C17 1 19 3 19 1M18.5 4.5L19.5 5.5M15.5 1.5L16.5 2.5"
        stroke="#ff9f43"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="17" cy="2.5" r="1.5" fill="#ff4f4f" className="animate-ping" />
      <defs>
        <radialGradient id="bomb-gradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3c3d42" />
          <stop offset="70%" stopColor="#111215" />
          <stop offset="100%" stopColor="#050506" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ----------------------------------------------------
// Main Mines Page Component
// ----------------------------------------------------
export default function MinesPage() {
  const { balance = 0, refresh: refreshWallet } = useWallet();

  // Game Play States
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed_out' | 'busted'>('idle');
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);

  // Tab & Auto Mode Settings
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [autoSelectedTiles, setAutoSelectedTiles] = useState<number[]>([]);
  const [autoBetCount, setAutoBetCount] = useState<number>(10);
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const autoBettingRef = useRef(false);

  // UI States
  const [isMinesDropdownOpen, setIsMinesDropdownOpen] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState(0);

  // Auto Bet Loop Cancel Handler
  useEffect(() => {
    return () => {
      autoBettingRef.current = false;
      setIsAutoBetting(false);
    };
  }, []);

  const gemsCount = 25 - mineCount;

  // Validation
  const isBetExceedsBalance = betAmount > balance;
  const isBetInvalid = betAmount <= 0 || isBetExceedsBalance || isNaN(betAmount);

  // Quick Bet multipliers
  const handleMultiply = (multiplier: number) => {
    playSound('click');
    setBetAmount((prev) => {
      const next = Math.round(prev * multiplier * 100) / 100;
      return next > balance ? balance : next < 10 ? 10 : next;
    });
  };

  // Start Manual Game
  const startManualGame = async () => {
    if (gameState === 'playing' || isBetInvalid) return;
    playSound('click');

    try {
      const response = await fetch('/api/games/mines/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, mineCount }),
      });

      const data = await response.json();
      if (response.ok) {
        setRoundId(data.roundId);
        setServerSeedHash(data.serverSeedHash || '');
        setClientSeed(data.clientSeed || '');
        setNonce(data.nonce || 0);
        setGameState('playing');
        setRevealedTiles([]);
        setCurrentMultiplier(1.0);
        setMinePositions([]);
        refreshWallet();
      } else {
        alert(data.error || 'Failed to start game');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to start game');
    }
  };

  // Reveal Tile
  const revealTile = async (index: number) => {
    if (gameState !== 'playing' || revealedTiles.includes(index)) return;
    playSound('click');

    try {
      const response = await fetch('/api/games/mines/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, tileIndex: index }),
      });

      const data = await response.json();
      if (response.ok) {
        setRevealedTiles((prev) => [...prev, index]);
        setCurrentMultiplier(data.currentMultiplier);

        if (data.isMine) {
          playSound('lose');
          setGameState('busted');
          setMinePositions(data.minePositions || []);
          refreshWallet();
        } else if (data.status === 'cashed_out') {
          playSound('win');
          setGameState('cashed_out');
          setMinePositions(data.minePositions || []);
          refreshWallet();
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to reveal tile');
    }
  };

  // Manual Cashout
  const handleCashOut = async () => {
    if (gameState !== 'playing') return;
    playSound('click');

    try {
      const response = await fetch('/api/games/mines/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = await response.json();
      if (response.ok) {
        playSound('win');
        setGameState('cashed_out');
        setMinePositions(data.minePositions || []);
        refreshWallet();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to cash out');
    }
  };

  // Random Pick Tile
  const handleRandomPick = () => {
    if (gameState !== 'playing') return;
    const unrevealed = Array.from({ length: 25 }, (_, i) => i).filter(
      (idx) => !revealedTiles.includes(idx)
    );
    if (unrevealed.length === 0) return;
    const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    revealTile(randomIdx);
  };

  // Auto Bet Loop Execution
  const runAutoBet = async () => {
    if (isAutoBetting) {
      autoBettingRef.current = false;
      setIsAutoBetting(false);
      return;
    }

    if (autoSelectedTiles.length === 0) {
      alert('Please select at least one tile on the grid for Auto Bet.');
      return;
    }

    if (isBetInvalid) return;

    playSound('click');
    autoBettingRef.current = true;
    setIsAutoBetting(true);

    let remainingRounds = autoBetCount;
    let roundIndex = 0;

    while (autoBettingRef.current && remainingRounds > 0) {
      try {
        setGameState('idle');
        setRevealedTiles([]);
        setMinePositions([]);
        setCurrentMultiplier(1.0);

        // 1. Start Game
        const startRes = await fetch('/api/games/mines/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ betAmount, mineCount }),
        });

        const startData = await startRes.json();
        if (!startRes.ok) {
          alert(startData.error || 'Failed to start auto round');
          break;
        }

        const activeRoundId = startData.roundId;
        setRoundId(activeRoundId);
        setServerSeedHash(startData.serverSeedHash || '');
        setClientSeed(startData.clientSeed || '');
        setNonce(startData.nonce || 0);
        setGameState('playing');
        refreshWallet();

        await new Promise((r) => setTimeout(r, 400));

        // 2. Sequentially reveal pre-selected tiles
        let activeBusted = false;
        let activeCashedOut = false;
        let finalMines: number[] = [];

        for (const tileIndex of autoSelectedTiles) {
          if (!autoBettingRef.current) break;

          const revRes = await fetch('/api/games/mines/reveal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roundId: activeRoundId, tileIndex }),
          });

          const revData = await revRes.json();
          if (!revRes.ok) {
            console.error('Auto reveal error:', revData.error);
            break;
          }

          setRevealedTiles((prev) => [...prev, tileIndex]);
          setCurrentMultiplier(revData.currentMultiplier);

          if (revData.isMine) {
            playSound('lose');
            setGameState('busted');
            activeBusted = true;
            finalMines = revData.minePositions || [];
            setMinePositions(finalMines);
            refreshWallet();
            break;
          } else if (revData.status === 'cashed_out') {
            playSound('win');
            setGameState('cashed_out');
            activeCashedOut = true;
            finalMines = revData.minePositions || [];
            setMinePositions(finalMines);
            refreshWallet();
            break;
          }

          await new Promise((r) => setTimeout(r, 450));
        }

        // 3. Cash out if active and not busted/cashed_out
        if (autoBettingRef.current && !activeBusted && !activeCashedOut) {
          await new Promise((r) => setTimeout(r, 300));
          const cashRes = await fetch('/api/games/mines/cashout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roundId: activeRoundId }),
          });

          const cashData = await cashRes.json();
          if (cashRes.ok) {
            playSound('win');
            setGameState('cashed_out');
            setMinePositions(cashData.minePositions || []);
            refreshWallet();
          } else {
            console.error('Auto cashout failed:', cashData.error);
          }
        }

        remainingRounds--;
        setAutoBetCount(remainingRounds);
        roundIndex++;

        // Delay between rounds
        if (remainingRounds > 0 && autoBettingRef.current) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      } catch (err) {
        console.error('Auto-bet loop error:', err);
        break;
      }
    }

    autoBettingRef.current = false;
    setIsAutoBetting(false);
  };

  // Toggle Auto Tile Selection
  const handleAutoTileClick = (idx: number) => {
    if (gameState === 'playing' || isAutoBetting) return;
    playSound('click');
    setAutoSelectedTiles((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  // Reset Game States back to idle/playable
  const resetOrIdle = () => {
    playSound('click');
    setGameState('idle');
    setRevealedTiles([]);
    setMinePositions([]);
    setCurrentMultiplier(1.0);
  };

  return (
    <div className="bg-[#0f141c] text-[#edeaf5] min-h-[calc(100vh-6rem)] py-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-[1000px] mx-auto px-4">
        {/* Main Grid: Control Panel + Board */}
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 items-stretch">
          
          {/* LEFT: Stake Control Panel Card */}
          <div className="bg-[#1a2c38] rounded-2xl border border-[#2f4553] shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Header Tabs (Manual / Auto) */}
            <div className="p-1.5 bg-[#0f141c]/60 flex rounded-t-2xl border-b border-[#2f4553]">
              <button
                disabled={gameState === 'playing' || isAutoBetting}
                onClick={() => {
                  playSound('click');
                  setMode('manual');
                }}
                className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all ${
                  mode === 'manual'
                    ? 'bg-[#2f4553] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-[#213743]/40'
                } disabled:opacity-50`}
              >
                Manual
              </button>
              <button
                disabled={gameState === 'playing' || isAutoBetting}
                onClick={() => {
                  playSound('click');
                  setMode('auto');
                }}
                className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all ${
                  mode === 'auto'
                    ? 'bg-[#2f4553] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-[#213743]/40'
                } disabled:opacity-50`}
              >
                Auto
              </button>
            </div>

            {/* Inner Controls Form */}
            <div className="p-5 flex-1 space-y-4">
              
              {/* Bet Amount Input field */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Bet Amount</span>
                  <span className="text-[#00e701] font-mono font-semibold">
                    ₹{betAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-stretch bg-[#0f141c] rounded-xl border border-[#2f4553] hover:border-gray-500 focus-within:border-[#00e701] transition-all">
                  <span className="flex items-center pl-3 text-gray-400 font-bold select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    disabled={gameState === 'playing' || isAutoBetting}
                    className="w-full bg-transparent border-0 px-2 py-3 text-white font-mono font-bold focus:outline-none focus:ring-0 disabled:opacity-50"
                  />
                  <div className="flex border-l border-[#2f4553]">
                    <button
                      type="button"
                      disabled={gameState === 'playing' || isAutoBetting}
                      onClick={() => handleMultiply(0.5)}
                      className="px-3.5 hover:bg-[#213743] text-gray-300 font-bold text-sm transition-all"
                    >
                      ½
                    </button>
                    <button
                      type="button"
                      disabled={gameState === 'playing' || isAutoBetting}
                      onClick={() => handleMultiply(2)}
                      className="px-3.5 border-l border-[#2f4553] hover:bg-[#213743] text-gray-300 font-bold text-sm transition-all rounded-r-xl"
                    >
                      2×
                    </button>
                  </div>
                </div>
                {isBetExceedsBalance && (
                  <div className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1">
                    <span>⚠️ Can't bet more than your balance!</span>
                  </div>
                )}
              </div>

              {/* Mines Dropdown Select */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Mines</span>
                </div>
                <button
                  type="button"
                  disabled={gameState === 'playing' || isAutoBetting}
                  onClick={() => {
                    playSound('click');
                    setIsMinesDropdownOpen(!isMinesDropdownOpen);
                  }}
                  className="w-full flex items-center justify-between bg-[#0f141c] hover:border-gray-500 border border-[#2f4553] rounded-xl px-4 py-3 font-mono font-bold text-white transition-all disabled:opacity-50 text-left"
                >
                  <span>{mineCount} Mines</span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>

                {/* Custom Options List */}
                <AnimatePresence>
                  {isMinesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#1a2c38] border border-[#2f4553] rounded-xl shadow-xl scrollbar-thin scrollbar-thumb-gray-700"
                    >
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setMineCount(m);
                            setIsMinesDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left font-mono font-semibold transition-all hover:bg-[#2f4553] ${
                            m === mineCount ? 'text-[#00e701] bg-[#213743]/50' : 'text-gray-300'
                          }`}
                        >
                          {m} Mines
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Gems Count (Read Only Display) */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Gems</span>
                </div>
                <div className="bg-[#0f141c]/50 text-gray-400 font-mono font-bold border border-[#2f4553]/70 rounded-xl px-4 py-3 flex justify-between items-center select-none">
                  <span>Safe Gems</span>
                  <span className="text-cyan-400">{gemsCount}</span>
                </div>
              </div>

              {/* Auto Bet Round Count */}
              {mode === 'auto' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>Number of Bets</span>
                  </div>
                  <input
                    type="number"
                    value={autoBetCount}
                    onChange={(e) => setAutoBetCount(parseInt(e.target.value) || 0)}
                    disabled={isAutoBetting}
                    min="1"
                    max="10000"
                    className="w-full bg-[#0f141c] hover:border-gray-500 border border-[#2f4553] rounded-xl px-4 py-3 font-mono font-bold text-white transition-all disabled:opacity-50"
                  />
                </div>
              )}

              {/* Core Play Buttons */}
              <div className="pt-2 space-y-3">
                {mode === 'manual' ? (
                  <>
                    {gameState !== 'playing' ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isBetInvalid}
                        onClick={startManualGame}
                        className="w-full py-4 bg-[#00e701] text-[#0f141c] font-black text-lg rounded-xl shadow-[0_0_20px_rgba(0,231,1,0.15)] hover:shadow-[0_0_25px_rgba(0,231,1,0.3)] hover:bg-[#10ff11] hover:brightness-110 transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {gameState === 'idle' ? 'Bet' : 'Play Again'}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCashOut}
                        className="w-full py-4 bg-cyan-400 text-[#0f141c] font-black text-lg rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:bg-cyan-300 hover:brightness-110 transition-all flex flex-col items-center justify-center leading-none"
                      >
                        <span className="uppercase tracking-wide text-xs opacity-80 mb-0.5">Cash Out</span>
                        <span className="text-base font-bold">
                          ₹{(betAmount * currentMultiplier).toFixed(2)}
                        </span>
                      </motion.button>
                    )}

                    {/* Secondary Button: Random Pick */}
                    <button
                      type="button"
                      onClick={handleRandomPick}
                      disabled={gameState !== 'playing'}
                      className={`w-full py-3.5 border-2 border-[#2f4553] text-gray-300 hover:text-white font-bold rounded-xl transition-all hover:bg-[#2f4553]/30 ${
                        gameState !== 'playing' ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      Random Pick
                    </button>
                  </>
                ) : (
                  /* Auto Mode Play Buttons */
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={runAutoBet}
                      disabled={isBetInvalid && !isAutoBetting}
                      className={`w-full py-4 font-black text-lg rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 ${
                        isAutoBetting
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                          : 'bg-[#00e701] text-[#0f141c] shadow-[0_0_20px_rgba(0,231,1,0.15)] hover:bg-[#10ff11]'
                      }`}
                    >
                      {isAutoBetting ? 'Stop Auto Bet' : 'Start Auto Bet'}
                    </motion.button>

                    {/* Clear selection when idle */}
                    {autoSelectedTiles.length > 0 && !isAutoBetting && (
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setAutoSelectedTiles([]);
                        }}
                        className="w-full text-center text-xs font-bold text-gray-400 hover:text-red-400 transition-all py-1.5"
                      >
                        Clear pre-selected ({autoSelectedTiles.length})
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>

            {/* Total Profit Status Section (bottom of Left Panel) */}
            <div className="bg-[#0f141c]/50 p-4 border-t border-[#2f4553] flex justify-between items-center font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  Multiplier
                </span>
                <span className="text-white text-lg font-black">
                  <NumberTween value={currentMultiplier} suffix="x" />
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  Total Profit
                </span>
                <span className="text-[#00e701] text-lg font-black">
                  ₹
                  <NumberTween
                    value={
                      gameState === 'cashed_out' || (gameState === 'playing' && currentMultiplier > 1.0)
                        ? betAmount * currentMultiplier - betAmount
                        : 0.00
                    }
                  />
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT: Game Board Column */}
          <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-[#1a2c38]/40 border border-[#2f4553]/60 rounded-2xl shadow-xl">
            
            {/* Live Progress Bar indicator */}
            <div className="w-full max-w-[500px] mb-4 flex items-center justify-between text-xs font-bold uppercase text-gray-400 tracking-wider px-1.5">
              <div className="flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-[#00e701]" />
                <span>Gems Left: {Math.max(0, gemsCount - (gameState === 'playing' || gameState === 'cashed_out' ? revealedTiles.length : 0))}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bomb className="w-4 h-4 text-red-500" />
                <span>Mines: {mineCount}</span>
              </div>
            </div>

            {/* 5x5 perfectly square grid of tiles */}
            <div className="w-full max-w-[500px] aspect-square grid grid-cols-5 gap-2.5 p-3.5 bg-[#0f141c] rounded-2xl border border-[#2f4553] shadow-inner">
              {Array.from({ length: 25 }).map((_, index) => {
                const isRevealed = revealedTiles.includes(index);
                const isMine = minePositions.includes(index);
                const isSafeReveal = isRevealed && !isMine;
                
                // End game reveal modifiers
                const isMissedMine = !isRevealed && isMine && (gameState === 'cashed_out' || gameState === 'busted');
                const isMissedSafe = !isRevealed && !isMine && (gameState === 'cashed_out' || gameState === 'busted');

                // Auto Select highlighters
                const isAutoSelected = mode === 'auto' && autoSelectedTiles.includes(index);

                return (
                  <button
                    key={index}
                    disabled={
                      (mode === 'manual' && (gameState !== 'playing' || isRevealed)) ||
                      (mode === 'auto' && (gameState === 'playing' || isAutoBetting))
                    }
                    onClick={() => {
                      if (mode === 'manual') {
                        revealTile(index);
                      } else {
                        handleAutoTileClick(index);
                      }
                    }}
                    className={`relative w-full aspect-square rounded-xl text-3xl font-bold transition-all overflow-hidden flex items-center justify-center select-none ${
                      isSafeReveal
                        ? 'bg-[#00e701]/10 border-2 border-[#00e701] shadow-[0_0_15px_rgba(0,231,1,0.2)]'
                        : isMine
                        ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : isMissedMine
                        ? 'bg-red-950/20 border border-red-700/40 opacity-50'
                        : isMissedSafe
                        ? 'bg-[#1a2c38]/40 border border-[#2f4553]/40 opacity-40'
                        : isAutoSelected
                        ? 'border-2 border-dashed border-[#00f0ff] bg-[#2f4553]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-gradient-to-b from-[#2f4553] to-[#213743] hover:from-[#3d5767] hover:to-[#2b4453] border border-[#3e5667]/50 active:scale-95'
                    } ${
                      ((mode === 'manual' && gameState === 'playing' && !isRevealed) || 
                       (mode === 'auto' && !isAutoBetting)) 
                        ? 'cursor-pointer' 
                        : 'cursor-not-allowed'
                    }`}
                  >
                    {/* Gem Reveal Visual */}
                    {isSafeReveal && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1.05, rotate: 0 }}
                        className="absolute inset-0 flex items-center justify-center p-2"
                      >
                        <SvgGem className="w-[70%] h-[70%]" />
                      </motion.div>
                    )}

                    {/* Mine Explosion Visual */}
                    {isMine && isRevealed && (
                      <motion.div
                        animate={{ x: [0, -5, 5, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center p-2"
                      >
                        <SvgBomb className="w-[70%] h-[70%]" />
                      </motion.div>
                    )}

                    {/* Missed Mine/Gem end game views */}
                    {isMissedMine && <SvgBomb className="w-[50%] h-[50%] opacity-40" />}
                    {isMissedSafe && <SvgGem className="w-[50%] h-[50%] opacity-20" />}

                    {/* Auto Target Highlight Indicator */}
                    {isAutoSelected && (
                      <div className="absolute inset-0 border-2 border-[#00f0ff] rounded-xl flex items-center justify-center">
                        <span className="text-[10px] text-[#00f0ff] font-bold font-mono">
                          #{autoSelectedTiles.indexOf(index) + 1}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Victory/Bust Floating Dialog */}
            <div className="h-10 mt-4 flex items-center justify-center font-bold">
              <AnimatePresence>
                {gameState === 'cashed_out' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-[#00e701] text-[#0f141c] px-6 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer"
                    onClick={resetOrIdle}
                  >
                    <span>🎉 Win! Multiplier: {currentMultiplier.toFixed(2)}x</span>
                  </motion.div>
                )}
                {gameState === 'busted' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-red-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer"
                    onClick={resetOrIdle}
                  >
                    <span>💥 Busted! Try Again</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Provably Fair details toggle */}
            <div className="w-full max-w-[500px] mt-2 border-t border-[#2f4553]/50 pt-3">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setShowProvablyFair(!showProvablyFair);
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-all font-bold"
              >
                <Settings2 className="w-4 h-4" />
                <span>Provably Fair Settings</span>
              </button>

              {showProvablyFair && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 bg-[#0f141c]/80 border border-[#2f4553]/70 rounded-xl p-3.5 space-y-2 text-xs font-mono select-all overflow-hidden"
                >
                  <div>
                    <div className="text-gray-500 font-bold">Server Seed Hash:</div>
                    <div className="text-gray-300 break-all select-all">{serverSeedHash || 'Generated on bet'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-500 font-bold">Client Seed:</div>
                      <div className="text-gray-300 break-all select-all">{clientSeed || 'Generated on bet'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-bold">Nonce:</div>
                      <div className="text-gray-300">{nonce}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
