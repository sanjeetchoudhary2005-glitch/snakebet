
"use client";

import React, { useState, useRef } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const TARGETS = ["Top Left", "Top Right", "Bottom Left", "Bottom Right", "Center"] as const;
type Target = typeof TARGETS[number];

export default function PenaltyShootout() {
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("Choose your shot!");
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const shoot = (target: Target) => {
    if (gameOver) return;

    const keeperDives = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    const scored = target !== keeperDives;

    setAttempts(a => a + 1);
    if (scored) {
      setScore(s => s + 1);
      setMessage("🎉 GOAL! Beautiful shot!");
    } else {
      setMessage("😮 Saved by the keeper!");
    }
    setShowResult(true);

    if (attempts + 1 >= 5) {
      setGameOver(true);
    } else {
      setTimeout(() => setShowResult(false), 1500);
    }
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setMessage("Choose your shot!");
    setGameOver(false);
    setShowResult(false);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">⚽ Penalty Shootout</h2>
        <p className="text-xl font-bold text-primary">Score: {score}/5</p>
      </div>

      <Card className="w-full max-w-3xl p-8 border border-border-light bg-gradient-to-br from-[#0B0B0B] to-secondary">
        {/* Goal Area */}
        <div className="relative w-full h-64 bg-gradient-to-r from-green-900/40 to-green-800/40 rounded-2xl border-2 border-white/20 overflow-hidden mb-6">
          {/* Goal Posts */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white"></div>
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-white"></div>
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-white"></div>

          {/* Target Zones */}
          {!showResult && !gameOver && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2 p-4">
              <button onClick={() => shoot("Top Left")} className="bg-white/10 hover:bg-primary/30 rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"></button>
              <button onClick={() => shoot("Center")} className="bg-white/10 hover:bg-primary/30 rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"></button>
              <button onClick={() => shoot("Top Right")} className="bg-white/10 hover:bg-primary/30 rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"></button>
              <button onClick={() => shoot("Bottom Left")} className="bg-white/10 hover:bg-primary/30 rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"></button>
              <div></div>
              <button onClick={() => shoot("Bottom Right")} className="bg-white/10 hover:bg-primary/30 rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"></button>
            </div>
          )}

          {/* Result Message */}
          {(showResult || gameOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <p className="text-3xl font-black text-white mb-2">{message}</p>
              {gameOver && (
                <p className="text-xl font-bold text-primary">
                  {score >= 3 ? "🏆 Victory! You're a pro!" : "😕 Keep practicing!"}
                </p>
              )}
            </div>
          )}
        </div>

        <Button variant="primary" size="lg" onClick={resetGame}>
          <RefreshCw className="w-5 h-5 mr-2" />
          Play Again
        </Button>
      </Card>
    </div>
  );
}
