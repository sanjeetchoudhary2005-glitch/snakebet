
"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function BasketballShootout() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState("Press Start to begin!");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      setMessage("Time's up!");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameActive, timeLeft]);

  const shoot = () => {
    if (!gameActive) return;
    const scored = Math.random() > 0.4;
    setScore(s => s + (scored ? 2 : 0));
    setMessage(scored ? "🏀 SWISH! 2 points!" : "🏀 Missed the shot!");
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    setMessage("Start shooting!");
  };

  const resetGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(false);
    setMessage("Press Start to begin!");
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">🏀 Basketball Shootout</h2>
        <p className="text-xl font-bold text-primary">Score: {score} | Time: {timeLeft}s</p>
      </div>

      <Card className="w-full max-w-2xl p-8 border border-border-light bg-gradient-to-br from-[#0B0B0B] to-secondary">
        {/* Court */}
        <div className="relative w-full h-80 bg-gradient-to-b from-orange-900/30 to-orange-800/20 rounded-2xl border-2 border-white/10 flex items-center justify-center mb-6">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-4 border-l-4 border-r-4 border-white/50 rounded-t-full"></div>
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-20 h-16 bg-primary/20 border border-primary rounded-full"></div>
          
          {/* Hoop */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-16 border-4 border-white rounded-b-full relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-12 border-2 border-white/70 rounded-b-full"></div>
            </div>
          </div>

          {/* Ball */}
          <button
            onClick={shoot}
            disabled={!gameActive}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-4xl shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          >
            🏀
          </button>
        </div>

        <p className="text-center text-xl font-bold text-white mb-6">{message}</p>

        <div className="flex gap-4 justify-center">
          {!gameActive ? (
            <Button variant="primary" size="xl" onClick={startGame}>
              Start Game
            </Button>
          ) : (
            <Button variant="primary" size="xl" onClick={shoot}>
              Shoot Ball!
            </Button>
          )}
          <Button variant="secondary" onClick={resetGame}>
            <RefreshCw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
