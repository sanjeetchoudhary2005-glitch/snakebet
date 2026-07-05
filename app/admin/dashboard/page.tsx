'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  // Mock data for initial render, usually fetched from API
  const [stats, setStats] = useState({
    activePlayers: 124,
    gamesPlayed: 14592,
    totalRake: 45890,
    newSignups: 34
  });

  const hourlyUsers = [
    { time: '10am', users: 40 }, { time: '11am', users: 55 }, { time: '12pm', users: 80 }, 
    { time: '1pm', users: 110 }, { time: '2pm', users: 105 }, { time: '3pm', users: 124 }
  ];

  const rakeData = [
    { game: 'Dice', rake: 12000 }, { game: 'Plinko', rake: 18000 }, { game: 'Teen Patti', rake: 8500 },
    { game: 'Wheel', rake: 4000 }, { game: 'HiLo', rake: 3390 }
  ];

  const volumeData = [
    { day: 'Mon', vol: 400000 }, { day: 'Tue', vol: 300000 }, { day: 'Wed', vol: 550000 },
    { day: 'Thu', vol: 450000 }, { day: 'Fri', vol: 700000 }, { day: 'Sat', vol: 900000 }, { day: 'Sun', vol: 850000 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1 font-mono text-sm">Real-time platform metrics</p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 shadow-lg">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Players Now</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-white">{stats.activePlayers}</h2>
            <span className="text-green-400 text-xs font-bold">● Live</span>
          </div>
        </div>
        <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 shadow-lg">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Games Played Today</p>
          <h2 className="text-4xl font-black text-white">{stats.gamesPlayed.toLocaleString()}</h2>
        </div>
        <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-400 text-6xl">₹</div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Rake Today</p>
          <h2 className="text-4xl font-black text-yellow-400">₹{stats.totalRake.toLocaleString()}</h2>
        </div>
        <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 shadow-lg">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">New Signups Today</p>
          <h2 className="text-4xl font-black text-teal-400">+{stats.newSignups}</h2>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hourly Active Users */}
        <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Hourly Active Users (Last 24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyUsers}>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0D0B14', borderColor: '#2DD4BF', borderRadius: '8px' }} itemStyle={{ color: '#2DD4BF', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="users" stroke="#2DD4BF" strokeWidth={3} dot={{ r: 4, fill: '#0D0B14', stroke: '#2DD4BF', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rake by Game */}
        <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 shadow-lg">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Rake Revenue by Game</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rakeData}>
                <XAxis dataKey="game" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0D0B14', borderColor: '#D4A647', borderRadius: '8px' }} itemStyle={{ color: '#D4A647', fontWeight: 'bold' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="rake" fill="#D4A647" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Over Time */}
        <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 shadow-lg lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Bet Volume (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => \`₹\${val/1000}k\`} />
                <Tooltip contentStyle={{ backgroundColor: '#0D0B14', borderColor: '#2DD4BF', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="vol" stroke="#2DD4BF" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
