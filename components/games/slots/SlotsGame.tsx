"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { useGameEffects } from "@/hooks/useGameEffects";

const SYMBOLS = {
  TIGER: '🐅', 
  DRAGON: '🐉', 
  FROG: '🐸',
  TURTLE: '🐢',
  FISH: '🐟',
  A: 'A', K: 'K', Q: 'Q', J: 'J', T: '10', N: '9'
};

const SYMBOL_COLORS: Record<string, string> = {
  [SYMBOLS.TIGER]: "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]",
  [SYMBOLS.DRAGON]: "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]",
  [SYMBOLS.FROG]: "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]",
  [SYMBOLS.TURTLE]: "text-green-600 drop-shadow-[0_0_10px_rgba(22,163,74,0.8)]",
  [SYMBOLS.FISH]: "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]",
  [SYMBOLS.A]: "text-yellow-400 font-serif",
  [SYMBOLS.K]: "text-yellow-500 font-serif",
  [SYMBOLS.Q]: "text-purple-400 font-serif",
  [SYMBOLS.J]: "text-purple-500 font-serif",
  [SYMBOLS.T]: "text-orange-400 font-serif",
  [SYMBOLS.N]: "text-orange-500 font-serif",
};

interface PaylineResult {
  lineIndex: number;
  symbol: string;
  count: number;
  multiplier: number;
  path: number[];
}

// Visual reel column component
const Reel = ({ symbols, spinning, spinDelay, activePaths }: { symbols: string[], spinning: boolean, spinDelay: number, activePaths: boolean[] }) => {
  // We need to animate symbols moving downwards
  // For simplicity in this implementation, we will use framer-motion to shuffle through random symbols when spinning, 
  // then snap to the final symbols.
  const [displaySymbols, setDisplaySymbols] = useState(symbols);

  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        // Randomize while spinning
        const keys = Object.values(SYMBOLS);
        setDisplaySymbols([
          keys[Math.floor(Math.random() * keys.length)],
          keys[Math.floor(Math.random() * keys.length)],
          keys[Math.floor(Math.random() * keys.length)],
        ]);
      }, 100);
      
      // Stop spinning after delay
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplaySymbols(symbols); // Snap to result
      }, spinDelay);

      return () => {
         clearInterval(interval);
         clearTimeout(timeout);
      };
    } else {
      setDisplaySymbols(symbols);
    }
  }, [spinning, symbols, spinDelay]);

  return (
    <div className="flex flex-col gap-2 relative z-10 w-24">
       {displaySymbols.map((sym, i) => (
          <div key={i} className={`h-24 bg-[#2A1010] rounded-xl border-2 flex items-center justify-center text-5xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300 ${activePaths[i] ? 'border-yellow-400 bg-[#3A1818] shadow-[0_0_20px_rgba(250,204,21,0.5)] z-20 scale-110' : 'border-[#4A2020]'}`}>
             <motion.span 
               animate={activePaths[i] ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}} 
               transition={{ repeat: activePaths[i] ? Infinity : 0, duration: 1 }}
               className={SYMBOL_COLORS[sym] || "text-white"}
             >
               {sym}
             </motion.span>
          </div>
       ))}
    </div>
  );
};

