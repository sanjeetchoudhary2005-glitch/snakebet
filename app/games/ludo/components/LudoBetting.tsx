'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

interface BettingProps {
  onMatchCreate: (betAmount: number) => void;
  onMatchJoin: (matchId: string) => void;
  waitingMatches: any[];
  opponent: { id: string; username: string } | null;
}

export function LudoBetting({ onMatchCreate, onMatchJoin, waitingMatches, opponent }: BettingProps) {
  const { balance = 0 } = useWallet();
  const [betAmount, setBetAmount] = useState(200);
  const [isLoading, setIsLoading] = useState(false);

  const presets = [50, 100, 200, 500, 1000, 5000];

  const calculateCommission = (amount: number) => {
    const pool = amount * 2;
    const commission = Math.max(pool * 0.05, 20);
    return Math.min(commission, 1000);
  };

  const handleCreate = async () => {
    if (betAmount > balance) {
      alert('Insufficient balance');
      return;
    }
    setIsLoading(true);
    await onMatchCreate(betAmount);
    setIsLoading(false);
  };

  const commission = calculateCommission(betAmount);
  const pool = betAmount * 2;
  const winnerPayout = pool - commission;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-yellow-500/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💰</span>
        <h2 className="text-xl font-bold">Ludo Betting</h2>
      </div>

      {/* Waiting matches list */}
      {waitingMatches.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">📋 Available Matches</h3>
          <div className="space-y-2">
            {waitingMatches.map((match) => (
              <div key={match.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                <div>
                  <div className="text-white font-semibold">₹{match.betAmount}</div>
                  <div className="text-xs text-gray-400">{match.playerCount}/2 players</div>
                </div>
                <button
                  onClick={() => onMatchJoin(match.id)}
                  className="px-3 py-1 bg-yellow-500 text-black rounded-lg text-sm font-bold hover:bg-yellow-400 transition-all"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opponent status */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-400">Opponent</span>
        {opponent ? (
          <span className="text-white font-bold">✅ {opponent.username}</span>
        ) : (
          <span className="text-yellow-400 animate-pulse">⏳ Searching...</span>
        )}
      </div>

      {/* Bet presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Bet Amount (per player)</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((val) => (
            <button
              key={val}
              onClick={() => setBetAmount(val)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                betAmount === val
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              ₹{val}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <input
        type="number"
        value={betAmount}
        onChange={(e) => setBetAmount(Number(e.target.value))}
        min={50}
        max={10000}
        className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 text-white mb-4"
        placeholder="Custom amount"
      />

      {/* Payout summary */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Pool</span>
          <span className="font-bold">₹{pool.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Platform Fee</span>
          <span className="text-yellow-400">-₹{commission.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-gray-700 pt-2 mt-2">
          <span className="text-gray-400">Winner Gets</span>
          <span className="font-bold text-white">₹{winnerPayout.toFixed(2)}</span>
        </div>
      </div>

      {/* Create match button */}
      <button
        onClick={handleCreate}
        disabled={isLoading || betAmount > balance}
        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> Creating Match...
          </span>
        ) : (
          '🚀 Create New Match'
        )}
      </button>

      {/* Balance warning */}
      {betAmount > balance && (
        <p className="text-red-400 text-sm text-center mt-2">
          ❌ Insufficient balance. You have ₹{balance.toFixed(2)}
        </p>
      )}
    </div>
  );
}
