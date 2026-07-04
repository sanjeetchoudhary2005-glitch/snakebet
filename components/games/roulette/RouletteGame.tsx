"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { useGameEffects } from "@/hooks/useGameEffects";
import { RouletteWheel } from "./RouletteWheel";

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

type Bet = {
  id: string;
  type: string;
  numbers: number[];
  amount: number;
  label: string;
};

export const RouletteGame = () => {
  const { balance, refreshBalance } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  const [view, setView] = useState<"2d" | "3d">("2d");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [bets, setBets] = useState<Bet[]>([]);
  const [history, setHistory] = useState<number[]>([]);

  const totalBet = useMemo(() => bets.reduce((sum, b) => sum + b.amount, 0), [bets]);
  const chipValues = [1, 5, 10, 50, 100];

  const handlePlaceBet = (type: string, numbers: number[], label: string) => {
    if (spinning) return;
    playSound("chip");
    
    setBets(prev => {
      // If same exact bet exists, add to it
      const existingIndex = prev.findIndex(b => b.type === type && b.label === label);
      if (existingIndex >= 0) {
        const newBets = [...prev];
        newBets[existingIndex].amount += selectedChip;
        return newBets;
      }
      return [...prev, { id: Math.random().toString(), type, numbers, amount: selectedChip, label }];
    });
  };

  const handleUndo = () => {
    if (spinning || bets.length === 0) return;
    playSound("click");
    setBets(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (spinning) return;
    playSound("click");
    setBets([]);
  };

  const handleSpin = async () => {
    if (bets.length === 0 || totalBet <= 0) return;
    
    playSound("click");
    setSpinning(true);
    setView("3d");
    setResult(null);

    try {
      // Needs clientSeed from crypto in real app, simplified here
      const clientSeed = Math.random().toString(36).substring(7);
      
      const res = await fetch("/api/games/roulette/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bets, clientSeed }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        setSpinning(false);
        setView("2d");
        return;
      }
      
      refreshBalance();
      setResult(data.result);
      
      // Store payouts for after animation
      sessionStorage.setItem('roulette_payout', data.totalPayout);
      
    } catch (err) {
      console.error(err);
      setSpinning(false);
      setView("2d");
    }
  };

  const handleSpinComplete = () => {
     setSpinning(false);
     if (result !== null) {
       setHistory(prev => [result, ...prev].slice(0, 10));
       
       const payout = Number(sessionStorage.getItem('roulette_payout') || 0);
       if (payout > 0) {
          triggerWin(payout);
       } else {
          triggerLose();
       }
       refreshBalance();
     }
     
     // After showing result for a few seconds, clear bets and switch back
     setTimeout(() => {
        setBets([]);
        setResult(null);
        setView("2d");
     }, 4000);
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return "bg-green-600";
    if (RED_NUMBERS.includes(num)) return "bg-red-600";
    return "bg-gray-900"; // Black numbers
  };

  const renderNumberCell = (num: number) => {
     const totalOnNum = bets.filter(b => b.type === 'straight' && b.numbers.includes(num)).reduce((sum, b) => sum + b.amount, 0);
     
     return (
       <div 
         key={num}
         onClick={() => handlePlaceBet('straight', [num], num.toString())}
         className={`relative w-12 h-16 border border-white/20 flex flex-col items-center justify-center cursor-pointer hover:brightness-125 transition-all ${getNumberColor(num)}`}
       >
         <span className="text-xl font-bold font-mono rotate-90">{num}</span>
         {totalOnNum > 0 && (
           <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-10 pointer-events-none">
             <span className="text-[10px] font-bold">{totalOnNum}</span>
           </motion.div>
         )}
       </div>
     );
  };

  const renderOutsideBet = (type: string, label: string, numbers: number[], colSpan: number = 1) => {
     const totalOnBet = bets.filter(b => b.type === type && b.label === label).reduce((sum, b) => sum + b.amount, 0);
     
     return (
       <div 
         key={label}
         style={{ gridColumn: `span ${colSpan}` }}
         onClick={() => handlePlaceBet(type, numbers, label)}
         className="relative h-12 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors bg-black/40 backdrop-blur-sm"
       >
         <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
         {totalOnBet > 0 && (
           <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center z-10 pointer-events-none">
             <span className="text-[10px] font-bold">{totalOnBet}</span>
           </motion.div>
         )}
       </div>
     );
  };

  return (
    <div className="relative w-full h-[800px] flex flex-col font-sans select-none bg-[#0D0B14] overflow-hidden text-white rounded-3xl border border-white/5 shadow-2xl">
      <WinFlashOverlay />

      {/* Header Tabs */}
      <div className="absolute top-4 left-4 z-40 flex gap-2">
         <button 
           onClick={() => !spinning && setView("2d")}
           className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === '2d' ? 'bg-teal-500 text-black' : 'bg-black/50 text-white/50 hover:text-white'}`}
         >
           2D Table
         </button>
         <button 
           onClick={() => !spinning && setView("3d")}
           className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === '3d' ? 'bg-teal-500 text-black' : 'bg-black/50 text-white/50 hover:text-white'}`}
         >
           3D Wheel
         </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0D0B14] to-[#0D0B14]">
        
        {view === "3d" ? (
           <div className="absolute inset-0">
             <RouletteWheel spinning={spinning} resultNumber={result} onSpinComplete={handleSpinComplete} />
           </div>
        ) : (
           <div className="absolute inset-0 flex items-center justify-center p-8">
              {/* 2D Board Container */}
              <div className="flex items-stretch bg-blue-900/20 p-6 rounded-3xl border border-blue-500/20 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                 
                 {/* Zero */}
                 <div 
                   onClick={() => handlePlaceBet('straight', [0], '0')}
                   className="w-16 border border-white/20 bg-green-600 flex items-center justify-center cursor-pointer hover:brightness-125 rounded-l-full relative"
                 >
                   <span className="text-2xl font-black rotate-90">0</span>
                   {(() => {
                      const t = bets.filter(b => b.type === 'straight' && b.numbers.includes(0)).reduce((s, b) => s + b.amount, 0);
                      return t > 0 && (
                        <div className="absolute w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center z-10 pointer-events-none">
                           <span className="text-[10px] font-bold">{t}</span>
                        </div>
                      );
                   })()}
                 </div>

                 {/* Main Grid */}
                 <div className="flex flex-col ml-1 gap-1">
                    {/* Numbers Grid */}
                    <div className="grid grid-rows-3 grid-flow-col gap-[2px]">
                       {/* Row 3 (top) */}
                       {[3,6,9,12,15,18,21,24,27,30,33,36].map(renderNumberCell)}
                       {/* Row 2 (mid) */}
                       {[2,5,8,11,14,17,20,23,26,29,32,35].map(renderNumberCell)}
                       {/* Row 1 (bot) */}
                       {[1,4,7,10,13,16,19,22,25,28,31,34].map(renderNumberCell)}
                    </div>
                    
                    {/* Dozens */}
                    <div className="grid grid-cols-3 gap-[2px] mt-2">
                       {renderOutsideBet('dozen', '1st 12', [1,2,3,4,5,6,7,8,9,10,11,12])}
                       {renderOutsideBet('dozen', '2nd 12', [13,14,15,16,17,18,19,20,21,22,23,24])}
                       {renderOutsideBet('dozen', '3rd 12', [25,26,27,28,29,30,31,32,33,34,35,36])}
                    </div>

                    {/* Outside Bottom */}
                    <div className="grid grid-cols-6 gap-[2px] mt-1">
                       {renderOutsideBet('low', '1-18', [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18])}
                       {renderOutsideBet('even', 'EVEN', [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36])}
                       {renderOutsideBet('red', 'RED', RED_NUMBERS)}
                       {renderOutsideBet('black', 'BLACK', BLACK_NUMBERS)}
                       {renderOutsideBet('odd', 'ODD', [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35])}
                       {renderOutsideBet('high', '19-36', [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36])}
                    </div>
                 </div>

                 {/* Column Bets (2 to 1) */}
                 <div className="flex flex-col ml-1 gap-[2px]">
                    {renderOutsideBet('column', '2:1 (top)', [3,6,9,12,15,18,21,24,27,30,33,36])}
                    {renderOutsideBet('column', '2:1 (mid)', [2,5,8,11,14,17,20,23,26,29,32,35])}
                    {renderOutsideBet('column', '2:1 (bot)', [1,4,7,10,13,16,19,22,25,28,31,34])}
                 </div>

              </div>
           </div>
        )}

        {/* History Panel (Right side) */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-black/50 border-l border-white/10 flex flex-col items-center py-4 gap-2 z-30">
           <span className="text-[10px] text-gray-500 font-bold uppercase rotate-90 my-6">History</span>
           {history.map((num, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${getNumberColor(num)}`}>
                 {num}
              </div>
           ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="relative z-30 bg-[#161224] border-t border-white/10 p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pr-16">
          
          <div className="flex flex-col gap-3 flex-1">
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Balance</span>
                   <span className="font-mono font-bold text-lg leading-none mt-1 text-teal-400">₹{balance.toString()}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Total Bet</span>
                   <span className="font-mono font-bold text-lg leading-none mt-1 text-yellow-400">₹{totalBet.toString()}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3 mt-2">
               {chipValues.map((val) => (
                 <button
                   key={val}
                   onClick={() => setSelectedChip(val)}
                   className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-dashed font-mono font-bold text-sm shadow-xl transition-all ${
                     selectedChip === val 
                       ? 'scale-110 border-teal-400 bg-teal-900 shadow-[0_0_15px_rgba(45,212,191,0.5)]' 
                       : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                   }`}
                 >
                   {val}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex items-center gap-4">
            <button
               onClick={handleUndo}
               disabled={bets.length === 0 || spinning}
               className="px-6 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold uppercase tracking-widest text-sm transition-colors flex items-center gap-2"
            >
               Undo
            </button>
            <button
              onClick={handleClear}
              disabled={bets.length === 0 || spinning}
              className="px-6 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold uppercase tracking-widest text-sm transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleSpin}
              disabled={bets.length === 0 || spinning}
              className="px-10 py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-black uppercase tracking-widest text-xl shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all"
            >
              {spinning ? "Spinning..." : "Spin"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
