"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { useGameEffects } from "@/hooks/useGameEffects";
import { PlayingCard, CardData } from "./PlayingCard";

type GamePhase = "idle" | "betting" | "player-turn" | "dealer-turn" | "settled";

export const BlackjackGame = () => {
  const { balance, refreshBalance } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [betAmount, setBetAmount] = useState<number>(0);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  
  const [playerCards, setPlayerCards] = useState<CardData[]>([]);
  const [dealerCards, setDealerCards] = useState<CardData[]>([]);
  const [isDealing, setIsDealing] = useState<boolean>(false);

  const chipValues = [1, 5, 10, 25, 100];

  const calculateHandValue = (cards: CardData[], isHidden: boolean = false) => {
    let value = 0;
    let aces = 0;
    const visibleCards = isHidden ? cards.slice(0, 1) : cards;
    
    for (const card of visibleCards) {
      if (!card) continue;
      if (card.rank === 'A') {
        value += 11;
        aces += 1;
      } else if (['J', 'Q', 'K'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank, 10);
      }
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }
    return value;
  };

  const handlePlaceBet = (amount: number) => {
    playSound("chip");
    setBetAmount(prev => prev + amount);
    if (phase === "idle") setPhase("betting");
  };

  const handleClearBet = () => {
    playSound("click");
    setBetAmount(0);
    setPhase("idle");
  };

  const dealGame = async () => {
    if (betAmount <= 0) return;
    
    setIsDealing(true);
    playSound("click");

    try {
      const res = await fetch("/api/games/blackjack/deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setIsDealing(false);
        return;
      }

      setRoundId(data.roundId);
      refreshBalance();

      // Animate dealing
      setPlayerCards([data.playerHand[0]]);
      playSound("card");
      await new Promise(r => setTimeout(r, 200));

      setDealerCards([data.dealerHand[0]]);
      playSound("card");
      await new Promise(r => setTimeout(r, 200));

      setPlayerCards([data.playerHand[0], data.playerHand[1]]);
      playSound("card");
      await new Promise(r => setTimeout(r, 200));

      setDealerCards([data.dealerHand[0], data.dealerHand[1]]); // Second card is hidden by backend structure
      playSound("card");
      await new Promise(r => setTimeout(r, 500));

      setPhase(data.phase);
      if (data.outcome) {
        handleOutcome(data.outcome, data.payout);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDealing(false);
    }
  };

  const processAction = async (action: "hit" | "stand" | "double") => {
    if (phase !== "player-turn") return;
    
    playSound("click");
    if (action === "double") setBetAmount(prev => prev * 2);

    try {
      const res = await fetch("/api/games/blackjack/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, action }),
      });
      const data = await res.json();
      
      if (data.error) {
         alert(data.error);
         return;
      }
      
      if (data.playerHand) {
        setPlayerCards(data.playerHand);
        if (data.playerHand.length > playerCards.length) playSound("card");
      }
      
      if (data.phase === "dealer-turn" || data.phase === "settled") {
        setPhase("dealer-turn");
        
        // Stagger dealer cards
        let currentDealerCards = [...data.dealerHand.slice(0, 2)];
        setDealerCards(currentDealerCards); // Reveal hole card
        playSound("card");
        await new Promise(r => setTimeout(r, 800));

        for (let i = 2; i < data.dealerHand.length; i++) {
          currentDealerCards = [...currentDealerCards, data.dealerHand[i]];
          setDealerCards(currentDealerCards);
          playSound("card");
          await new Promise(r => setTimeout(r, 800));
        }

        setPhase("settled");
        handleOutcome(data.outcome, data.payout);
      } else {
        setPhase(data.phase);
      }
      
      refreshBalance();

    } catch (err) {
      console.error(err);
    }
  };

  const handleOutcome = (result: string, payout: number) => {
    setOutcome(result);
    if (result.includes("WIN") || result === "BLACKJACK") {
      triggerWin(payout);
    } else if (result.includes("BUST") || result.includes("LOSE")) {
      triggerLose();
    }
    
    setTimeout(() => {
      setPhase("idle");
      setPlayerCards([]);
      setDealerCards([]);
      setOutcome(null);
      setBetAmount(0);
      setRoundId(null);
    }, 4000);
  };

  const getOutcomeColor = () => {
    if (outcome === "BLACKJACK") return "text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]";
    if (outcome === "WIN") return "text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,1)]";
    if (outcome === "BUST" || outcome === "LOSE") return "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]";
    return "text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)]";
  };

  const isDealerHidden = phase === "player-turn" && dealerCards.length === 2 && dealerCards[1].rank === '?';

  return (
    <div className="relative w-full h-[700px] flex flex-col font-sans select-none bg-[#111] overflow-hidden text-white rounded-3xl border border-white/5 shadow-2xl">
      <WinFlashOverlay />

      {/* Decorative filigree at top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
        <svg width="200" height="40" viewBox="0 0 200 40">
           <path d="M10 20 Q 50 0, 100 20 T 190 20" fill="none" stroke="#D4A647" strokeWidth="2" strokeDasharray="5,5" />
           <circle cx="100" cy="20" r="5" fill="#D4A647" />
        </svg>
      </div>

      {/* Felt background */}
      <div className="absolute inset-0 z-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"
           style={{ background: "radial-gradient(circle at 50% 120%, #1B4332 0%, #081c15 100%)" }} />

      {/* Shoe (Top Right) */}
      <div className="absolute top-10 right-10 z-10 opacity-80 pointer-events-none drop-shadow-2xl" style={{ transform: "perspective(600px) rotateY(-20deg) rotateX(20deg)" }}>
         <div className="w-24 h-36 bg-[#0f172a] rounded-xl border-[4px] border-gray-800 shadow-[20px_20px_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml,%3Csvg width=\\'10\\' height=\\'10\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M10 0l10 10-10 10L0 10z\\' fill=\\'%23ffffff\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'/%3E%3C/svg%3E')]" />
             <div className="w-16 h-2 bg-black absolute top-4 rounded-full opacity-30" />
         </div>
      </div>

      <div className="flex-1 relative z-20 flex flex-col items-center justify-between py-12">
        {/* Dealer Hand */}
        <div className="relative flex flex-col items-center h-48 justify-end">
          {dealerCards.length > 0 && (
            <>
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-1 font-mono font-bold text-lg border border-white/20 shadow-lg">
                {calculateHandValue(dealerCards, isDealerHidden)}
              </div>
              <div className="flex justify-center w-full">
                {dealerCards.map((card, i) => (
                  <PlayingCard
                    key={`dealer-${i}`}
                    rank={card.rank}
                    suit={card.suit}
                    faceDown={card.rank === '?'}
                    index={i}
                    total={dealerCards.length}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Outcome Text */}
        <div className="h-24 flex items-center justify-center w-full relative z-30">
          <AnimatePresence>
            {outcome && (
              <motion.initial
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: [1.1, 1], opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <div className={`text-6xl font-black uppercase font-display tracking-widest ${getOutcomeColor()}`}>
                  {outcome}
                </div>
              </motion.initial>
            )}
          </AnimatePresence>
        </div>

        {/* Player Hand */}
        <div className="relative flex flex-col items-center h-48 justify-start">
          {playerCards.length > 0 && (
            <>
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-1 font-mono font-bold text-lg border border-white/20 shadow-lg">
                {calculateHandValue(playerCards)}
              </div>
              <div className="flex justify-center w-full">
                {playerCards.map((card, i) => (
                  <PlayingCard
                    key={`player-${i}`}
                    rank={card.rank}
                    suit={card.suit}
                    faceDown={false}
                    index={i}
                    total={playerCards.length}
                  />
                ))}
              </div>
            </>
          )}
          
          {(phase === "idle" || phase === "betting") && (
             <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60">
                <div className="w-32 h-44 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center bg-black/10">
                   <span className="font-display uppercase text-sm tracking-widest text-white/50 mb-2">Place Bet</span>
                   {betAmount > 0 && (
                      <span className="font-mono text-xl text-yellow-400 font-bold drop-shadow-md">₹{betAmount}</span>
                   )}
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="relative z-30 bg-[#0D0B14] border-t border-white/10 p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Balance & Chips */}
          <div className="flex flex-col gap-3 flex-1">
             <div className="flex items-center gap-3 bg-black/50 border border-white/5 rounded-xl px-4 py-2 w-max">
                <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">₹</div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Balance</span>
                   <span className="font-mono font-bold text-sm leading-none mt-1">{balance.toString()}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               {chipValues.map((val) => {
                 let color = "bg-gray-800 border-gray-600";
                 if (val === 5) color = "bg-red-700 border-red-500";
                 if (val === 10) color = "bg-blue-700 border-blue-500";
                 if (val === 25) color = "bg-green-700 border-green-500";
                 if (val === 100) color = "bg-gray-900 border-yellow-600 text-yellow-500";

                 return (
                   <button
                     key={val}
                     disabled={phase !== "idle" && phase !== "betting"}
                     onClick={() => handlePlaceBet(val)}
                     className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-dashed font-mono font-bold text-sm shadow-xl hover:scale-110 active:scale-95 transition-all ${color} ${(phase !== "idle" && phase !== "betting") ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                   >
                     {val}
                   </button>
                 );
               })}
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {(phase === "idle" || phase === "betting") ? (
              <>
                <button
                  onClick={handleClearBet}
                  disabled={betAmount === 0 || isDealing}
                  className="px-6 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold uppercase tracking-widest text-sm transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={dealGame}
                  disabled={betAmount === 0 || isDealing}
                  className="px-8 py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all"
                >
                  {isDealing ? "Dealing..." : "Deal"}
                </button>
              </>
            ) : (
              <>
                 <button
                  onClick={() => processAction("double")}
                  disabled={phase !== "player-turn" || playerCards.length > 2}
                  className="px-6 py-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl font-bold uppercase tracking-widest text-sm transition-colors shadow-lg flex flex-col items-center leading-none"
                >
                  <span>Double</span>
                  <span className="text-[10px] font-mono mt-1 opacity-70">x2</span>
                </button>
                <button
                  onClick={() => processAction("stand")}
                  disabled={phase !== "player-turn"}
                  className="px-8 py-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl font-bold uppercase tracking-widest text-lg shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-colors"
                >
                  Stand
                </button>
                <button
                  onClick={() => processAction("hit")}
                  disabled={phase !== "player-turn"}
                  className="px-8 py-4 bg-teal-500 hover:bg-teal-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black rounded-xl font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-colors"
                >
                  Hit
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
