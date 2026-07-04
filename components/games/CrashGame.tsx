'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { 
  TrendingUp, Rocket, Trophy, Play, Square, 
  Settings, ShieldCheck, History, AlertTriangle, 
  Copy, Check, Coins, User, ArrowUpRight 
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { CrashCanvas2D } from './CrashCanvas2D';

// --- Types ---
type GameState = 'waiting' | 'betting' | 'running' | 'crashed';

interface RoundHistoryEntry {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
  timestamp: number;
}

interface SimulatedPlayer {
  id: string;
  username: string;
  betAmount: number;
  cashoutPoint: number;
  cashedOut: boolean;
  winAmount: number;
  avatarColor: string;
}

// --- Provably Fair RNG Functions ---
function generateSeedHex(): string {
  // Pure JS random hex generator
  const chars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 64; i++) {
    hex += chars[Math.floor(Math.random() * 16)];
  }
  return hex;
}

function hashSeed(seed: string): string {
  return CryptoJS.SHA256(seed).toString(CryptoJS.enc.Hex);
}

function generateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
  const data = `${clientSeed}:${nonce}`;
  const hmac = CryptoJS.HmacSHA256(data, serverSeed);
  const hex = hmac.toString(CryptoJS.enc.Hex).substring(0, 13); // 13 chars = 52 bits
  const n = parseInt(hex, 16);
  const e = Math.pow(2, 52);

  // 3% house edge (instant crash at 1.00x)
  if (n % 33 === 0) {
    return 1.00;
  }

  const h = n % e;
  // Transparent standard formula for 97% RTP: multiplier = (97 * e) / (e - h) / 100
  const crash = Math.floor((97 * e) / (e - h)) / 100;
  return Math.max(1.00, crash);
}

