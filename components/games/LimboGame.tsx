
'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export function LimboGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    resultMultiplier: number;
    payout: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const play = async () => {
    if (balance < betAmount || isPlaying) return;
    setError(null);
    setIsPlaying(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/games/limbo/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, targetMultiplier }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRoundId(data.roundId);
      setLastResult({
        won: data.won,
        resultMultiplier: data.resultMultiplier,
        payout: data.payout,
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      refresh();
      fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="limbo-game bg-secondary rounded-2xl p-6 border border-gray-700 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-white text-center flex items-center justify-center gap-2">
        🎯 Limbo
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center mb-6">
        <div className="w-full h-40 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl flex items-end justify-center overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-white">
              {lastResult ? (
                <span className={lastResult.won ? 'text-white' : 'text-red-400'}>
                  {lastResult.resultMultiplier.toFixed(2)}x
                </span>
              ) : (
                <span className="text-gray-400">Ready</span>
              )}
            </div>
          </div>
          {isPlaying && (
            <div className="w-full h-1 bg-primary animate-pulse" />
          )}
        </div>
      </div>

      {lastResult && (
        <div
          className={`mb-4 p-3 text-center rounded-lg font-bold ${
            lastResult.won
              ? 'bg-white/10 border border-white/20 text-white'
              : 'bg-red-900/50 border border-red-500 text-red-200'
          }`}
        >
          {lastResult.won
            ? `🎉 Won ₹${lastResult.payout.toFixed(2)}!`
            : `😢 Crashed at ${lastResult.resultMultiplier.toFixed(2)}x!`}
        </div>
      )}

      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block text-center">
          Target Multiplier (1.01x+)
        </label>
        <div className="flex gap-2 justify-center flex-wrap">
          {[1.5, 2, 3, 5, 10, 20, 50, 100].map(val => (
            <button
              key={val}
              onClick={() => setTargetMultiplier(val)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                targetMultiplier === val
                  ? 'bg-primary text-black'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {val}x
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block text-center">Bet Amount</label>
        <div className="flex gap-2 flex-wrap justify-center">
          {[10, 50, 100, 250, 500, 1000].map(val => (
            <button
              key={val}
              onClick={() => setBetAmount(val)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                betAmount === val ? 'bg-primary text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              ₹{val}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={play}
          disabled={isPlaying || balance < betAmount}
          className="px-12 py-4 bg-gradient-to-r from-primary to-white text-black font-bold text-xl rounded-xl shadow-lg hover:from-yellow-400 hover:to-amber-400 transition-all disabled:opacity-50"
        >
          {isPlaying ? 'Playing...' : 'Play Limbo!'}
        </button>
      </div>

      {roundId && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 text-center">
          <div>Round ID: {roundId}</div>
          <a
            href={`/api/games/limbo/verify/${roundId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Verify Fairness →
          </a>
        </div>
      )}
    </div>
  );
}