export const SlotsGame = () => {
  const { balance, refreshBalance } = useWallet();
  const { playSound, triggerWin, WinFlashOverlay } = useGameEffects();

  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState<string[][]>(Array(5).fill([]).map(() => Array(3).fill(SYMBOLS.TIGER)));
  const [winLines, setWinLines] = useState<PaylineResult[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [bigWin, setBigWin] = useState(false);
  
  const [autoSpin, setAutoSpin] = useState(false);

  // Derive which specific cells are part of a winning line
  const activeCells = useMemo(() => {
    const active = Array(5).fill([]).map(() => Array(3).fill(false));
    winLines.forEach(line => {
       for(let c=0; c < line.count; c++) {
          active[c][line.path[c]] = true;
       }
    });
    return active;
  }, [winLines]);

  const handleSpin = async () => {
    if (spinning || betAmount <= 0) return;
    
    setSpinning(true);
    setWinLines([]);
    setTotalWin(0);
    setBigWin(false);
    playSound("click");

    try {
      const res = await fetch("/api/games/slots/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setSpinning(false);
        setAutoSpin(false);
        return;
      }

      setGrid(data.grid);
      refreshBalance(); // Deducted bet

      // Wait for all reels to finish spinning (last reel stops at 5 * 200 + 1000 = 2000ms)
      setTimeout(() => {
         setSpinning(false);
         setWinLines(data.winningLines);
         setTotalWin(data.totalWin);
         
         if (data.totalWin > 0) {
            playSound("win");
            if (data.totalWin >= betAmount * 10) {
               setBigWin(true);
               triggerWin(data.totalWin);
            }
         }
         
         refreshBalance(); // Add win
         
         if (autoSpin) {
            setTimeout(handleSpin, 1500); // Trigger next auto spin
         }
      }, 2000);

    } catch (err) {
      console.error(err);
      setSpinning(false);
      setAutoSpin(false);
    }
  };

  return (
    <div className="relative w-full h-[700px] flex flex-col font-sans select-none bg-[#1A0A0A] overflow-hidden text-white rounded-3xl border border-yellow-600/30 shadow-[0_0_50px_rgba(0,0,0,1)]">
      <WinFlashOverlay />

      {/* Background Effects */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-red-900/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

      {/* Decorative Dragons/Tigers */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none text-9xl -scale-x-100 blur-sm">🐉</div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none text-9xl blur-sm">🐅</div>

      {/* Main Grid Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 z-10">
        
        {/* BIG WIN Overlay */}
        <AnimatePresence>
           {bigWin && (
             <motion.div 
               initial={{ scale: 0, opacity: 0 }} 
               animate={{ scale: [1, 1.2, 1], opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
             >
                <div className="flex flex-col items-center drop-shadow-[0_0_30px_rgba(250,204,21,1)]">
                   <span className="text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600">BIG WIN!</span>
                   <span className="text-5xl font-mono text-yellow-400 font-bold mt-4">₹{totalWin.toFixed(2)}</span>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* The Frame */}
        <div className="relative p-6 bg-[#2A1010] rounded-2xl border-4 border-[#8B6508] shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.8)] before:absolute before:-inset-2 before:border-2 before:border-[#B8860B] before:rounded-3xl">
           
           {/* Corner Flourishes */}
           <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#8B6508] rounded-full border-4 border-[#2A1010] flex items-center justify-center text-xs">🐉</div>
           <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#8B6508] rounded-full border-4 border-[#2A1010] flex items-center justify-center text-xs">🐅</div>
           <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#8B6508] rounded-full border-4 border-[#2A1010]" />
           <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#8B6508] rounded-full border-4 border-[#2A1010]" />

           {/* Payline Overlay (SVG) */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" style={{ padding: '1.5rem' }}>
              {winLines.map((line, i) => {
                 // Calculate SVG path based on row indices
                 const points = line.path.slice(0, line.count).map((rowIdx, colIdx) => {
                    const x = (colIdx * (96 + 8)) + 48; // 24rem width + 0.5rem gap
                    const y = (rowIdx * (96 + 8)) + 48;
                    return `${x},${y}`;
                 }).join(" L ");
                 
                 return (
                   <motion.path 
                     key={i}
                     initial={{ pathLength: 0 }}
                     animate={{ pathLength: 1 }}
                     transition={{ duration: 0.5 }}
                     d={`M ${points}`} 
                     fill="none" 
                     stroke="#FACC15" 
                     strokeWidth="4" 
                     strokeLinecap="round" 
                     strokeLinejoin="round" 
                     className="drop-shadow-[0_0_8px_rgba(250,204,21,1)]"
                   />
                 )
              })}
           </svg>

           {/* The 5 Columns */}
           <div className="flex gap-2">
              {grid.map((colSymbols, colIndex) => (
                 <Reel 
                   key={colIndex} 
                   symbols={colSymbols} 
                   spinning={spinning} 
                   spinDelay={1000 + (colIndex * 200)} // Stagger stop times
                   activePaths={activeCells[colIndex]} 
                 />
              ))}
           </div>
        </div>

        {totalWin > 0 && !bigWin && (
           <div className="absolute bottom-16 bg-black/80 px-8 py-2 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] animate-bounce z-20">
              <span className="text-yellow-400 font-black tracking-widest">WIN: ₹{totalWin.toFixed(2)}</span>
           </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-30 bg-gradient-to-b from-[#1A0A0A] to-[#0A0505] border-t-2 border-[#8B6508] p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.9)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-6 px-4">
          
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors">
               <span className="text-xl">ⓘ</span>
            </button>
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Credit</span>
               <span className="font-mono font-bold text-lg text-yellow-500">₹{balance.toString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/60 rounded-xl p-2 border border-[#4A2020]">
             <button onClick={() => setBetAmount(b => Math.max(1, b - 10))} disabled={spinning} className="w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 font-bold text-xl disabled:opacity-50">−</button>
             <div className="flex flex-col items-center w-24">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bet</span>
                <span className="font-mono font-bold text-xl text-white">₹{betAmount}</span>
             </div>
             <button onClick={() => setBetAmount(b => b + 10)} disabled={spinning} className="w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 font-bold text-xl disabled:opacity-50">+</button>
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={() => setAutoSpin(!autoSpin)} 
               className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors border-2 ${autoSpin ? 'bg-red-900 border-red-500 text-red-200' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
             >
               {autoSpin ? 'Stop Auto' : 'Auto Play'}
             </button>
             
             <button
               onClick={handleSpin}
               disabled={spinning && !autoSpin}
               className="w-20 h-20 rounded-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-300 via-yellow-600 to-yellow-900 border-4 border-[#2A1010] shadow-[0_0_20px_rgba(250,204,21,0.5)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
             >
               <span className="font-black text-xl text-[#2A1010] drop-shadow-sm group-hover:rotate-180 transition-transform duration-500">↻</span>
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};
