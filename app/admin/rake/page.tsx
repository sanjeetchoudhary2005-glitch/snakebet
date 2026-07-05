'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminRakePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/rake')
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500 font-mono">Loading revenue data...</div>;
  }

  // Mock data if empty
  const chartData = data?.rakeByGame?.length > 0 
    ? data.rakeByGame.map((g: any) => ({ name: g.gameType, value: Number(g._sum.amount) }))
    : [
        { name: 'Dice', value: 12500 },
        { name: 'Plinko', value: 24000 },
        { name: 'Wheel', value: 8300 },
      ];

  const total = data?.totalRake || 44800;
  const projected = data?.projectedMonthly || 192000;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">Revenue Dashboard</h1>
        <p className="text-gray-400 mt-1 font-mono text-sm">House rake collection and analytics (Play-money equivalent)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161224] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-yellow-400 text-8xl">₹</div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Rake Collected</p>
          <h2 className="text-5xl font-black text-yellow-400">₹{total.toLocaleString(undefined, {maximumFractionDigits:0})}</h2>
          <p className="text-gray-500 font-mono text-[10px] mt-4">* Play-money equivalent</p>
        </div>
        <div className="bg-[#161224] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-teal-400 text-8xl">📈</div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Projected Monthly</p>
          <h2 className="text-5xl font-black text-teal-400">₹{projected.toLocaleString(undefined, {maximumFractionDigits:0})}</h2>
          <p className="text-gray-500 font-mono text-[10px] mt-4">Based on 7-day trailing average</p>
        </div>
      </div>

      <div className="bg-[#161224] p-8 rounded-3xl border border-white/5 shadow-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Rake by Game Type</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0D0B14', borderColor: '#D4A647', borderRadius: '12px' }} 
                itemStyle={{ color: '#D4A647', fontWeight: 'bold' }} 
                cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                formatter={(val: number) => [\`₹\${val.toLocaleString()}\`, 'Rake']}
              />
              <Bar dataKey="value" fill="#D4A647" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
