'use client';
import { useState } from 'react';

interface ControlsProps {
  onRollDice: () => void;
  diceValue: number;
  isMyTurn: boolean;
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
}

export function LudoControls({ onRollDice, diceValue, isMyTurn, status }: ControlsProps) {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = async () => {
    setIsRolling(true);
    await onRollDice();
    setTimeout(() => setIsRolling(false), 500);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Turn indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm">
            {isMyTurn ? 'Your Turn 🎯' : status === 'active' ? "Opponent's Turn ⏳" : 'Waiting...'}
          </span>
        </div>

        {/* Dice display */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-3xl font-bold border-2 border-gray-700">
            {diceValue > 0 ? diceValue : '🎲'}
          </div>

          {/* Roll button */}
          <button
            onClick={handleRoll}
            disabled={!isMyTurn || status !== 'active' || isRolling}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRolling ? '🎲 Rolling...' : 'Roll'}
          </button>
        </div>
      </div>
    </div>
  );
}
