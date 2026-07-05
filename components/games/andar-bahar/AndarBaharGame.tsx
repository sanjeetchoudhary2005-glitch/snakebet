"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { useGameEffects } from "@/hooks/useGameEffects";

type Card = { suit: string; rank: string; side?: 'andar' | 'bahar' };

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

const Card3D = ({ card, hidden, size = "md" }: { card: Card | null; hidden?: boolean, size?: "sm" | "md" | "lg" }) => {
  const dimensions = {
    sm: "w-16 h-24 text-xs",
    md: "w-24 h-36 text-sm",
    lg: "w-32 h-48 text-lg"
  }[size];

  return (
    <div className={`relative ${dimensions} perspective-1000 group`}>
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: hidden || !card ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden flex flex-col p-2 justify-between">
          {card && (
            <>
              <div className={`font-bold font-serif ${SUIT_COLORS[card.suit]}`}>
                {card.rank}
              </div>
              <div className={`text-2xl self-center ${SUIT_COLORS[card.suit]}`}>
                {SUIT_SYMBOLS[card.suit]}
              </div>
              <div className={`font-bold font-serif self-end rotate-180 ${SUIT_COLORS[card.suit]}`}>
                {card.rank}
              </div>
            </>
          )}
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#1E3A8A] rounded-lg shadow-xl border-2 border-white flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z%22 fill=%22%23ffffff%22 fill-opacity=%220.4%22 fill-rule=%22evenodd%22/%3E%3C/svg%3E')]" />
        </div>
      </motion.div>
    </div>
  );
};

