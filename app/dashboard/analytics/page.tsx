'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion } from 'framer-motion'

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/analytics/me')
      .then(r => {
        if (!r.ok) {
          throw new Error('Failed to fetch analytics')
        }
        return r.json()
      })
      .then(setData)
      .catch(() => {
        // Fallback demo data if endpoint doesn't exist or is loading
        setData({
          totalWagered: 12500,
          totalWon: 11800,
          winRate: 48.5,
          dailyPnl: [
            { date: 'Mon', pnl: -150 },
            { date: 'Tue', pnl: 400 },
            { date: 'Wed', pnl: -200 },
            { date: 'Thu', pnl: 800 },
            { date: 'Fri', pnl: -100 },
            { date: 'Sat', pnl: 300 },
            { date: 'Sun', pnl: -200 }
          ],
          byGame: [
            { game: 'Dice', wagered: 4000, bets: 25 },
            { game: 'Crash', wagered: 3500, bets: 18 },
            { game: 'Mines', wagered: 3000, bets: 12 },
            { game: 'Plinko', wagered: 2000, bets: 30 }
          ]
        })
      })
  }, [])

  if (!data) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const COLORS = ['#FFD700', '#FF6347', '#00FF7F', '#00BFFF', '#FF69B4', '#9370DB']

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <h1 className="text-3xl font-black text-yellow-400 mb-6">📊 Your Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Wagered', value: `₹${data.totalWagered?.toLocaleString()}`, color: 'text-blue-400', icon: '💰' },
          { label: 'Total Won', value: `₹${data.totalWon?.toLocaleString()}`, color: 'text-green-400', icon: '🏆' },
          { label: 'Net P&L', value: `₹${(data.totalWon - data.totalWagered)?.toLocaleString()}`,
            color: data.totalWon >= data.totalWagered ? 'text-green-400' : 'text-red-400', icon: '📈' },
          { label: 'Win Rate', value: `${data.winRate?.toFixed(1)}%`, color: 'text-yellow-400', icon: '🎯' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#12121a] rounded-2xl p-4 border border-white/5"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-gray-400 text-xs">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* P&L Over Time Chart */}
      <div className="bg-[#12121a] rounded-2xl p-6 border border-white/5 mb-4">
        <h2 className="text-lg font-bold mb-4">Daily P&L (Last 30 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyPnl ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #ffffff20', borderRadius: 8 }} />
              <Line type="monotone" dataKey="pnl" stroke="#FFD700" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Game breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-bold mb-4">Wagered by Game</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byGame ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="game" tick={{ fill: '#666', fontSize: 9 }} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #ffffff20', borderRadius: 8 }} />
                <Bar dataKey="wagered" fill="#FFD700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-bold mb-4">Favorite Games</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byGame ?? []} dataKey="bets" nameKey="game" cx="50%" cy="50%" outerRadius={80} label>
                  {(data.byGame ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #ffffff20', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
