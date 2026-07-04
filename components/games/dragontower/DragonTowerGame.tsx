"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { useGameEffects } from "@/hooks/useGameEffects";

type Difficulty = "easy" | "medium" | "hard" | "expert";

const DIFFICULTY_CONFIG = {
  easy: { tilesPerRow: 4, safeTiles: 3 },
  medium: { tilesPerRow: 3, safeTiles: 2 },
  hard: { tilesPerRow: 2, safeTiles: 1 },
  expert: { tilesPerRow: 4, safeTiles: 1 },
};

const EggSVG = () => (
  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-8 h-8 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" viewBox="0 0 24 24" fill="url(#eggGrad)">
    <defs>
      <radialGradient id="eggGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="100%" stopColor="#16a34a" />
      </radialGradient>
    </defs>
    <path d="M12 2C8.686 2 6 6.03 6 11c0 4.97 2.686 11 6 11s6-6.03 6-11c0-4.97-2.686-9-6-9z" />
  </motion.svg>
);

const ClawSVG = () => (
  <motion.svg initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="w-10 h-10 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.28 5.64a1.5 1.5 0 0 0-2.56-1.28l-3 3a1.5 1.5 0 0 0 2.12 2.12l3-3a1.5 1.5 0 0 0 .44-1.84zm7.44 0a1.5 1.5 0 0 1 2.56-1.28l3 3a1.5 1.5 0 0 1-2.12 2.12l-3-3a1.5 1.5 0 0 1-.44-1.84zM12 2a1.5 1.5 0 0 0-1.5 1.5v6a1.5 1.5 0 0 0 3 0v-6A1.5 1.5 0 0 0 12 2zm-6.5 12a6.5 6.5 0 1 0 13 0H18A6 6 0 1 1 6 14z" />
  </motion.svg>
);

const DragonGargoyle = () => (
  <motion.div 
    animate={{ scale: [1, 1.02, 1] }} 
    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    className="w-48 h-32 absolute -top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-2xl opacity-90"
  >
    <svg viewBox="0 0 100 100" fill="#4b5563">
       {/* Wings */}
       <path d="M50 40 Q20 10 10 30 Q30 50 45 60 Z" />
       <path d="M50 40 Q80 10 90 30 Q70 50 55 60 Z" />
       {/* Body */}
       <path d="M40 80 Q50 90 60 80 L55 40 L45 40 Z" />
       {/* Head */}
       <circle cx="50" cy="35" r="12" />
       {/* Eyes */}
       <circle cx="45" cy="32" r="2" fill="#60a5fa" className="animate-pulse" />
       <circle cx="55" cy="32" r="2" fill="#60a5fa" className="animate-pulse" />
       {/* Horns */}
       <path d="M40 28 L35 15 L45 25 Z" fill="#374151" />
       <path d="M60 28 L65 15 L55 25 Z" fill="#374151" />
    </svg>
  </motion.div>
);

export const DragonTowerGame = () => {
  const { balance, refreshBalance } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [betAmount, setBetAmount] = useState<number>(10);
  
  const [gameState, setGameState] = useState<"idle" | "playing" | "busted" | "cashed_out">("idle");
  const [roundId, setRoundId] = useState<string | null>(null);
  
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  
  // Array of 9 rows. Each row is an array of tile states: 'hidden' | 'safe' | 'trap'
  const [towerState, setTowerState] = useState<('hidden' | 'safe' | 'trap')[][]>(
     Array(9).fill([]).map(() => Array(DIFFICULTY_CONFIG.medium.tilesPerRow).fill('hidden'))
  );
  
  // Track revealed traps on bust/cashout
  const [revealedTraps, setRevealedTraps] = useState<number[][]>(Array(9).fill([]));

  const config = DIFFICULTY_CONFIG[difficulty];

  // Re-init tower if difficulty changes while idle
  useMemo(() => {
    if (gameState === "idle") {
       setTowerState(Array(9).fill([]).map(() => Array(config.tilesPerRow).fill('hidden')));
    }
  }, [difficulty, gameState, config.tilesPerRow]);

  const handleStart = async () => {
    if (betAmount <= 0) return;
    playSound("click");
    
    setGameState("playing");
    setCurrentLevel(0);
    setCurrentMultiplier(1.0);
    setRevealedTraps(Array(9).fill([]));
    setTowerState(Array(9).fill([]).map(() => Array(config.tilesPerRow).fill('hidden')));

    try {
      const res = await fetch("/api/games/dragontower/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, difficulty }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setGameState("idle");
        return;
      }

      setRoundId(data.roundId);
      refreshBalance();
    } catch (err) {
      console.error(err);
      setGameState("idle");
    }
  };

  const handleTileClick = async (row: number, col: number) => {
    if (gameState !== "playing" || row !== currentLevel) return;
    
    // Optimistically update to avoid double clicks
    const newTower = [...towerState];
    newTower[row] = [...newTower[row]];
    // (don't reveal yet until server responds)
    
    playSound("click");

    try {
      const res = await fetch("/api/games/dragontower/climb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, row, tileIndex: col }),
      });
      const data = await res.json();
      
      if (data.error) return;

      if (!data.safe) {
        // Bust!
        playSound("lose");
        triggerLose();
        setGameState("busted");
        setRevealedTraps(data.revealedTraps);
        
        // Mark clicked as trap
        newTower[row][col] = 'trap';
        setTowerState(newTower);
      } else {
        // Safe!
        playSound("win");
        setCurrentLevel(data.currentLevel);
        setCurrentMultiplier(data.multiplier);
        
        newTower[row][col] = 'safe';
        setTowerState(newTower);
        
        // Show where the trap actually was in the completed row (visual feedback)
        if (data.revealedTrapsInRow) {
           const rt = [...revealedTraps];
           rt[row] = data.revealedTrapsInRow;
           setRevealedTraps(rt);
        }
        
        if (data.currentLevel === 9) {
           // Auto cashout on top
           handleCashout();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashout = async () => {
    if (gameState !== "playing" || currentLevel === 0) return;
    playSound("click");

    try {
      const res = await fetch("/api/games/dragontower/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId }),
      });
      const data = await res.json();

      if (data.error) return;

      setGameState("cashed_out");
      setRevealedTraps(data.revealedTraps);
      triggerWin(data.winAmount);
      refreshBalance();

    } catch (err) {
      console.error(err);
    }
  };

  const currentProfit = betAmount * currentMultiplier;

  return (
    <div className="relative w-full h-[700px] flex flex-col md:flex-row font-sans select-none bg-[#0D0B14] overflow-hidden text-white rounded-3xl border border-white/5 shadow-2xl">
      <WinFlashOverlay />

      {/* Control Panel (Left) */}
      <div className="w-full md:w-80 bg-[#161224] border-r border-white/10 p-6 flex flex-col gap-6 z-30 shadow-xl">
         
         <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
           <button className="flex-1 py-2 bg-gray-800 rounded-lg text-sm font-bold shadow-md">Manual</button>
           <button className="flex-1 py-2 text-gray-500 hover:text-white text-sm font-bold">Auto</button>
         </div>

         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
               <span>Bet Amount</span>
               <span className="text-yellow-500 font-mono">₹{balance.toString()}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex-1 relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 text-sm font-bold">₹</span>
                 <input 
                   type="number" 
                   value={betAmount}
                   onChange={e => setBetAmount(Number(e.target.value))}
                   disabled={gameState === 'playing'}
                   className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-8 pr-3 font-mono font-bold text-sm focus:border-teal-500 outline-none disabled:opacity-50 transition-colors"
                 />
               </div>
               <button onClick={() => setBetAmount(b => Math.max(1, b/2))} disabled={gameState === 'playing'} className="px-3 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-xs disabled:opacity-50">½</button>
               <button onClick={() => setBetAmount(b => b*2)} disabled={gameState === 'playing'} className="px-3 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-xs disabled:opacity-50">2×</button>
            </div>
         </div>

         <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Difficulty</span>
            <select 
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as Difficulty)}
              disabled={gameState === 'playing'}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-3 font-bold text-sm focus:border-teal-500 outline-none disabled:opacity-50 capitalize"
            >
              <option value="easy">Easy (4 Tiles, 1 Trap)</option>
              <option value="medium">Medium (3 Tiles, 1 Trap)</option>
              <option value="hard">Hard (2 Tiles, 1 Trap)</option>
              <option value="expert">Expert (4 Tiles, 3 Traps)</option>
            </select>
         </div>

         <div className="mt-auto flex flex-col gap-3">
            {gameState === 'playing' ? (
              <div className="flex flex-col gap-2">
                 <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Profit ({currentMultiplier.toFixed(2)}x)</span>
                    <span className="text-teal-400 font-mono font-bold text-lg">₹{currentProfit.toFixed(2)}</span>
                 </div>
                 <button
                   onClick={handleCashout}
                   disabled={currentLevel === 0}
                   className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black rounded-xl font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all"
                 >
                   Cashout
                 </button>
              </div>
            ) : (
              <button
                 onClick={handleStart}
                 className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:bg-gray-800 disabled:text-gray-500 text-black rounded-xl font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all"
              >
                 Bet
              </button>
            )}
         </div>

      </div>

      {/* Game Area (Right) */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#1f2937_0%,_#030712_100%)] overflow-hidden">
        
        {/* Background Particles/Noise */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

        <DragonGargoyle />

        {/* Tower Grid */}
        <div className={`relative z-10 w-full max-w-[400px] bg-[#111] p-4 rounded-t-sm rounded-b-2xl border-[8px] border-gray-800 border-t-0 shadow-[0_30px_50px_rgba(0,0,0,0.8)] ${gameState === 'busted' ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
           <div className="flex flex-col-reverse gap-2"> {/* Reverse so row 0 is at bottom */}
              {towerState.map((rowArr, rowIndex) => {
                 const isActive = gameState === 'playing' && rowIndex === currentLevel;
                 const isPassed = gameState === 'playing' && rowIndex < currentLevel;
                 const rowTraps = revealedTraps[rowIndex] || [];

                 return (
                   <div key={rowIndex} className={`grid gap-2 transition-all duration-300 ${isActive ? 'scale-[1.02] drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]' : isPassed ? 'opacity-70' : 'opacity-40'}`} style={{ gridTemplateColumns: `repeat(${config.tilesPerRow}, minmax(0, 1fr))` }}>
                      {rowArr.map((tileState, colIndex) => {
                         
                         // Determine if this tile should be revealed as a trap at game end
                         const isRevealedTrap = (gameState === 'busted' || gameState === 'cashed_out' || isPassed) && rowTraps.includes(colIndex);
                         // If safe in an active/passed row, it was the one clicked
                         const isRevealedSafe = tileState === 'safe';

                         return (
                           <button
                             key={colIndex}
                             disabled={!isActive}
                             onClick={() => handleTileClick(rowIndex, colIndex)}
                             className={`h-12 relative rounded-lg border-2 border-b-4 flex items-center justify-center transition-all ${
                               isActive 
                                 ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-teal-500 cursor-pointer shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]' 
                                 : 'bg-gray-800 border-gray-900 cursor-default'
                             }`}
                           >
                              <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=\\'10\\' height=\\'10\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M10 0l10 10-10 10L0 10z\\' fill=\\'%23ffffff\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'/%3E%3C/svg%3E')]" />
                              
                              {/* Content */}
                              <AnimatePresence>
                                {isRevealedSafe && (
                                   <EggSVG />
                                )}
                                {(tileState === 'trap' || isRevealedTrap) && (
                                   <ClawSVG />
                                )}
                              </AnimatePresence>
                           </button>
                         )
                      })}
                   </div>
                 )
              })}
           </div>
        </div>

      </div>
    </div>
  );
};
