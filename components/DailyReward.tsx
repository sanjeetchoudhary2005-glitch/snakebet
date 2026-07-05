'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Gift, Calendar, Trophy, AlertCircle } from 'lucide-react';

type DailyRewardState = {
  canClaim: boolean;
  currentStreak: number;
  nextReward: number;
  lastClaimed: string | null;
};

const streakRewards = [10, 25, 50, 100, 200, 350, 500];

export function DailyReward() {
  const [state, setState] = useState<DailyRewardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/daily-reward');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily reward status:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!state?.canClaim || claiming) return;

    setClaiming(true);
    setMessage('');

    try {
      const res = await fetch('/api/daily-reward', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState({
          canClaim: false,
          currentStreak: data.newStreak,
          nextReward: 0,
          lastClaimed: new Date().toISOString(),
        });
        setMessage(`🎉 You claimed ₹${data.reward.amount}!`);
      } else {
        setMessage('Failed to claim reward');
      }
    } catch (error) {
      setMessage('Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Daily Rewards</h3>
        </div>
        <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1 rounded-full">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">
            {state?.currentStreak || 0} Day Streak 🔥
          </span>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const isCompleted = day <= (state?.currentStreak || 0);
          const isToday = day === (state?.currentStreak || 0) + 1;
          const isClaimable = isToday && state?.canClaim;

          return (
            <motion.div
              key={day}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: day * 0.1 }}
              className={`relative p-3 rounded-xl text-center border-2 transition-all ${
                isCompleted
                  ? 'bg-amber-950/30 border-white/20'
                  : isClaimable
                  ? 'bg-yellow-900/30 border-yellow-500 animate-pulse'
                  : 'bg-gray-700/30 border-gray-600'
              }`}
            >
              <div className="text-sm font-bold text-white">Day {day}</div>
              <div className="text-xs text-gray-300 mt-1">₹{streakRewards[day - 1]}</div>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-white absolute top-1 right-1" />
              )}
              {isClaimable && (
                <AlertCircle className="h-4 w-4 text-yellow-400 absolute top-1 right-1" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Claim Button */}
      {state?.canClaim ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={claimReward}
          disabled={claiming}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-lg rounded-xl hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {claiming ? 'Claiming...' : `Claim ₹${state.nextReward}! 🎁`}
        </motion.button>
      ) : (
        <div className="text-center py-4 bg-gray-700 rounded-xl">
          <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            Come back tomorrow for your next reward!
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="mt-4 text-center text-white font-semibold">{message}</div>
      )}
    </div>
  );
}
