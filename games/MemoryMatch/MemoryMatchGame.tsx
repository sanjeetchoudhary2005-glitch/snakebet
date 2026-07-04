
"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

const EMOJIS = ["🎮", "🎲", "🎯", "🎪", "🎨", "🎭", "🎤", "🎸"];

type CardType = { id: number; emoji: string; flipped: boolean; matched: boolean };

const createDeck = () => {
  const deck: CardType[] = [];
  EMOJIS.forEach((emoji, index) => {
    deck.push({ id: index * 2, emoji, flipped: false, matched: false });
    deck.push({ id: index * 2 + 1, emoji, flipped: false, matched: false });
  });
  return deck.sort(() => Math.random() - 0.5);
};

export default function MemoryMatchGame() {
  const [deck, setDeck] = useState<CardType[]>(createDeck());
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (deck.every(card => card.matched)) {
      setGameWon(true);
    }
  }, [deck]);

  const handleCardClick = (cardId: number) => {
    if (isChecking) return;
    const card = deck.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched || selectedCards.length >= 2) return;

    setDeck(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c));
    setSelectedCards(prev => [...prev, cardId]);
  };

  useEffect(() => {
    if (selectedCards.length === 2) {
      setIsChecking(true);
      setMoves(m => m + 1);

      const [id1, id2] = selectedCards;
      const card1 = deck.find(c => c.id === id1);
      const card2 = deck.find(c => c.id === id2);

      if (card1 && card2 && card1.emoji === card2.emoji) {
        setTimeout(() => {
          setDeck(prev => prev.map(c => 
            c.id === id1 || c.id === id2 ? { ...c, matched: true } : c
          ));
          setScore(s => s + 10);
          setSelectedCards([]);
          setIsChecking(false);
        }, 600);
      } else {
        setTimeout(() => {
          setDeck(prev => prev.map(c => 
            (c.id === id1 || c.id === id2) && !c.matched ? { ...c, flipped: false } : c
          ));
          setSelectedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [selectedCards, deck]);

  const resetGame = () => {
    setDeck(createDeck());
    setSelectedCards([]);
    setScore(0);
    setMoves(0);
    setGameWon(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-2">Memory Match</h2>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-muted-light text-sm">Score</p>
            <p className="text-2xl font-black text-primary">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-light text-sm">Moves</p>
            <p className="text-2xl font-black text-accent">{moves}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {deck.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={isChecking || card.matched}
            className={`w-20 h-24 rounded-xl text-4xl flex items-center justify-center transition-all duration-300 ${
              card.matched ? "bg-primary/30 border-2 border-primary" :
              card.flipped ? "bg-secondary border-2 border-primary" :
              "bg-secondary-light hover:bg-secondary border-2 border-border hover:border-primary/50"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "❓"}
          </button>
        ))}
      </div>

      {gameWon && (
        <div className="text-center">
          <h3 className="text-3xl font-black text-primary mb-4">🎉 You Won! 🎉</h3>
          <p className="text-xl text-white mb-6">
            Final Score: {score} in {moves} moves!
          </p>
          <Button variant="primary" onClick={resetGame}>
            <RefreshCw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        </div>
      )}

      {!gameWon && (
        <Button variant="secondary" onClick={resetGame}>
          <RefreshCw className="w-5 h-5 mr-2" />
          New Game
        </Button>
      )}
    </div>
  );
}
