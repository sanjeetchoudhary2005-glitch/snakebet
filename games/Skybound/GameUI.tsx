
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameProps } from '@/lib/gameTypes';
import { Play, StopCircle, Settings, History, TrendingUp, CheckCircle2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoplay } from '@/hooks/useAutoplay';
import { generateSeed, hashSeed, generateCrashPoint } from '@/lib/provably-fair';

// --- Types ---
type GameState = 'waiting' | 'betting' | 'running' | 'crashed';
interface RoundEntry {
  id: string;
  crashPoint: number;
  serverSeedHash: string;
  serverSeed: string | null; // null until round ends
  clientSeed: string;
  nonce: number;
  timestamp: number;
}

// --- GameUI Component ---
const GameUI: React.FC<GameProps> = ({ 
  onBet, 
  onCashOut, 
  isPlaying: isGamePlaying, 
  currentMultiplier, 
  userBalance = 1000, 
  gameId 
}) => {
  // --- Game Core State ---
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [displayMultiplier, setDisplayMultiplier] = useState<number>(1.0);
  const [betAmount, setBetAmount] = useState<number>(20.0);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);
  const [betPlaced, setBetPlaced] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [roundHistory, setRoundHistory] = useState<RoundEntry[]>([]);
  
  // --- Provably Fair State ---
  const [clientSeed, setClientSeed] = useState<string>(() => generateSeed());
  const [nonce, setNonce] = useState<number>(0);
  const [currentServerSeed, setCurrentServerSeed] = useState<string>('');
  const [currentServerSeedHash, setCurrentServerSeedHash] = useState<string>('');
  const [showProvablyFairModal, setShowProvablyFairModal] = useState(false);

  // --- Round Lifecycle Refs ---
  const animationFrameRef = useRef<number | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  const lastStateChangeRef = useRef<number>(Date.now());
  const hasCrashedRef = useRef<boolean>(false);
  const roundResultProcessedRef = useRef<boolean>(false);
  const currentCrashPointRef = useRef<number>(1.0);

  // --- Autoplay ---
  const [autoplayMaxRounds, setAutoplayMaxRounds] = useState(10);
  const [autoplayLossLimit, setAutoplayLossLimit] = useState(50);
  const [autoplayProfitTarget, setAutoplayProfitTarget] = useState(100);
  const {
    isActive: isAutoplayActive,
    currentRound,
    sessionProfit,
    stopReason,
    startAutoplay,
    stopAutoplay,
    registerRoundResult
  } = useAutoplay({
    maxRounds: autoplayMaxRounds,
    lossLimit: autoplayLossLimit,
    profitTarget: autoplayProfitTarget,
    betAmount,
    onPlaceBet: () => handleBet(),
    canPlaceBet: gameState === 'betting' && !betPlaced && betAmount <= userBalance
  });

  // --- Helpers ---
  const addRoundToHistory = (crashPoint: number, serverSeed: string, serverSeedHash: string) => {
    const newEntry: RoundEntry = {
      id: Date.now().toString(),
      crashPoint,
      serverSeedHash,
      serverSeed,
      clientSeed,
      nonce,
      timestamp: Date.now()
    };
    setRoundHistory(prev => [newEntry, ...prev].slice(0, 20));
  };

  // --- Game State Transitions ---
  const startRound = useCallback(() => {
    // 1. Generate new server seed & store hash (show to user)
    const newServerSeed = generateSeed();
    const newServerSeedHash = hashSeed(newServerSeed);
    setCurrentServerSeed(newServerSeed);
    setCurrentServerSeedHash(newServerSeedHash);

    // 2. Pre-roll crash point (but keep secret from user!)
    const crashPoint = generateCrashPoint(newServerSeed, clientSeed, nonce);
    currentCrashPointRef.current = crashPoint;
    
    // 3. Reset bet state
    setBetPlaced(false);
    setHasCashedOut(false);
    roundResultProcessedRef.current = false;
    
    // 4. Enter betting phase
    setGameState('betting');
    setDisplayMultiplier(1.0);
    lastStateChangeRef.current = Date.now();

    // 5. Auto-start running phase after countdown (3 sec)
    setTimeout(() => {
      if (gameState === 'betting') {
        startRunningPhase();
      }
    }, 3000);
  }, [clientSeed, nonce]);

  const startRunningPhase = useCallback(() => {
    setGameState('running');
    roundStartTimeRef.current = Date.now();
    hasCrashedRef.current = false;
    lastStateChangeRef.current = Date.now();

    // Start exponential multiplier animation
    const animate = () => {
      const elapsedMs = Date.now() - roundStartTimeRef.current;
      const growthRate = 0.0005; // SLOWER growth rate so users have time to cash out
      const currentMult = Math.exp(growthRate * elapsedMs); // m(t) = e^(kt)

      if (currentMult >= currentCrashPointRef.current && !hasCrashedRef.current) {
        handleCrash();
        return;
      }

      setDisplayMultiplier(currentMult);

      // Auto-cashout if enabled
      if (autoCashout > 0 && currentMult >= autoCashout && betPlaced && !hasCashedOut) {
        handleCashOut();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [autoCashout, betPlaced, hasCashedOut]);

  const handleCrash = useCallback(() => {
    hasCrashedRef.current = true;
    setGameState('crashed');
    setDisplayMultiplier(currentCrashPointRef.current);
    lastStateChangeRef.current = Date.now();

    // Settle bet (if placed and not cashed out)
    if (betPlaced && !hasCashedOut) {
      registerRoundResult(false, -betAmount);
    }
    roundResultProcessedRef.current = true;

    // Add to history (reveal server seed!)
    addRoundToHistory(
      currentCrashPointRef.current,
      currentServerSeed,
      currentServerSeedHash
    );

    // Move to next round
    setTimeout(() => {
      setNonce(n => n + 1);
      startRound();
    }, 4000);
  }, [betPlaced, hasCashedOut, registerRoundResult, betAmount, currentServerSeed, currentServerSeedHash, startRound]);

  const handleBet = () => {
    if (gameState !== 'betting' || betAmount < 20 || betAmount > 100000) return;
    setBetPlaced(true);
    onBet(betAmount, { autoCashout });
  };

  const handleCashOut = () => {
    if (gameState !== 'running' || !betPlaced || hasCrashedRef.current) return;
    setHasCashedOut(true);
    
    const profit = betAmount * displayMultiplier;
    onCashOut();
    registerRoundResult(true, profit);
    roundResultProcessedRef.current = true;
  };

  // --- Watchdog: Auto-recover from freezes ---
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastChange = now - lastStateChangeRef.current;
      const expectedTimeout = 15000; // Max expected time for any phase (safe buffer)

      if (timeSinceLastChange > expectedTimeout) {
        console.warn("WATCHDOG: Game state hasn't changed in too long, forcing reset!");
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        startRound(); // Force new round
      }
    }, 5000);

    return () => clearInterval(watchdogInterval);
  }, [startRound]);

  // --- Initial Load: Start first round ---
  useEffect(() => {
    startRound();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // --- Render ---
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto pb-6">
      {/* --- Left: Game Area --- */}
      <div className="flex-1">
        <Card className="p-0 overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-[#050505] to-[#0a0a0a]">
            {/* --- Background Starfield (Placeholder for later 3D) --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/20 animate-pulse"
                  style={{
                    width: Math.random() * 3 + 1,
                    height: Math.random() * 3 + 1,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 3 + 2}s`
                  }}
                />
              ))}
            </div>

            {/* --- Canvas Placeholder --- */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="absolute inset-0 w-full h-full opacity-20"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line x1="0" y1="100" x2="100" y2="100" stroke="#1a1a1a" strokeWidth="0.5" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#1a1a1a" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#1a1a1a" strokeWidth="0.5" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="#1a1a1a" strokeWidth="0.5" />
              </svg>

              {/* --- Main Multiplier Display --- */}
              <motion.div
                key={displayMultiplier}
                initial={{ scale: 1 }}
                animate={{ scale: gameState === 'running' ? [1, 1.02, 1] : 1 }}
                transition={{ repeat: gameState === 'running' ? Infinity : 0, duration: 0.8 }}
                className="relative z-10"
              >
                <h1
                  className={`text-7xl md:text-8xl font-black tracking-tighter ${
                    gameState === 'crashed'
                      ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                      : 'text-primary drop-shadow-[0_0_30px_rgba(0,231,1,0.4)]'
                  }`}
                >
                  {displayMultiplier.toFixed(2)}x
                </h1>
                <div className="text-center text-sm text-gray-400 mt-2">
                  {gameState === 'waiting' && 'Starting next round...'}
                  {gameState === 'betting' && 'Place your bets!'}
                  {gameState === 'running' && 'Cash out now!'}
                  {gameState === 'crashed' && 'Crashed!'}
                </div>
              </motion.div>
            </div>

            {/* --- Round History Bar --- */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 px-4">
              {roundHistory.slice(0, 10).map((entry, idx) => (
                <div
                  key={entry.id}
                  onClick={() => setShowProvablyFairModal(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-transform hover:scale-105 ${
                    entry.crashPoint >= 2
                      ? 'bg-primary/20 border border-primary/50 text-primary'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  {entry.crashPoint.toFixed(2)}x
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* --- Live Activity Feed --- */}
        <Card className="mt-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-primary" />
            <h3 className="font-bold text-xl">Recent Rounds</h3>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {roundHistory.slice(0, 10).map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between text-sm p-3 rounded-lg border ${
                  entry.crashPoint >= 2
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <span className="text-gray-400">#{roundHistory.length - idx}</span>
                <span className="font-bold" style={{ color: entry.crashPoint >= 2 ? '#00e701' : '#ef4444' }}>
                  {entry.crashPoint.toFixed(2)}x
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* --- Right: Bet Panel --- */}
      <div className="lg:w-80">
        <Card className="p-6 space-y-6">
          {/* --- Balance --- */}
          <div className="text-center">
            <p className="text-xs text-muted-light uppercase tracking-wider mb-1">Demo Balance</p>
            <p className="text-2xl font-black text-primary">₹{userBalance.toLocaleString()}</p>
          </div>

          {/* --- Bet Amount --- */}
          <div>
            <label className="block text-sm font-semibold mb-3">Bet Amount</label>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setBetAmount(val < 20 ? 20 : val > 100000 ? 100000 : val);
                }}
                min={20}
                max={100000}
                step={1}
                className="flex-1 px-4 py-3 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[20, 50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className="px-3 py-2 bg-secondary border border-gray-700 rounded-lg hover:border-primary font-bold text-sm"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* --- Auto Cashout --- */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                Auto Cashout
                <span className="text-muted text-xs">(optional)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(parseFloat(e.target.value) || 2)}
                min={1.01}
                step={0.01}
                className="flex-1 px-4 py-3 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold"
              />
              <div className="text-2xl font-bold text-muted px-3 flex items-center">x</div>
            </div>
          </div>

          {/* --- Autoplay --- */}
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" /> Autoplay
              </label>
              <button
                onClick={isAutoplayActive ? stopAutoplay : startAutoplay}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  isAutoplayActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-primary hover:bg-green-600 text-black'
                }`}
              >
                {isAutoplayActive ? (
                  <><StopCircle className="w-4 h-4 mr-2 inline" /> Stop</>
                ) : (
                  <><Play className="w-4 h-4 mr-2 inline" /> Start</>
                )}
              </button>
            </div>

            {isAutoplayActive ? (
              <div className="space-y-3 p-3 bg-secondary/50 rounded-xl border border-primary/30">
                <div className="flex items-center justify-between text-sm">
                  <span>Round:</span>
                  <span className="font-bold text-primary">{currentRound} / {autoplayMaxRounds}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Session P/L:</span>
                  <span className={`font-bold ${sessionProfit >= 0 ? 'text-primary' : 'text-red-400'}`}>
                    ₹{sessionProfit.toFixed(2)}
                  </span>
                </div>
                {stopReason && <p className="text-xs text-red-400 text-center">{stopReason}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-light mb-1 block">Max Rounds</label>
                  <input
                    type="number"
                    value={autoplayMaxRounds}
                    onChange={(e) => setAutoplayMaxRounds(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-full px-3 py-2 bg-background rounded-lg border border-gray-700 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-light mb-1 block">Loss Limit (₹)</label>
                  <input
                    type="number"
                    value={autoplayLossLimit}
                    onChange={(e) => setAutoplayLossLimit(Math.max(1, parseFloat(e.target.value) || 1))}
                    min={1}
                    className="w-full px-3 py-2 bg-background rounded-lg border border-gray-700 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-light mb-1 block">Profit Target (₹)</label>
                  <input
                    type="number"
                    value={autoplayProfitTarget}
                    onChange={(e) => setAutoplayProfitTarget(Math.max(1, parseFloat(e.target.value) || 1))}
                    min={1}
                    className="w-full px-3 py-2 bg-background rounded-lg border border-gray-700 focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* --- Main Action Button --- */}
          <Button
            variant={
              gameState === 'betting' && !betPlaced
                ? 'primary'
                : gameState === 'running' && betPlaced && !hasCashedOut
                ? 'destructive'
                : 'secondary'
            }
            size="xl"
            disabled={
              (gameState === 'betting' && betPlaced) ||
              (gameState === 'running' && hasCashedOut) ||
              betAmount > userBalance
            }
            onClick={
              gameState === 'betting' && !betPlaced
                ? handleBet
                : gameState === 'running' && betPlaced && !hasCashedOut
                ? handleCashOut
                : () => {}
            }
            className="w-full py-5 text-xl"
          >
            {gameState === 'betting' && !betPlaced && (
              <><Play className="w-6 h-6 mr-2" /> Place Bet</>
            )}
            {gameState === 'betting' && betPlaced && (
              <><CheckCircle2 className="w-6 h-6 mr-2" /> Bet Placed</>
            )}
            {gameState === 'running' && betPlaced && !hasCashedOut && (
              <><CheckCircle2 className="w-6 h-6 mr-2" /> Cash Out</>
            )}
            {gameState === 'running' && betPlaced && hasCashedOut && (
              <><CheckCircle2 className="w-6 h-6 mr-2" /> Cashed Out</>
            )}
            {(gameState === 'waiting' || gameState === 'crashed') && 'Waiting for next round'}
          </Button>
        </Card>

        {/* --- Provably Fair Info --- */}
        <Card className="p-6 mt-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <History className="text-primary" /> Provably Fair
          </h3>
          <div className="text-xs text-muted space-y-2">
            <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-gray-800">
              <span className="text-gray-300">Server Seed Hash:</span>
              <span className="font-mono text-primary text-xs break-all max-w-[200px]">{currentServerSeedHash.slice(0, 32)}...</span>
            </div>
            <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-gray-800">
              <span className="text-gray-300">Client Seed:</span>
              <span className="font-mono text-primary text-xs break-all max-w-[200px]">{clientSeed.slice(0, 32)}...</span>
            </div>
            <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-gray-800">
              <span className="text-gray-300">Nonce:</span>
              <span className="font-mono text-primary">{nonce}</span>
            </div>
            <button
              onClick={() => setShowProvablyFairModal(true)}
              className="w-full text-primary hover:underline text-sm font-semibold mt-2"
            >
              Verify Last Round
            </button>
          </div>
        </Card>
      </div>

      {/* --- Provably Fair Modal --- */}
      <AnimatePresence>
        {showProvablyFairModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-secondary border border-gray-700 rounded-2xl p-8 max-w-lg w-full"
            >
              <h2 className="text-2xl font-black text-white mb-6">Verify Round Fairness</h2>
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  The crash point is generated using HMAC-SHA256(serverSeed, clientSeed:nonce), making
                  it completely verifiable and impossible to rig after the round.
                </p>
                {roundHistory.length > 0 && (
                  <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Server Seed (revealed after crash)</p>
                      <p className="font-mono text-xs break-all text-primary">{roundHistory[0].serverSeed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Client Seed</p>
                      <p className="font-mono text-xs break-all text-white">{roundHistory[0].clientSeed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Nonce</p>
                      <p className="font-mono text-xs text-white">{roundHistory[0].nonce}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Crash Point</p>
                      <p className="font-bold text-xl text-primary">{roundHistory[0].crashPoint.toFixed(2)}x</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowProvablyFairModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Server Seed: ${roundHistory[0]?.serverSeed || ''}\nClient Seed: ${roundHistory[0]?.clientSeed || ''}\nNonce: ${roundHistory[0]?.nonce || ''}`
                      );
                    }}
                  >
                    Copy Seeds
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameUI;
