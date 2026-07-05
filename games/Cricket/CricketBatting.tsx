
"use client";

import React, { useState, useRef } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const SHOTS = ["Straight", "Cover Drive", "Pull", "Sweep", "Cut", "Hook"] as const;
type Shot = typeof SHOTS[number];

export default function CricketBatting() {
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [message, setMessage] = useState("Choose your shot!");
  const [gameOver, setGameOver] = useState(false);

  const bat = (shot: Shot) => {
    if (gameOver) return;

    const outcomes = [0, 1, 2, 3, 4, 6, "Wicket"];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    setBalls(b => b + 1);

    if (outcome === "Wicket") {
      setWickets(w => w + 1);
      setMessage("🏏 Wicket! Better luck next ball!");
      if (wickets + 1 >= 3) {
        setGameOver(true);
        setMessage("🏏 Innings Over!");
      }
    } else {
      setScore(s => s + (outcome as number));
      const sixMsg = outcome === 6 ? " SIX! What a hit!" : outcome === 4 ? " FOUR! Beautiful boundary!" : "";
      setMessage(`🏏 You scored ${outcome} runs!${sixMsg}`);
    }
  };

  const resetGame = () => {
    setScore(0);
    setWickets(0);
    setBalls(0);
    setGameOver(false);
    setMessage("Choose your shot!");
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">🏏 Cricket Batting Challenge</h2>
        <p className="text-xl font-bold text-primary">Score: {score} | Wickets: {wickets}/3 | Balls: {balls}</p>
      </div>

      <Card className="w-full max-w-4xl p-8 border border-border-light bg-gradient-to-br from-[#0B0B0B] to-secondary">
        <div className="text-center py-12 mb-8">
          <p className="text-2xl font-bold text-white">{message}</p>
        </div>

        {/* Shot Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {SHOTS.map((shot) => (
            <Button
              key={shot}
              variant="secondary"
              className="py-4 text-lg"
              onClick={() => bat(shot)}
              disabled={gameOver}
            >
              {shot}
            </Button>
          ))}
        </div>

        {gameOver && (
          <div className="text-center">
            <h3 className="text-3xl font-black text-primary mb-4">
              {score >= 50 ? "🏆 Outstanding batting!" : "Good innings!"}
            </h3>
            <p className="text-xl text-white mb-8">Final Score: {score} runs from {balls} balls</p>
          </div>
        )}

        <Button variant="primary" size="lg" onClick={resetGame}>
          <RefreshCw className="w-5 h-5 mr-2" />
          Bat Again
        </Button>
      </Card>
    </div>
  );
}
