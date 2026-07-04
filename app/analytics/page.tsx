'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Trophy,
  Wallet,
  Gamepad2,
  BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { formatGameName } from '@/lib/privacy';

type AnalyticsRange = '7d' | '30d' | '90d' | 'all';

type AnalyticsData = {
  range: AnalyticsRange;
  summary: {
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    gamesPlayed: number;
    winRate: number;
  };
  byGame: Array<{
    gameId: string;
    wagered: number;
    won: number;
    net: number;
    bets: number;
    winRate: number;
  }>;
  daily: Array<{ date: string; wagered: number; won: number; net: number }>;
};

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<AnalyticsRange>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/me?range=${timeRange}`)
      .then((res) => {
        if (res.status === 401) throw new Error('Please log in to view analytics');
        if (!res.ok) throw new Error('Failed to load analytics');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [timeRange]);

  const summary = data?.summary;
  const maxDailyNet = Math.max(...(data?.daily.map((d) => Math.abs(d.net)) || [1]), 1);

  const summaryStats = summary
    ? [
        {
          label: 'Net Profit',
          value: `₹${summary.netProfit.toLocaleString()}`,
          positive: summary.netProfit >= 0,
          icon: summary.netProfit >= 0 ? TrendingUp : TrendingDown,
          color: summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400',
        },
        {
          label: 'Total Wagered',
          value: `₹${summary.totalWagered.toLocaleString()}`,
          positive: true,
          icon: Wallet,
          color: 'text-[#FFFFFF]',
        },
        {
          label: 'Games Played',
          value: summary.gamesPlayed.toLocaleString(),
          positive: true,
          icon: Gamepad2,
          color: 'text-blue-400',
        },
        {
          label: 'Win Rate',
          value: `${summary.winRate}%`,
          positive: summary.winRate >= 50,
          icon: Trophy,
          color: 'text-[#FFFFFF]',
        },
      ]
    : [];

  if (error && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/login" className="text-[#FFFFFF] underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="text-[#94A3B8] hover:text-[#FFFFFF] flex items-center gap-2 mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </Link>

      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black mb-1 text-white">Analytics</h1>
          <p className="text-[#94A3B8]">Real stats from your transaction history</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl font-black transition-all ${
                timeRange === range
                  ? 'bg-[#FFFFFF] text-black'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#141414] border border-[#2A2A2A]'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading analytics…</div>
      ) : !data || summaryStats.length === 0 ? (
        <Card className="p-12 text-center text-gray-400">
          No gaming activity yet. Play a game to see your stats here.
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {summaryStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#FFFFFF]/10 rounded-xl">
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-black mb-1 text-white">{stat.value}</p>
                    <p className="text-[#94A3B8] text-sm">{stat.label}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6 bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
                <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-6">
                  <BarChart3 className="w-6 h-6 text-[#FFFFFF]" />
                  Daily Net Result (30 days)
                </h2>
                {data.daily.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-gray-400">No daily data yet</div>
                ) : (
                  <div className="h-80 flex items-end gap-1 px-2">
                    {data.daily.map((day) => (
                      <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div
                          className={`w-full rounded-t transition-all ${day.net >= 0 ? 'bg-green-500/70' : 'bg-red-500/70'}`}
                          style={{ height: `${Math.max(4, (Math.abs(day.net) / maxDailyNet) * 100)}%` }}
                          title={`${day.date}: ₹${day.net.toLocaleString()}`}
                        />
                        <span className="text-[9px] text-gray-500 mt-1 rotate-45 origin-left hidden sm:block">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Card className="p-6 bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
                <h2 className="text-2xl font-black mb-6 text-white">Top Games</h2>
                {data.byGame.length === 0 ? (
                  <p className="text-gray-400 text-sm">No game breakdown yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.byGame.slice(0, 5).map((game) => (
                      <div key={game.gameId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#FFFFFF]" />
                          <span className="text-white font-semibold text-sm">{formatGameName(game.gameId)}</span>
                        </div>
                        <span className="text-[#94A3B8] text-sm">{game.bets} bets</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <div className="mt-10">
            <Card className="bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A] overflow-hidden">
              <div className="p-6 border-b border-[#2A2A2A]">
                <h2 className="text-2xl font-black text-white">Game Performance</h2>
              </div>
              {data.byGame.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No games played in this period</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A2A2A]">
                        <th className="px-6 py-4 text-left text-[#94A3B8] text-sm font-black uppercase">Game</th>
                        <th className="px-6 py-4 text-right text-[#94A3B8] text-sm font-black uppercase">Bets</th>
                        <th className="px-6 py-4 text-right text-[#94A3B8] text-sm font-black uppercase">Wagered</th>
                        <th className="px-6 py-4 text-right text-[#94A3B8] text-sm font-black uppercase">Win Rate</th>
                        <th className="px-6 py-4 text-right text-[#94A3B8] text-sm font-black uppercase">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {data.byGame.map((game, index) => (
                        <motion.tr
                          key={game.gameId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-[#2A2A2A]/20 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-white">{formatGameName(game.gameId)}</td>
                          <td className="px-6 py-4 text-right text-white">{game.bets}</td>
                          <td className="px-6 py-4 text-right text-white">₹{game.wagered.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-[#FFFFFF] font-black">{game.winRate}%</td>
                          <td className={`px-6 py-4 text-right font-black ${game.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ₹{game.net.toLocaleString()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