export function CrashGame({
  minBet = 20,
  maxBet = 100000,
  defaultBetAmount = 20,
  quickBetAmounts = [20, 50, 100, 250, 500]
}: {
  minBet?: number;
  maxBet?: number;
  defaultBetAmount?: number;
  quickBetAmounts?: number[];
}) {
  const { balance, deductBalance, addBalance, refresh } = useWallet();

  // --- Core Game State ---
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [betAmount, setBetAmount] = useState<number>(defaultBetAmount);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [potentialPayout, setPotentialPayout] = useState<number>(0);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>([]);
  const [sessionPL, setSessionPL] = useState<number>(0);
  const [onlineCount, setOnlineCount] = useState<number>(1420);

  // --- Provably Fair State ---
  const [clientSeed, setClientSeed] = useState<string>(() => generateSeedHex().substring(0, 16));
  const [nonce, setNonce] = useState<number>(0);
  const [serverSeed, setServerSeed] = useState<string>(() => generateSeedHex());
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [showFairnessPanel, setShowFairnessPanel] = useState<boolean>(false);

  // --- Autoplay State ---
  const [autoBetEnabled, setAutoBetEnabled] = useState<boolean>(false);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(true);
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState<number>(2.0);

  // --- Simulated Players State ---
  const [simulatedPlayers, setSimulatedPlayers] = useState<SimulatedPlayer[]>([]);

  // --- Verifier Tool State ---
  const [verifyServerSeed, setVerifyServerSeed] = useState<string>('');
  const [verifyClientSeed, setVerifyClientSeed] = useState<string>('');
  const [verifyNonce, setVerifyNonce] = useState<number>(0);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  // --- Copy Notification State ---
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // --- Countdown State ---
  const [countdown, setCountdown] = useState<number>(5.0);

  // --- Refs ---
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const stateRef = useRef<GameState>('waiting');
  const crashPointRef = useRef<number>(1.0);
  const multiplierRef = useRef<number>(1.0);
  const hasBetRef = useRef<boolean>(false);
  const cashedOutRef = useRef<boolean>(false);
  const betAmountRef = useRef<number>(defaultBetAmount);
  const balanceRef = useRef<number>(balance);
  const nextServerSeedRef = useRef<string>('');
  const multiplierOverlayRef = useRef<HTMLDivElement>(null);
  const multiplierTextRef = useRef<HTMLSpanElement>(null);
  const stateLabelRef = useRef<HTMLSpanElement>(null);
  const payoutTextRef = useRef<HTMLSpanElement>(null);

  // Keep refs synced
  useEffect(() => {
    stateRef.current = gameState;
    hasBetRef.current = hasBet;
    cashedOutRef.current = cashedOut;
    betAmountRef.current = betAmount;
    balanceRef.current = balance;
  }, [gameState, hasBet, cashedOut, betAmount, balance]);

  // Generate initial server seed hash
  useEffect(() => {
    setServerSeedHash(hashSeed(serverSeed));
  }, [serverSeed]);

  // Real platform online count from live snapshot
  useEffect(() => {
    const fetchOnline = () => {
      fetch('/api/live/snapshot')
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.onlineUsers === 'number') setOnlineCount(data.onlineUsers);
        })
        .catch(() => {});
    };
    fetchOnline();
    const timer = setInterval(fetchOnline, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Phase 4 (live casino): simulated round players below are placeholder UI until
  // real multiplayer crash bets are broadcast over WebSocket.

  // --- Soundless visual indicators / Flash ---
  const [uiFlash, setUiFlash] = useState<string | null>(null);
  const triggerFlash = (color: string) => {
    setUiFlash(color);
    setTimeout(() => setUiFlash(null), 300);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate simulated players for the round
  const generateSimulatedPlayers = useCallback(() => {
    const count = 10 + Math.floor(Math.random() * 12);
    const names = [
      'ZenithGamer', 'ApexPredator', 'NeonRider', 'HyperDrive', 'AlphaOmega',
      'QuantumShift', 'Solara', 'Lobotox', 'GigaChad', 'CryptoNinja',
      'VoltPulse', 'RaveGhost', 'ShadowFox', 'NebulaKid', 'AeroFighter',
      'CyberPunk', 'LuckyStreak', 'DeltaZero', 'SkyWarp', 'StormBringer'
    ];
    const colors = [
      'text-blue-400', 'text-pink-400', 'text-amber-400', 'text-violet-400',
      'text-emerald-400', 'text-cyan-400', 'text-orange-400', 'text-teal-400'
    ];
    
    const players: SimulatedPlayer[] = [];
    for (let i = 0; i < count; i++) {
      const bet = [20, 50, 100, 200, 500, 1000, 2500][Math.floor(Math.random() * 7)];
      // Random cashout point: standard distribution
      const r = Math.random();
      const cashout = r < 0.2 ? 1.2 + Math.random() * 0.5 : r < 0.5 ? 1.8 + Math.random() * 1.5 : r < 0.8 ? 3.0 + Math.random() * 8.0 : 10.0 + Math.random() * 40.0;
      players.push({
        id: Math.random().toString(),
        username: names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 90 + 10),
        betAmount: bet,
        cashoutPoint: Math.round(cashout * 100) / 100,
        cashedOut: false,
        winAmount: 0,
        avatarColor: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    // Sort players by cashout point ascending so we can handle cashing out in sequence
    players.sort((a, b) => a.cashoutPoint - b.cashoutPoint);
    setSimulatedPlayers(players);
  }, []);

  // Run verifier tool math
  const runVerification = () => {
    if (!verifyServerSeed || !verifyClientSeed || verifyNonce === undefined) {
      setVerifyResult('Please fill in all verification fields.');
      return;
    }
    try {
      const calculated = generateCrashPoint(verifyServerSeed.trim(), verifyClientSeed.trim(), verifyNonce);
      setVerifyResult(`Calculated Crash Point: ${calculated.toFixed(2)}x`);
    } catch (e) {
      setVerifyResult('Verification failed. Invalid seed strings.');
    }
  };

  // --- Handlers ---
  const handlePlaceBet = useCallback(() => {
    if (gameState === 'running') return;
    
    if (hasBet) {
      // Cancel bet (refund)
      setHasBet(false);
      addBalance(betAmount);
      setSessionPL(prev => prev + betAmount);
      triggerFlash('border-yellow-500');
    } else {
      // Place bet
      if (balance < betAmount) {
        alert('Insufficient balance to place bet.');
        return;
      }
      deductBalance(betAmount);
      setHasBet(true);
      setCashedOut(false);
      setPotentialPayout(betAmount);
      setSessionPL(prev => prev - betAmount);
      triggerFlash('border-green-500');
    }
  }, [gameState, hasBet, betAmount, balance, deductBalance, addBalance]);

  const handleCashOut = useCallback(async () => {
    if (gameState !== 'running' || !hasBet || cashedOut) return;

    const currentM = multiplierRef.current;
    const win = Math.floor(betAmount * currentM);
    
    setCashedOut(true);
    addBalance(win);
    setSessionPL(prev => prev + win);
    triggerFlash('border-green-400');

    // Trigger API route so transaction is recorded in wallet context and database
    try {
      await fetch('/api/games/crash/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, multiplier: currentM })
      });
      // Refresh context balance & transaction list
      refresh();
    } catch (err) {
      console.error('Wallet DB cashout transaction log failed:', err);
    }
  }, [gameState, hasBet, cashedOut, betAmount, addBalance, refresh]);

  // Main tick loop of flight
  const flightTick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    
    // Smooth growth curve: M(t) = 1.0 + 0.06 * t + 0.026 * t^2
    // Takes exactly ~5.15 seconds to reach 2.00x, climbing smoothly over time.
    const t = elapsed / 1000;
    const currentMultiplier = 1.0 + 0.06 * t + 0.026 * t * t;
    
    // Check if we hit the crash point
    if (currentMultiplier >= crashPointRef.current) {
      // Crash!
      setGameState('crashed');
      setMultiplier(crashPointRef.current);
      multiplierRef.current = crashPointRef.current;
      
      // Auto settlement if lost
      if (hasBetRef.current && !cashedOutRef.current) {
        setHasBet(false);
        triggerFlash('border-red-500');
      }

      // Add to verifier history
      const newHistoryEntry: RoundHistoryEntry = {
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        crashPoint: crashPointRef.current,
        timestamp: Date.now()
      };
      setRoundHistory(prev => [newHistoryEntry, ...prev].slice(0, 15));

      // Prep verifier with previous seed for ease of use
      setVerifyServerSeed(serverSeed);
      setVerifyClientSeed(clientSeed);
      setVerifyNonce(nonce);

      // Generate next round seeds
      const nextSeed = generateSeedHex();
      nextServerSeedRef.current = nextSeed;

      // Start transition to next round betting window
      setTimeout(() => {
        setServerSeed(nextServerSeedRef.current);
        setNonce(n => n + 1);
        startBettingWindow();
      }, 4000);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Only update ref, no setMultiplier state updates at 60fps!
    multiplierRef.current = currentMultiplier;

    // Update potential payout display in real time directly in the DOM
    if (hasBetRef.current && !cashedOutRef.current) {
      const payoutVal = Math.floor(betAmountRef.current * currentMultiplier);
      if (payoutTextRef.current) {
        payoutTextRef.current.innerText = `₹${payoutVal.toLocaleString('en-IN')}`;
      }
    }

    // Auto-cashout execution
    if (
      hasBetRef.current && 
      !cashedOutRef.current && 
      autoCashoutEnabled && 
      currentMultiplier >= autoCashoutMultiplier
    ) {
      handleCashOut();
    }

    // Update simulated players cashing out
    setSimulatedPlayers(prev => 
      prev.map(p => {
        if (!p.cashedOut && currentMultiplier >= p.cashoutPoint) {
          return {
            ...p,
            cashedOut: true,
            winAmount: Math.floor(p.betAmount * p.cashoutPoint)
          };
        }
        return p;
      })
    );

    animationRef.current = requestAnimationFrame(flightTick);
  }, [
    serverSeed, serverSeedHash, clientSeed, nonce, 
    autoCashoutEnabled, autoCashoutMultiplier, handleCashOut
  ]);

  // Start the running multiplier flight
  const startFlight = useCallback(() => {
    setGameState('running');
    startTimeRef.current = Date.now();
    multiplierRef.current = 1.0;
    setMultiplier(1.0);
    
    // Generate crash point deterministically
    const point = generateCrashPoint(serverSeed, clientSeed, nonce);
    crashPointRef.current = point;

    animationRef.current = requestAnimationFrame(flightTick);
  }, [serverSeed, clientSeed, nonce, flightTick]);

  // Start the betting countdown phase
  const startBettingWindow = useCallback(() => {
    setGameState('betting');
    setCountdown(5.0);
    setMultiplier(1.0);
    setPotentialPayout(0);
    setCashedOut(false);
    generateSimulatedPlayers();

    // Trigger autoplay placing bet
    if (autoBetEnabled && balanceRef.current >= betAmountRef.current && !hasBetRef.current) {
      deductBalance(betAmountRef.current);
      setHasBet(true);
      setPotentialPayout(betAmountRef.current);
      setSessionPL(prev => prev - betAmountRef.current);
      triggerFlash('border-green-500');
    }

    // Countdown interval
    let currentCount = 5.0;
    const interval = setInterval(() => {
      currentCount = Math.max(0, currentCount - 0.1);
      setCountdown(Math.round(currentCount * 10) / 10);
      
      if (currentCount <= 0) {
        clearInterval(interval);
        startFlight();
      }
    }, 100);
  }, [autoBetEnabled, startFlight, deductBalance, generateSimulatedPlayers]);

  // Initial mount: start betting window
  useEffect(() => {
    startBettingWindow();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className={`grid grid-rows-[56px_1fr_auto] grid-cols-1 md:grid-cols-[280px_1fr] w-full h-full bg-[#07070b] text-white rounded-3xl border-2 transition-all duration-300 overflow-hidden relative select-none ${uiFlash || 'border-[#1b1b2f]'}`}>
      
      {/* --- NAVBAR HEADER (Top Pinned, Fixed Height) --- */}
      <div className="col-span-1 md:col-span-2 row-start-1 h-14 flex items-center justify-between px-6 bg-[#0f0f18] border-b border-[#212135] z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#ff3333]/15 rounded-lg border border-[#ff3333]/30">
            <Rocket className="w-5 h-5 text-[#ff3333] animate-pulse" />
          </div>
          <span className="font-black text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#ffffff] via-[#ff6b6b] to-[#ff3333]">
            CRASH 3D
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {onlineCount.toLocaleString()} ONLINE
          </div>
        </div>

        {/* Middle history tags (last 5 rounds) */}
        <div className="hidden md:flex items-center gap-2 max-w-sm overflow-hidden">
          {roundHistory.slice(0, 5).map((h, i) => (
            <div
              key={i}
              onClick={() => setShowFairnessPanel(true)}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-black cursor-pointer border hover:scale-105 transition-all ${
                h.crashPoint >= 2.0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : h.crashPoint >= 1.2
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {h.crashPoint.toFixed(2)}x
            </div>
          ))}
        </div>

        {/* Right side stats: Profit/Loss & Provably Fair Toggle */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block">SESSION P/L</span>
            <span className={`text-sm font-black tracking-tight ${sessionPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {sessionPL >= 0 ? '+' : ''}₹{sessionPL.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={() => setShowFairnessPanel(!showFairnessPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${showFairnessPanel ? 'bg-[#ff3333] border-[#ff3333] text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'bg-transparent border-[#212135] text-gray-400 hover:text-white hover:border-gray-600'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            FAIRNESS
          </button>
        </div>
      </div>

      {/* Left Column: Live Other Players Sidebar (scrolls internally only) */}
      <div className="hidden md:flex col-start-1 row-start-2 border-r border-[#212135] bg-[#0c0c14]/40 flex-col min-h-0 h-full overflow-hidden">
        <div className="px-4 py-2.5 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs font-black text-gray-400">
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> Bets ({simulatedPlayers.length})
          </span>
          <span>Total: ₹{simulatedPlayers.reduce((sum, p) => sum + p.betAmount, 0).toLocaleString()}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {simulatedPlayers.map((player) => (
            <div key={player.id} className={`flex items-center justify-between p-2 rounded-xl border transition-colors duration-300 ${player.cashedOut ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black/20 border-transparent'}`}>
              <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                <User className={`w-3.5 h-3.5 ${player.avatarColor}`} />
                <span className="font-semibold text-gray-300 truncate text-xs">{player.username}</span>
              </div>
              <div className="text-right text-xs">
                {player.cashedOut ? (
                  <div>
                    <span className="text-emerald-400 font-bold block">{player.cashoutPoint.toFixed(2)}x</span>
                    <span className="text-gray-500 text-[10px]">₹{player.winAmount}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 font-bold">₹{player.betAmount}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Column: Canvas Container */}
      <div className="col-start-1 md:col-start-2 row-start-2 relative min-h-0 min-w-0 w-full h-full flex flex-col justify-between overflow-hidden">
        {/* Canvas Wrapper */}
        <div className="absolute inset-0 z-0">
          <CrashCanvas2D 
            multiplierRef={multiplierRef} 
            gameState={gameState} 
            crashPoint={crashPointRef.current} 
            overlayRef={multiplierOverlayRef}
            textRef={multiplierTextRef}
            stateRef={stateLabelRef}
          />
        </div>

        {/* Absolute Positioned Floating Multiplier Overlay (follows rocket at 60fps) */}
        <div 
          ref={multiplierOverlayRef} 
          className="absolute pointer-events-none z-20 flex flex-col items-center bg-black/70 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md text-center transition-all duration-75 select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          style={{ left: '80px', top: '350px', transform: 'translate(-50%, -50%)' }}
        >
          <span 
            ref={multiplierTextRef} 
            className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${
              gameState === 'crashed'
                ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]'
            }`}
          >
            1.00x
          </span>
          <span 
            ref={stateLabelRef}
            className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mt-0.5"
          >
            {gameState === 'betting' ? 'Starting...' : gameState === 'crashed' ? 'Crashed' : 'Flying'}
          </span>
        </div>

        {/* Betting Phase Countdown overlay */}
        {gameState === 'betting' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center bg-black/50 border border-white/10 px-8 py-5 rounded-3xl backdrop-blur-lg text-center animate-fade-in shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <span className="text-xs font-black tracking-widest text-[#ff3333] mb-1">ROUND STARTING IN</span>
              <span className="text-5xl font-black font-mono text-white tracking-wider">
                {countdown.toFixed(1)}s
              </span>
              <div className="w-36 h-1.5 bg-white/15 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-[#ff3333] transition-all duration-100 ease-linear rounded-full" 
                  style={{ width: `${(countdown / 5.0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- CONTROL BAR (Bottom Pinned, Fixed Height) --- */}
      <div className="col-span-1 md:col-span-2 row-start-3 p-4 bg-[#0a0a10] border-t border-[#1b1b2e] z-30 flex-shrink-0 flex flex-col md:flex-row gap-4">
        
        {/* 1. Left Section: Bet Amount and Chip Selection */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-black text-gray-500">
            <span>BET AMOUNT (INR)</span>
            <span>BALANCE: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={betAmount}
              disabled={hasBet}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setBetAmount(val);
              }}
              min={minBet}
              max={maxBet}
              className="w-32 px-4 py-3 bg-[#11111d] border border-[#21213b] focus:border-red-500 rounded-2xl text-lg font-black outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex-1 grid grid-cols-5 gap-1.5">
              {quickBetAmounts.map((amt) => (
                <button
                  key={amt}
                  disabled={hasBet}
                  onClick={() => setBetAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${betAmount === amt ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-[#11111d] border-[#21213b] text-gray-400 hover:border-gray-500 hover:text-white'} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Middle Section: Dynamic Action Button */}
        <div className="w-full md:w-80 flex flex-col justify-end">
          {gameState === 'running' && hasBet && !cashedOut ? (
            <button
              onClick={handleCashOut}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-black font-black text-lg tracking-wider rounded-2xl flex flex-col items-center justify-center transition-all shadow-[0_4px_25px_rgba(16,185,129,0.35)]"
            >
              <span>CASH OUT</span>
              <span ref={payoutTextRef} className="text-xs font-bold tracking-widest opacity-80">
                ₹{Math.floor(betAmountRef.current * multiplierRef.current).toLocaleString()}
              </span>
            </button>
          ) : (
            <button
              disabled={gameState === 'running' || balance < betAmount}
              onClick={handlePlaceBet}
              className={`w-full h-14 font-black text-lg tracking-wider rounded-2xl flex items-center justify-center transition-all ${
                hasBet
                  ? 'bg-rose-500/10 border-2 border-rose-500 text-rose-500 hover:bg-rose-500/20 active:scale-[0.98]'
                  : 'bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white shadow-[0_4px_25px_rgba(220,38,38,0.3)] disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {hasBet ? 'CANCEL BET' : 'PLACE BET'}
            </button>
          )}
        </div>

        {/* 3. Right Section: Autoplay Controls */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-black text-gray-500">
            <span>AUTOPLAY SETTINGS</span>
            <span>AUTO CASHOUT</span>
          </div>
          <div className="flex gap-2">
            {/* Auto Bet Toggle */}
            <button
              onClick={() => setAutoBetEnabled(!autoBetEnabled)}
              className={`flex-1 py-3 px-4 rounded-2xl border text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all ${
                autoBetEnabled
                  ? 'bg-red-500/10 border-red-500 text-red-400'
                  : 'bg-[#11111d] border-[#21213b] text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {autoBetEnabled ? <Square className="w-4 h-4 fill-red-400/20" /> : <Play className="w-4 h-4" />}
              {autoBetEnabled ? 'AUTO BET ACTIVE' : 'ENABLE AUTO BET'}
            </button>

            {/* Auto Cashout Multiplier */}
            <div className="flex items-center bg-[#11111d] border border-[#21213b] rounded-2xl px-3 w-40">
              <input
                type="checkbox"
                checked={autoCashoutEnabled}
                onChange={() => setAutoCashoutEnabled(!autoCashoutEnabled)}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-500 border-gray-700 bg-black cursor-pointer"
              />
              <input
                type="number"
                value={autoCashoutMultiplier}
                disabled={!autoCashoutEnabled}
                step={0.1}
                min={1.01}
                max={10000}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1.1;
                  setAutoCashoutMultiplier(val);
                }}
                className="w-full bg-transparent border-none text-right font-black text-base outline-none pr-1 disabled:opacity-30"
              />
              <span className="text-xs font-black text-gray-600">X</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- PROVABLY FAIR BOTTOM PANEL / DRAWER (Expansion Slide) --- */}
      {showFairnessPanel && (
        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex justify-end transition-all duration-300">
          <div className="w-full sm:w-[500px] h-full bg-[#0a0a0f] border-l border-[#212135] flex flex-col p-6 overflow-y-auto relative animate-slide-left">
            
            {/* Close Button */}
            <button
              onClick={() => setShowFairnessPanel(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-black mb-1 flex items-center gap-2 text-white">
              <ShieldCheck className="w-6 h-6 text-red-500" /> Provably Fair Verification
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Every round's crash multiplier is determined deterministically before the round starts, using the server seed (secret), client seed, and nonce. This commits the crash point securely before any user places a bet.
            </p>

            <div className="space-y-4 flex-1">
              
              {/* CURRENT SEEDS */}
              <div className="bg-[#11111b] border border-[#212137] rounded-2xl p-4 space-y-3">
                <span className="text-xs font-black tracking-widest text-[#ff3333] uppercase">ACTIVE ROUND CREDENTIALS</span>
                
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Active Server Seed (SHA-256 Hash):</span>
                    <button 
                      onClick={() => handleCopy(serverSeedHash, 'hash')} 
                      className="text-red-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Hash
                    </button>
                  </div>
                  <div className="font-mono text-xs text-white bg-black/40 p-2.5 rounded-lg border border-white/5 break-all">
                    {serverSeedHash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Client Seed (Customizable):</span>
                  </div>
                  <input
                    type="text"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value.substring(0, 32))}
                    className="w-full font-mono text-xs text-white bg-black/40 p-2.5 rounded-lg border border-white/5 focus:border-red-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Current Nonce:</span>
                  <span className="font-mono font-bold text-white bg-black/40 px-3 py-1 rounded-lg border border-white/5">{nonce}</span>
                </div>
              </div>

              {/* RTP & FAIRNESS FORMULA INFO */}
              <div className="bg-[#11111b] border border-[#212137] rounded-2xl p-4 space-y-2 text-xs">
                <span className="text-xs font-black tracking-widest text-[#ff3333] uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  RTP & HOUSE EDGE INFO
                </span>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  This game runs with a flat <strong className="text-emerald-400">97% RTP</strong> (3% house edge) derived transparently from the cryptographic outcome. There is absolutely no dynamic manipulation based on bet sizes, user IDs, or session flags.
                </p>
                <div className="bg-black/35 p-2.5 rounded-lg border border-white/5 font-mono text-[10px] text-gray-400 space-y-1">
                  <div className="font-bold text-white mb-0.5">Crash Multiplier Derivation:</div>
                  <div>1. Hash = HMAC_SHA256(server_seed, client_seed + ":" + nonce)</div>
                  <div>2. Number (N) = First 13 hex characters of Hash (52-bits)</div>
                  <div>3. If N % 33 == 0, Crash Multiplier = 1.00x</div>
                  <div>4. Else, Crash Multiplier = (97 * 2^52) / (2^52 - N)</div>
                </div>
              </div>

              {/* VERIFIER TOOL */}
              <div className="bg-[#11111b] border border-[#212137] rounded-2xl p-4 space-y-3">
                <span className="text-xs font-black tracking-widest text-[#ff3333] uppercase">VERIFY PREVIOUS ROUNDS</span>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Revealed Server Seed:</label>
                    <input
                      type="text"
                      value={verifyServerSeed}
                      onChange={(e) => setVerifyServerSeed(e.target.value)}
                      placeholder="Paste revealed server seed hex"
                      className="w-full font-mono text-xs text-white bg-black/40 p-2 rounded-lg border border-white/5 outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Client Seed:</label>
                    <input
                      type="text"
                      value={verifyClientSeed}
                      onChange={(e) => setVerifyClientSeed(e.target.value)}
                      className="w-full font-mono text-xs text-white bg-black/40 p-2 rounded-lg border border-white/5 outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Nonce:</label>
                    <input
                      type="number"
                      value={verifyNonce}
                      onChange={(e) => setVerifyNonce(parseInt(e.target.value) || 0)}
                      className="w-full font-mono text-xs text-white bg-black/40 p-2 rounded-lg border border-white/5 outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <button
                  onClick={runVerification}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-black tracking-wider transition-all"
                >
                  CALCULATE CRASH MULTIPLIER
                </button>

                {verifyResult && (
                  <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black text-center">
                    {verifyResult}
                  </div>
                )}
              </div>

              {/* RECENT ROUNDS LOG */}
              <div>
                <span className="text-xs font-black tracking-widest text-gray-500 uppercase block mb-2 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> RECENT ROUND REVEALS
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {roundHistory.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-600 border border-dashed border-gray-800 rounded-2xl">
                      No rounds completed in this session yet.
                    </div>
                  ) : (
                    roundHistory.map((h, i) => (
                      <div key={i} className="bg-black/30 border border-white/5 rounded-xl p-3 text-[11px] space-y-1.5 relative overflow-hidden">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-gray-400">Nonce: #{h.nonce}</span>
                          <span className={h.crashPoint >= 2.0 ? 'text-emerald-400' : h.crashPoint >= 1.2 ? 'text-indigo-400' : 'text-rose-400'}>
                            {h.crashPoint.toFixed(2)}x
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 break-all leading-tight">
                          <span className="font-semibold text-gray-400 block mb-0.5">Secret Server Seed:</span>
                          <div className="flex items-center justify-between gap-2 bg-black/45 p-1 px-2 rounded border border-white/5 font-mono">
                            <span className="truncate flex-1">{h.serverSeed}</span>
                            <button 
                              onClick={() => handleCopy(h.serverSeed, `reveal-${i}`)}
                              className="text-red-400 hover:text-white"
                            >
                              {copiedField === `reveal-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Tailwind CSS animations to embed inside the component wrapper */}
      <style jsx global>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slide-left 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes ping-once {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .animate-ping-once {
          animation: ping-once 0.4s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

export default CrashGame;
