
"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const COLORS = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"];

export default function BubbleShooter() {
  const [bubbles, setBubbles] = useState<Array<{id: number, color: string, popped: boolean}>>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [nextId, setNextId] = useState(0);

  const addBubble = () => {
    if (!gameActive) return;
    const newBubble = {
      id: nextId,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      popped: false
    };
    setBubbles(prev => [...prev, newBubble]);
    setNextId(n => n + 1);
  };

  const popBubble = (id: number) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    setScore(s => s + 10);
  };

  const startGame = () => {
    setBubbles([]);
    setScore(0);
    setGameActive(true);
  };

  const resetGame = () => {
    setGameActive(false);
    setBubbles([]);
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">🫧 Bubble Shooter</h2>
        <p className="text-xl font-bold text-primary">Score: {score}</p>
      </div>

      <Card className="w-full max-w-3xl p-8 border border-border-light bg-gradient-to-br from-[#0B0B0B] to-secondary">
        {/* Game Area */}
        <div className="relative w-full h-96 bg-gradient-to-b from-blue-900/30 to-blue-800/20 rounded-2xl border-2 border-white/10 overflow-hidden mb-6">
          {bubbles.filter(b => !b.popped).map(bubble => (
            <button
              key={bubble.id}
              onClick={() => popBubble(bubble.id)}
              className={`absolute w-12 h-12 rounded-full ${bubble.color} shadow-lg transition-all duration-300 hover:scale-110`}
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 70 + 10}%`
              }}
            ></button>
          ))}

          {!gameActive && bubbles.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
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
            <Button variant="primary" size="xl" onClick={addBubble}>
              Add Bubble
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