export const AndarBaharGame = () => {
  const { balance, refreshBalance } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  const [betAmount, setBetAmount] = useState(10);
  const [choice, setChoice] = useState<'andar' | 'bahar'>('andar');
  
  const [gameState, setGameState] = useState<"idle" | "dealing" | "finished">("idle");
  const [joker, setJoker] = useState<Card | null>(null);
  const [andarCards, setAndarCards] = useState<Card[]>([]);
  const [baharCards, setBaharCards] = useState<Card[]>([]);
  const [winningSide, setWinningSide] = useState<'andar' | 'bahar' | null>(null);

  const handleDeal = async () => {
    if (betAmount <= 0 || betAmount > balance || gameState === 'dealing') return;
    playSound("click");
    
    setGameState("dealing");
    setJoker(null);
    setAndarCards([]);
    setBaharCards([]);
    setWinningSide(null);

    try {
      const res = await fetch("/api/games/andar-bahar/deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, choice, clientSeed: crypto.randomUUID() }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setGameState("idle");
        return;
      }

      setJoker(data.joker);
      
      // Animate dealing sequentially
      let delay = 500;
      const drawnCards: Card[] = data.drawnCards;
      
      drawnCards.forEach((card, index) => {
        setTimeout(() => {
          playSound("deal");
          if (card.side === 'andar') {
            setAndarCards(prev => [...prev, card]);
          } else {
            setBaharCards(prev => [...prev, card]);
          }

          if (index === drawnCards.length - 1) {
            // Last card
            setTimeout(() => {
              setWinningSide(data.winningSide);
              setGameState("finished");
              refreshBalance();
              if (data.won) {
                playSound("win");
                triggerWin(data.payout);
              } else {
                playSound("lose");
                triggerLose();
              }
            }, 1000);
          }
        }, delay + (index * 300)); // 300ms per card
      });

    } catch (err) {
      console.error(err);
      setGameState("idle");
    }
  };

  return (
    <div className="relative w-full h-[600px] flex flex-col font-sans select-none bg-gradient-to-b from-[#1B4332] to-[#0D0B14] overflow-hidden text-white rounded-3xl border border-white/5 shadow-2xl">
      <WinFlashOverlay />

      <div className="flex-1 relative flex flex-col p-8 bg-[url('/table-texture.png')] bg-cover bg-center overflow-hidden">
         {/* Title / Joker Area */}
         <div className="w-full flex justify-center mt-2 mb-8 relative">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-2 drop-shadow-md">Joker Card</span>
              <AnimatePresence mode="popLayout">
                {joker ? (
                   <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="z-10 shadow-[0_0_30px_rgba(234,179,8,0.3)] rounded-lg">
                      <Card3D card={joker} hidden={false} size="lg" />
                   </motion.div>
                ) : (
                   <div className="w-32 h-48 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center bg-black/20">
                      <span className="text-white/20 font-bold">WAITING</span>
                   </div>
                )}
              </AnimatePresence>
            </div>
         </div>

         {/* Dealing Areas */}
         <div className="flex-1 w-full grid grid-cols-2 gap-8 relative">
            {/* Andar (Left) */}
            <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${choice === 'andar' ? 'bg-white/5 border-yellow-500/50' : 'border-transparent'} ${winningSide === 'andar' ? 'shadow-[0_0_50px_rgba(234,179,8,0.5)]' : ''}`}>
               <span className="text-2xl font-black uppercase tracking-widest text-white/80 mb-6 drop-shadow-md">Andar</span>
               <div className="flex flex-wrap gap-[-40px] justify-center max-w-[250px]">
                  {andarCards.map((c, i) => (
                    <motion.div key={i} initial={{ x: 100, y: -100, opacity: 0, rotateZ: -15 }} animate={{ x: 0, y: 0, opacity: 1, rotateZ: i % 2 === 0 ? 5 : -5 }} style={{ marginLeft: i > 0 ? -40 : 0 }}>
                      <Card3D card={c} hidden={false} size="md" />
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* Bahar (Right) */}
            <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${choice === 'bahar' ? 'bg-white/5 border-yellow-500/50' : 'border-transparent'} ${winningSide === 'bahar' ? 'shadow-[0_0_50px_rgba(234,179,8,0.5)]' : ''}`}>
               <span className="text-2xl font-black uppercase tracking-widest text-white/80 mb-6 drop-shadow-md">Bahar</span>
               <div className="flex flex-wrap gap-[-40px] justify-center max-w-[250px]">
                  {baharCards.map((c, i) => (
                    <motion.div key={i} initial={{ x: -100, y: -100, opacity: 0, rotateZ: 15 }} animate={{ x: 0, y: 0, opacity: 1, rotateZ: i % 2 === 0 ? -5 : 5 }} style={{ marginLeft: i > 0 ? -40 : 0 }}>
                      <Card3D card={c} hidden={false} size="md" />
                    </motion.div>
                  ))}
               </div>
            </div>
         </div>

         {/* Result Overlay */}
         <AnimatePresence>
            {gameState === 'finished' && (
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  {winningSide === choice ? (
                    <>
                      <span className="text-6xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]">YOU WIN!</span>
                      <span className="text-4xl font-mono font-bold text-white drop-shadow-md mt-4">₹{(betAmount * (choice === 'andar' ? 1.88 : 2.00)).toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-6xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] -rotate-6">YOU LOSE</span>
                  )}
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Control Panel */}
      <div className="bg-[#12121a] border-t border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-4">
             <div className="flex flex-col w-32">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bet Amount</span>
                <input 
                   type="number" 
                   value={betAmount}
                   onChange={e => setBetAmount(Number(e.target.value))}
                   disabled={gameState === 'dealing'}
                   className="bg-black/50 border border-white/10 rounded px-2 py-2 font-mono font-bold text-sm focus:border-yellow-500 outline-none disabled:opacity-50"
                />
             </div>
          </div>

          <div className="flex items-center gap-4">
             <button
                onClick={() => setChoice('andar')}
                disabled={gameState === 'dealing'}
                className={`w-32 py-3 rounded-xl font-black uppercase tracking-widest transition-all border-2 ${
                  choice === 'andar' ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                }`}
             >
                Andar (1.88x)
             </button>
             <button
                onClick={() => setChoice('bahar')}
                disabled={gameState === 'dealing'}
                className={`w-32 py-3 rounded-xl font-black uppercase tracking-widest transition-all border-2 ${
                  choice === 'bahar' ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                }`}
             >
                Bahar (2.00x)
             </button>
          </div>

          <button
             onClick={handleDeal}
             disabled={gameState === 'dealing' || betAmount > balance}
             className="px-12 py-4 bg-teal-500 hover:bg-teal-400 disabled:bg-gray-700 disabled:text-gray-500 text-black rounded-xl font-black uppercase tracking-widest text-xl shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all"
          >
             {gameState === 'dealing' ? 'Dealing...' : 'Deal'}
          </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
         .perspective-1000 { perspective: 1000px; }
         .preserve-3d { transform-style: preserve-3d; }
         .backface-hidden { backface-visibility: hidden; }
         .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};
