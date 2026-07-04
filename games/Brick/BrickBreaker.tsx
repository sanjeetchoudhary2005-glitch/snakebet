
"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function BrickBreaker() {
  const [score, setScore] = useState(0);
  const [bricks, setBricks] = useState<Array<{id: number, destroyed: boolean}>>([]);
  const [gameActive, setGameActive] = useState(false);

  const initBricks = () => {
    const newBricks: Array<{id: number, destroyed: boolean}> = [];
    for (let i = 0; i < 24; i++) {
      newBricks.push({ id: i, destroyed: false });
    }
    setBricks(newBricks);
  };

  const startGame = () => {
    initBricks();
    setScore(0);
    setGameActive(true);
  };

  const hitBrick = (id: number) => {
    if (!gameActive) return;
    setBricks(prev => prev.map(b => b.id === id ? { ...b, destroyed: true } : b));
    setScore(s => s + 10);
  };

  const resetGame = () => {
    setGameActive(false);
    setBricks([]);
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">🧱 Brick Breaker</h2>
        <p className="text-xl font-bold text-primary">Score: {score}</p>
      </div>

      <Card className="w-full max-w-3xl p-8 border border-border-light bg-gradient-to-br from-[#0B0B0B] to-secondary">
        {/* Game Area */}
        <div className="relative w-full h-96 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border-2 border-white/10 overflow-hidden mb-6">
          {/* Bricks */}
          <div className="grid grid-cols-6 gap-2 p-4">
            {bricks.map(brick => (
              <button
                key={brick.id}
                onClick={() => hitBrick(brick.id)}
                className={`h-10 rounded-lg transition-all duration-300 ${
                  brick.destroyed ? "opacity-0" : "bg-gradient-to-br from-primary to-green-600 hover:scale-105"
                }`}
                disabled={brick.destroyed}
              ></button>
            ))}
          </div>

          {!gameActive && bricks.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <p className="text-2xl font-bold text-white mb-4">Click Start to begin!</p>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          {!gameActive ? (
            <Button variant="primary" size="xl" onClick={startGame}>
              Start Game
            </Button>
          ) : (
            <Button variant="primary" size="xl" onClick={resetGame}>
              New Game
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
