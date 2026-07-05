"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats(data.stats);
          setActiveSessions(data.activeSessions);
          setSettings(data.settings);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading Analytics Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">Analytics Dashboard</h1>
          <a
            href="/api/admin/analytics/export"
            download
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all"
          >
            Export CSV
          </a>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-[#161224] p-6 rounded-xl border border-white/5 shadow-lg">
              <span className="text-gray-400 text-xs font-bold uppercase">Active Sessions</span>
              <div className="text-3xl font-black text-white mt-2">{activeSessions}</div>
           </div>
           <div className="bg-[#161224] p-6 rounded-xl border border-white/5 shadow-lg">
              <span className="text-gray-400 text-xs font-bold uppercase">Total Wagered (All Time)</span>
              <div className="text-3xl font-black text-teal-400 mt-2">
                 ₹{stats.reduce((acc, s) => acc + Number(s.totalWagered), 0).toFixed(2)}
              </div>
           </div>
           <div className="bg-[#161224] p-6 rounded-xl border border-white/5 shadow-lg">
              <span className="text-gray-400 text-xs font-bold uppercase">House Profit</span>
              <div className="text-3xl font-black text-green-400 mt-2">
                 ₹{stats.reduce((acc, s) => acc + Number(s.houseProfit), 0).toFixed(2)}
              </div>
           </div>
           <div className="bg-[#161224] p-6 rounded-xl border border-white/5 shadow-lg">
              <span className="text-gray-400 text-xs font-bold uppercase">Avg Configured House Edge</span>
              <div className="text-3xl font-black text-yellow-400 mt-2">
                 {settings.length > 0 ? (settings.reduce((acc, s) => acc + s.houseEdge, 0) / settings.length).toFixed(2) : '3.00'}%
              </div>
           </div>
        </div>

        {/* Real-Time House Edge Monitor per Game */}
        <div className="bg-[#161224] p-6 rounded-xl border border-white/5 shadow-lg">
           <h2 className="text-xl font-bold mb-6">Game Performance (RTP Monitor)</h2>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-gray-400 text-xs uppercase border-b border-white/10">
                   <th className="py-3 px-4">Game</th>
                   <th className="py-3 px-4">Total Bets</th>
                   <th className="py-3 px-4">Total Wagered</th>
                   <th className="py-3 px-4">House Profit</th>
                   <th className="py-3 px-4">Observed RTP</th>
                   <th className="py-3 px-4">Configured RTP</th>
                   <th className="py-3 px-4">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {stats.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">No game stats available yet (Cron job runs nightly).</td></tr>
                 ) : (
                    stats.map((s, idx) => {
                      const configuredEdge = settings.find(set => set.game === s.game)?.houseEdge || 3.0;
                      const configuredRTP = 100 - configuredEdge;
                      const drift = Math.abs(s.actualRTP - configuredRTP);
                      const status = drift > 2.0 ? 'text-red-400' : drift > 1.0 ? 'text-yellow-400' : 'text-green-400';
                      
                      return (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 capitalize font-bold">{s.game}</td>
                          <td className="py-3 px-4 font-mono">{s.totalBets}</td>
                          <td className="py-3 px-4 font-mono">₹{Number(s.totalWagered).toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono">₹{Number(s.houseProfit).toFixed(2)}</td>
                          <td className={`py-3 px-4 font-mono font-bold ${status}`}>{s.actualRTP.toFixed(2)}%</td>
                          <td className="py-3 px-4 font-mono">{configuredRTP.toFixed(2)}%</td>
                          <td className="py-3 px-4">
                             {drift > 2.0 ? '⚠️ High Drift' : '✅ Stable'}
                          </td>
                        </tr>
                      )
                    })
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
}
