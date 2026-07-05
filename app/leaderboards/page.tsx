'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, TrendingUp, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  gamesPlayed: number;
  netProfit: number;
  winRate: number;
};

type Period = 'today' | 'weekly' | 'alltime';

const LeaderboardsPage = () => {
  const [period, setPeriod] = useState<Period>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ rank: number; netProfit: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboards?period=${period}&page=${currentPage}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries || []);
        setTotalPages(data.totalPages || 1);
        setCurrentUser(data.currentUser || null);
      })
      .catch(() => {
        setEntries([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [period, currentPage]);

  const periods: { id: Period; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'alltime', label: 'All Time' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-[#94A3B8] hover:text-[#FFFFFF] flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-black text-white">Leaderboards</h1>
        <p className="text-[#94A3B8] mt-2">Real rankings based on net gaming profit</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPeriod(p.id);
              setCurrentPage(1);
            }}
            className={`px-5 py-2.5 rounded-xl font-black transition-all ${
              period === p.id
                ? 'bg-[#FFFFFF] text-black'
                : 'bg-[#141414] border border-[#2A2A2A] text-white hover:border-[#FFFFFF]/30'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {currentUser && (
        <Card className="p-4 mb-6 border-[#FFFFFF]/20 bg-[#141414]">
          <p className="text-white text-sm">
            Your rank: <span className="font-black text-[#FFFFFF]">#{currentUser.rank}</span> · Net:{' '}
            <span className={currentUser.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
              ₹{currentUser.netProfit.toLocaleString()}
            </span>
          </p>
        </Card>
      )}

      <Card className="overflow-hidden border-[#2A2A2A]">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading leaderboard…</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Not enough activity yet. Play a game to appear on the board.
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A2A]">
            {entries.map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-5 hover:bg-[#141414]/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                      player.rank === 1
                        ? 'bg-yellow-400 text-black'
                        : player.rank === 2
                          ? 'bg-gray-300 text-black'
                          : player.rank === 3
                            ? 'bg-orange-400 text-black'
                            : 'bg-[#2A2A2A] text-white'
                    }`}
                  >
                    {player.rank <= 3 ? <Crown className="w-5 h-5" /> : player.rank}
                  </div>
                  <div>
                    <div className="text-white font-bold">{player.username}</div>
                    <div className="text-xs text-gray-400">
                      {player.gamesPlayed} games · {player.winRate}% win rate
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-lg flex items-center gap-1 ${player.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendingUp className="w-4 h-4" />
                    ₹{player.netProfit.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Net profit</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaderboardsPage;
