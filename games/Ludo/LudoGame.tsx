
"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

const COLORS = ["#FF4444", "#00E701", "#FFDD00", "#4444FF"] as const;
const COLOR_NAMES = ["Red", "Green", "Yellow", "Blue"] as const;

export default function LudoGame() {
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const rollDice = () => {
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        setRolling(false);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        if (finalVal !== 6) {
          setCurrentPlayer((prev) => (prev + 1) % 4);
        }
      }
    }, 100);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 max-w-6xl mx-auto">
      {/* Left: Board Area */}
      <div className="flex-1 flex flex-col items-center gap-6">
        <div className="w-full max-w-md aspect-square bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl border-2 border-white/10 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🎲</div>
            <h3 className="text-2xl font-black text-white">Ludo Board Coming Soon!</h3>
            <p className="text-muted-light mt-2">Add the board image from GAME_ASSETS.md</p>
          </div>
        </div>

        {/* Player Turn Indicator */}
        <div className="flex items-center gap-4 bg-secondary/50 border border-border rounded-2xl p-4">
          <div className="text-center">
            <p className="text-xs text-muted-light uppercase mb-1">Current Turn</p>
            <p className="text-lg font-bold" style={{ color: COLORS[currentPlayer] }}>
              {COLOR_NAMES[currentPlayer]}
            </p>
          </div>

          <div className="w-20 h-20 flex items-center justify-center bg-background border-2 border-border rounded-2xl">
            <span className="text-4xl font-black" style={{ color: COLORS[currentPlayer] }}>
              {diceValue}
            </span>
          </div>

          <Button 
            variant="primary" 
            onClick={rollDice}
            disabled={rolling}
          >
            {rolling ? "Rolling..." : "Roll Dice"}
          </Button>
        </div>
      </div>

      {/* Right: Players */}
      <div className="lg:w-72">
        <div className="bg-secondary/50 border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-border pb-2">Players</h3>
          {COLORS.map((color, idx) => (
            <div 
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border ${idx === currentPlayer ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {COLOR_NAMES[idx][0]}
                </div>
                <div>
                  <p className="font-bold" style={{ color }}>{COLOR_NAMES[idx]}</p>
                  <p className="text-xs text-muted-light">Tokens: 4</p>
                </div>
              </div>
              {idx === currentPlayer && (
                <span className="text-primary text-xs font-bold animate-pulse">TURN</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
