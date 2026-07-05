
"use client";

import React, { useState } from "react";
import { RefreshCw, Dices } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function DiceMasterGame() {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [total, setTotal] = useState(2);
  const [history, setHistory] = useState<number[]>([]);

  const rollDice = () => {
    setRolling(true);
    const newDice1 = Math.floor(Math.random() * 6) + 1;
    const newDice2 = Math.floor(Math.random() * 6) + 1;
    
    let count = 0;
    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        setDice1(newDice1);
        setDice2(newDice2);
        setTotal(newDice1 + newDice2);
        setHistory(prev => [newDice1 + newDice2, ...prev].slice(0, 10));
        setRolling(false);
      }
    }, 80);
  };

  const resetGame = () => {
    setDice1(1);
    setDice2(1);
    setTotal(2);
    setHistory([]);
  };

  const getDiceEmoji = (num: number) => ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][num - 1];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">🎲 Dice Master</h2>
        <p className="text-xl font-bold text-primary">Roll: {total}</p>
      </div>

      <div className="flex gap-8">
        <div className="w-32 h-32 bg-gradient-to-br from-secondary to-secondary-light border-2 border-primary rounded-3xl flex items-center justify-center text-8xl shadow-[0_0_40px_rgba(139,255,0,0.3)] transition-transform duration-300 hover:scale-105">
          {getDiceEmoji(dice1)}
        </div>
        <div className="w-32 h-32 bg-gradient-to-br from-secondary to-secondary-light border-2 border-primary rounded-3xl flex items-center justify-center text-8xl shadow-[0_0_40px_rgba(139,255,0,0.3)] transition-transform duration-300 hover:scale-105">
          {getDiceEmoji(dice2)}
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="primary" size="xl" onClick={rollDice} disabled={rolling}>
          <Dices className="w-6 h-6 mr-2" />
          {rolling ? "Rolling..." : "Roll Dice"}
        </Button>
        <Button variant="secondary" onClick={resetGame}>
          <RefreshCw className="w-5 h-5 mr-2" />
          Reset
        </Button>
      </div>

      {history.length > 0 && (
        <Card className="p-6 border border-border-light">
          <h3 className="text-lg font-bold text-white mb-4">Recent Rolls</h3>
          <div className="flex gap-2 flex-wrap">
            {history.map((roll, index) => (
              <div key={index} className="px-4 py-2 bg-background rounded-lg border border-border text-white font-bold">
                {roll}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
