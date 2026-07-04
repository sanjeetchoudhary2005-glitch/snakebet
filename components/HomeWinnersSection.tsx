'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { formatRelativeTime } from '@/lib/privacy';

type Winner = {
  rank?: number;
  username: string;
  amount: number;
  avatar?: string;
  gameName?: string;
  timestamp?: string;
};

export function HomeWinnersSection() {
  const [topToday, setTopToday] = useState<Winner[]>([]);
  const [recentWins, setRecentWins] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/live/snapshot')
      .then((res) => res.json())
      .then((data) => {
        setTopToday(data.topToday || []);
        setRecentWins(
          (data.recentWins || []).slice(0, 8).map((w: Winner) => ({
            username: w.username,
            amount: w.amount,
            gameName: w.gameName,
            timestamp: w.timestamp,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading live winners…</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 border-[#2A2A2A]">
        <h3 className="text-xl font-bold text-white mb-6">Top Winners Today</h3>
        {topToday.length === 0 ? (
          <p className="text-gray-400 text-sm">Not enough activity yet. Be the first to win big today.</p>
        ) : (
          <div className="space-y-4">
            {topToday.map((winner, index) => (
              <motion.div
                key={`${winner.username}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      winner.rank === 1
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                        : winner.rank === 2
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black'
                          : winner.rank === 3
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black'
                            : 'bg-[#2A2A2A] text-[#FFFFFF]'
                    }`}
                  >
                    {winner.rank}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFFFFF]/20 to-[#FFFFFF]/5 flex items-center justify-center text-[#FFFFFF] font-bold">
                    {winner.avatar}
                  </div>
                  <span className="text-white font-semibold">{winner.username}</span>
                </div>
                <div className="text-right">
                  <div className="text-[#FFFFFF] font-black text-lg">₹{winner.amount.toLocaleString()}</div>
                  <div className="text-[#94A3B8] text-xs">Won</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 border-[#2A2A2A]">
        <h3 className="text-xl font-bold text-white mb-6">Live Wins Feed</h3>
        {recentWins.length === 0 ? (
          <p className="text-gray-400 text-sm">Be the first to win big today.</p>
        ) : (
          <div className="space-y-4">
            {recentWins.map((winner, index) => (
              <motion.div
                key={`${winner.username}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="p-4 rounded-xl bg-[#141414] border-l-4 border-[#FFFFFF]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{winner.username}</span>
                  {winner.timestamp && (
                    <span className="text-[#94A3B8] text-sm">{formatRelativeTime(winner.timestamp)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#FFFFFF] font-black text-xl">₹{winner.amount.toLocaleString()}</span>
                  {winner.gameName && <span className="text-[#94A3B8]">on {winner.gameName}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
