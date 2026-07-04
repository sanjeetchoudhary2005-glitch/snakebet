"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { useGameEffects } from "@/hooks/useGameEffects";

type Card = { suit: string; rank: string; value: number };

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥️",
  diamonds: "♦️",
  clubs: "♣️",
  spades: "♠️",
};

const SUIT_COLORS: Record<string, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-gray-900",
  spades: "text-gray-900",
};

const Card3D = ({ card, hidden }: { card: Card | null; hidden?: boolean }) => {
  return (
    <div className="relative w-48 h-72 perspective-1000 group">
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: hidden || !card ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-2xl border-4 border-gray-200 overflow-hidden flex flex-col p-4 justify-between">
          <div className="absolute inset-0 bg-gradient-to-tr from-white via-transparent to-white opacity-20 pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white after:to-transparent after:-translate-x-full after:animate-[shimmer_2s_infinite]" />
          
          {card && (
            <>
              <div className={`text-4xl font-bold font-serif ${SUIT_COLORS[card.suit]}`}>
                {card.rank}
              </div>
              <div className={`text-8xl self-center ${SUIT_COLORS[card.suit]}`}>
                {SUIT_SYMBOLS[card.suit]}
              </div>
              <div className={`text-4xl font-bold font-serif self-end rotate-180 ${SUIT_COLORS[card.suit]}`}>
                {card.rank}
              </div>
            </>
          )}
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#1E3A8A] rounded-xl shadow-2xl border-4 border-white flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z%22 fill=%22%23ffffff%22 fill-opacity=%220.4%22 fill-rule=%22evenodd%22/%3E%3C/svg%3E')]" />
           <div className="w-16 h-16 border-4 border-white/50 rotate-45 flex items-center justify-center">
             <div className="w-8 h-8 bg-white/50 rounded-full" />
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export const HiLoGame = () => {
  const { balance, refreshBalance } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<"idle" | "playing" | "busted" | "cashed_out">("idle");
  const [roundId, setRoundId] = useState<string | null>(null);
  
  const [cards, setCards] = useState<Card[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  
  const handleStart = async () => {
    if (betAmount <= 0 || betAmount > balance) return;
    playSound("click");
    
    setGameState("playing");
    setCards([]);
    setCurrentMultiplier(1.0);

    try {
      const res = await fetch("/api/games/hilo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setGameState("idle");
        return;
      }

      setRoundId(data.roundId);
      setCards([data.startCard]);
      refreshBalance();
    } catch (err) {
      console.error(err);
      setGameState("idle");
    }
  };

  const handleAction = async (choice: 'higher' | 'lower' | 'equal') => {
    if (gameState !== "playing" || !roundId) return;
    
    playSound("click");

    try {
      const res = await fetch("/api/games/hilo/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, choice }),
      });
      const data = await res.json();
      
      if (data.error) return;

      setCards(prev => [...prev, data.card]);

      if (!data.win) {
        playSound("lose");
        triggerLose();
        setGameState("busted");
      } else {
        playSound("win");
        setCurrentMultiplier(data.currentMultiplier);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashout = async () => {
    if (gameState !== "playing" || cards.length <= 1) return;
    playSound("click");

    try {
      const res = await fetch("/api/games/hilo/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId }),
      });
      const data = await res.json();

      if (data.error) return;

      setGameState("cashed_out");
      triggerWin(data.winAmount);
      refreshBalance();

    } catch (err) {
      console.error(err);
    }
  };

  const currentCard = cards[cards.length - 1];
  const previousCard = cards.length > 1 ? cards[cards.length - 2] : null;

  return (
    <div className="relative w-full h-[600px] flex flex-col font-sans select-none bg-[#0D0B14] overflow-hidden text-white rounded-3xl border border-white/5 shadow-2xl">
      <WinFlashOverlay />

      <div className="flex-1 relative flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_#1E3A8A_0%,_#0D0B14_100%)] overflow-hidden">
         {/* History / Previous cards */}
         <div className="absolute top-4 left-4 right-4 flex gap-2 overflow-hidden opacity-50 pointer-events-none scale-75 origin-top-left">
            {cards.slice(0, -1).map((c, i) => (
              <div key={i} className="w-16 h-24 bg-white rounded-md shadow-md flex items-center justify-center flex-col text-sm border border-gray-300">
                 <span className={`font-bold ${SUIT_COLORS[c.suit]}`}>{c.rank}</span>
                 <span className={SUIT_COLORS[c.suit]}>{SUIT_SYMBOLS[c.suit]}</span>
              </div>
            ))}
         </div>

         {/* Main Card Area */}
         <div className="flex items-center justify-center gap-12 z-10">
            {gameState !== 'idle' && (
              <div className="flex items-center gap-8">
                 <AnimatePresence mode="popLayout">
                   <motion.div
                     key={cards.length}
                     initial={{ x: 100, opacity: 0, scale: 0.8, rotateY: 90 }}
                     animate={{ x: 0, opacity: 1, scale: 1, rotateY: 0 }}
                     exit={{ x: -100, opacity: 0, scale: 0.8 }}
                     transition={{ type: "spring", stiffness: 200, damping: 20 }}
                   >
                     <Card3D card={currentCard} hidden={false} />
                   </motion.div>
                 </AnimatePresence>
              </div>
            )}
            
            {gameState === 'idle' && (
               <Card3D card={null} hidden={true} />
            )}
         </div>

         {/* Bust / Cashout Overlay */}
         <AnimatePresence>
            {gameState === 'busted' && (
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute z-20 pointer-events-none">
                  <span className="text-8xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] -rotate-12">BUSTED</span>
               </motion.div>
            )}
            {gameState === 'cashed_out' && (
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute z-20 pointer-events-none flex flex-col items-center">
                  <span className="text-6xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]">YOU WIN!</span>
                  <span className="text-4xl font-mono font-bold text-white drop-shadow-md">₹{(betAmount * currentMultiplier).toFixed(2)}</span>
               </motion.div>
            )}
         </AnimatePresence>

      </div>

      {/* Control Panel */}
      <div className="bg-[#161224] border-t border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Balance</span>
                <span className="font-mono font-bold text-lg text-teal-400">₹{balance.toString()}</span>
             </div>
             <div className="h-8 w-px bg-white/10 mx-2" />
             <div className="flex flex-col w-32">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bet Amount</span>
                <input 
                   type="number" 
                   value={betAmount}
                   onChange={e => setBetAmount(Number(e.target.value))}
                   disabled={gameState === 'playing'}
                   className="bg-black/50 border border-white/10 rounded px-2 py-1 font-mono font-bold text-sm focus:border-teal-500 outline-none disabled:opacity-50"
                />
             </div>
          </div>

          {gameState === 'playing' ? (
             <div className="flex items-center gap-4">
                <button
                   onClick={() => handleAction('lower')}
                   className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-400 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                >
                   <span className="text-3xl font-black text-white drop-shadow-md">↓</span>
                   <span className="text-xs font-bold uppercase tracking-wider text-red-200">Lower</span>
                </button>
                <button
                   onClick={() => handleAction('equal')}
                   className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-900 border-2 border-gray-400 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all"
                >
                   <span className="text-xl font-black text-white drop-shadow-md">=</span>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-1">Same</span>
                </button>
                <button
                   onClick={() => handleAction('higher')}
                   className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-green-800 border-2 border-green-300 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                   <span className="text-3xl font-black text-white drop-shadow-md">↑</span>
                   <span className="text-xs font-bold uppercase tracking-wider text-green-100">Higher</span>
                </button>
             </div>
          ) : (
             <div className="flex items-center">
                <button
                   onClick={handleStart}
                   className="px-12 py-4 bg-teal-500 hover:bg-teal-400 text-black rounded-xl font-black uppercase tracking-widest text-xl shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all"
                >
                   Bet
                </button>
             </div>
          )}

          <div className="flex flex-col items-end min-w-[150px]">
             {gameState === 'playing' && (
                <>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-2 px-4 mb-2 flex flex-col items-end">
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Multiplier</span>
                     <span className="text-yellow-400 font-mono font-bold text-xl">{currentMultiplier.toFixed(2)}x</span>
                  </div>
                  <button
                     onClick={handleCashout}
                     disabled={cards.length <= 1}
                     className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg font-bold uppercase text-sm shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all"
                  >
                     Cashout
                  </button>
                </>
             )}
          </div>
      </div>
      
      {/* Required CSS for 3D card flips */}
      <style dangerouslySetInnerHTML={{__html: `
         .perspective-1000 { perspective: 1000px; }
         .preserve-3d { transform-style: preserve-3d; }
         .backface-hidden { backface-visibility: hidden; }
         .rotate-y-180 { transform: rotateY(180deg); }
         @keyframes shimmer {
            100% { transform: translateX(100%); }
         }
      `}} />
    </div>
  );
};
