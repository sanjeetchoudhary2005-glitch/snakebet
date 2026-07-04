'use client';

import { useState, useEffect } from 'react';
import { TwoFactorAuth } from '@/components/TwoFactorAuth';

type SecurityEvent = {
  id: string;
  event: string;
  userId: string | null;
  ip: string | null;
  details: string | null;
  createdAt: string;
};

type SurveillanceFlag = {
  userId: string;
  username?: string | null;
  email?: string | null;
  reason: string;
  severity: 'medium' | 'high';
  metric: string;
};

type HousePool = {
  totalLiquidity: number;
  baselineLiquidity: number;
  currentExposure: number;
  platformPaused: boolean;
};

export default function SurveillanceDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'liquidity' | '2fa' | 'logs'>('dashboard');
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [isLoading, setIsLoading] = useState(false);
  const [flags, setFlags] = useState<SurveillanceFlag[]>([]);
  const [stats, setStats] = useState({ activeFlags: 0, rapidBetUsers: 0, sharedIpUsers: 0, recentEvents: 0 });

  // Liquidity & Exposure State
  const [pool, setPool] = useState<HousePool | null>(null);
  const [perGameExposure, setPerGameExposure] = useState<Record<string, number>>({});
  const [liquidityInput, setLiquidityInput] = useState('');
  const [baselineInput, setBaselineInput] = useState('');
  const [liquidityError, setLiquidityError] = useState<string | null>(null);

  const fetchSurveillanceData = () => {
    setIsLoading(true);
    fetch('/api/admin/surveillance')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setFlags(data.flags || []);
        setStats(data.stats || stats);
        setPool(data.pool || null);
        setPerGameExposure(data.perGameExposure || {});
        
        if (data.pool) {
          setLiquidityInput(data.pool.totalLiquidity.toString());
          setBaselineInput(data.pool.baselineLiquidity.toString());
        }

        const highFlags = (data.flags || []).filter((flag: SurveillanceFlag) => flag.severity === 'high').length;
        setThreatLevel(
          data.pool?.platformPaused 
            ? 'critical' 
            : highFlags > 0 
              ? 'high' 
              : (data.flags || []).length > 0 
                ? 'medium' 
                : 'low'
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSurveillanceData();
  }, []);

  const handleUpdatePool = async (updatedFields: Partial<HousePool>) => {
    setLiquidityError(null);
    try {
      const res = await fetch('/api/admin/surveillance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update pool settings');
      
      setPool(data.pool);
      fetchSurveillanceData();
    } catch (err: any) {
      setLiquidityError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case 'LOGIN':
        return 'bg-amber-955/30 border-white/20';
      case 'LOGIN_FAILED':
        return 'bg-yellow-900/30 border-yellow-500';
      case 'PAYMENT':
        return 'bg-blue-900/30 border-blue-500';
      case 'ANOMALY_DETECTED':
        return 'bg-red-900/30 border-red-500';
      default:
        return 'bg-gray-900/30 border-gray-500';
    }
  };

  const exposurePct = pool && pool.totalLiquidity > 0 ? (pool.currentExposure / pool.totalLiquidity) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>🕵️</span> Surveillance & Risk Control
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                activeTab === 'dashboard' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Surveillance Dashboard
            </button>
            <button
              onClick={() => setActiveTab('liquidity')}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                activeTab === 'liquidity' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Liquidity & Exposure (Risk)
            </button>
            <button
              onClick={() => setActiveTab('2fa')}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                activeTab === '2fa' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              2FA Control
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                activeTab === 'logs' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Security Logs
            </button>
          </div>
        </div>

        {pool?.platformPaused && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border-2 border-red-500 animate-pulse text-red-200 text-center font-bold text-sm">
            🚨 Platform paused by circuit breaker. Payout liquidity threshold has been crossed or manually triggered. All game betting is blocked.
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            {/* Threat Level & Circuit Breaker Trigger */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                className={`p-5 rounded-xl border md:col-span-2 ${
                  threatLevel === 'critical'
                    ? 'bg-red-900/40 border-red-500'
                    : threatLevel === 'high'
                    ? 'bg-orange-900/40 border-orange-500'
                    : threatLevel === 'medium'
                    ? 'bg-yellow-900/40 border-yellow-500'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-400">Security Threat Level</h2>
                    <p className="text-3xl font-black capitalize mt-1">{threatLevel}</p>
                  </div>
                  <div className="text-4xl">
                    {threatLevel === 'critical' ? '🚨' : threatLevel === 'high' ? '⚠️' : threatLevel === 'medium' ? '🟡' : '✅'}
                  </div>
                </div>
              </div>

              {/* Instant Circuit Breaker Toggle */}
              {pool && (
                <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Emergency Stop</h4>
                    <p className="text-xs text-gray-500 mt-1">Instantly lock or unlock betting platform-wide.</p>
                  </div>
                  <button
                    onClick={() => handleUpdatePool({ platformPaused: !pool.platformPaused })}
                    className={`w-full py-2.5 rounded-lg text-sm font-black transition-all ${
                      pool.platformPaused 
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-glow-green-sm' 
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-glow-red-sm'
                    }`}
                  >
                    {pool.platformPaused ? 'LIFT EMERGENCY PAUSE' : 'PAUSE ALL BETTING NOW'}
                  </button>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-400">Active Flags</p>
                <p className="text-3xl font-bold">{stats.activeFlags}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-400">Rapid Bet Users</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.rapidBetUsers}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-400">Shared IP Users</p>
                <p className="text-3xl font-bold text-red-400">{stats.sharedIpUsers}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-400">Recent Events</p>
                <p className="text-3xl font-bold text-blue-400">{stats.recentEvents}</p>
              </div>
            </div>

            {/* Flagged Users */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
              <h2 className="text-xl font-bold mb-4">Flagged Users</h2>
              {isLoading ? (
                <div className="text-gray-400">Loading flags...</div>
              ) : flags.length === 0 ? (
                <div className="rounded-lg border border-gray-700 p-8 text-center text-gray-400">No active surveillance flags.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400">
                      <tr>
                        <th className="py-2 text-left">User</th>
                        <th className="py-2 text-left">Severity</th>
                        <th className="py-2 text-left">Reason</th>
                        <th className="py-2 text-left">Metric</th>
                        <th className="py-2 text-left">History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map((flag) => (
                        <tr key={`${flag.reason}:${flag.userId}`} className="border-t border-gray-700">
                          <td className="py-3 text-white">{flag.username || flag.email || flag.userId}</td>
                          <td className={flag.severity === 'high' ? 'py-3 text-red-400' : 'py-3 text-yellow-400'}>{flag.severity}</td>
                          <td className="py-3 text-gray-300">{flag.reason}</td>
                          <td className="py-3 text-gray-300">{flag.metric}</td>
                          <td className="py-3">
                            <a className="text-blue-400 hover:text-blue-300" href={`/transactions?userId=${flag.userId}`}>View</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Events */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Recent Security Events</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${getEventColor(event.event)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold mr-2">{event.event}</span>
                        <span className="text-sm text-gray-400">{formatDate(event.createdAt)}</span>
                      </div>
                      <span className="text-xs text-gray-500">{event.ip || 'Unknown IP'}</span>
                    </div>
                    {event.details && (
                      <p className="text-sm text-gray-300 mt-2">
                        Details: {event.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'liquidity' && pool && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liquidity Status Dashboard Card */}
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl lg:col-span-2 flex flex-col gap-6">
              <h3 className="text-lg font-bold">House Liquidity Pool Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/50">
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold">Total Payout Reserve</span>
                  <span className="text-2xl font-black text-yellow-500 mt-1 block">₹{pool.totalLiquidity.toLocaleString()}</span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/50">
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold">Pool Baseline</span>
                  <span className="text-2xl font-black text-gray-300 mt-1 block">₹{pool.baselineLiquidity.toLocaleString()}</span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/50">
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold">Current Exposure</span>
                  <span className="text-2xl font-black text-purple-400 mt-1 block">₹{pool.currentExposure.toLocaleString()}</span>
                </div>
                <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/50">
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold">Exposure to Pool Ratio</span>
                  <span className="text-2xl font-black text-blue-400 mt-1 block">{exposurePct.toFixed(2)}%</span>
                </div>
              </div>

              {/* Progress bar ratio visual indicator */}
              <div className="mt-2">
                <span className="text-xs text-gray-400 block mb-1">Exposure Level Tracker</span>
                <div className="w-full bg-gray-900 rounded-full h-3.5 overflow-hidden border border-gray-700">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      exposurePct > 25 ? 'bg-red-500' : exposurePct > 10 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} 
                    style={{ width: `${Math.min(exposurePct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Admin settings form */}
              <div className="border-t border-gray-700/50 pt-4 flex flex-col gap-4">
                <h4 className="text-sm font-bold text-gray-300">Adjust Payout Liquidity Settings</h4>
                
                {liquidityError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-400 text-xs font-semibold">
                    {liquidityError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Total Payout Reserve (₹)</label>
                    <input 
                      type="number" 
                      value={liquidityInput}
                      onChange={(e) => setLiquidityInput(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Baseline Liquidity (₹)</label>
                    <input 
                      type="number" 
                      value={baselineInput}
                      onChange={(e) => setBaselineInput(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2 px-3 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleUpdatePool({
                    totalLiquidity: parseFloat(liquidityInput) || 0,
                    baselineLiquidity: parseFloat(baselineInput) || 0,
                  })}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2.5 rounded-xl text-sm transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>

            {/* Game specific current exposures card */}
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-lg font-bold">Active Game Exposures</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Aggregate payout liabilities for games with pending/multi-step gameplay sessions currently in-progress.
              </p>

              <div className="flex flex-col gap-3 mt-2">
                {[
                  { name: 'Mines', code: 'mines', mult: 5000 },
                  { name: 'Blackjack', code: 'blackjack', mult: 2.5 },
                  { name: 'HiLo', code: 'hilo', mult: 1000 },
                  { name: 'Dragon Tower', code: 'dragontower', mult: 3000 }
                ].map((game) => {
                  const val = perGameExposure[game.code] || 0;
                  return (
                    <div key={game.code} className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-750 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{game.name}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Max mult: {game.mult}x</span>
                      </div>
                      <span className="font-mono text-sm font-black text-purple-400">₹{val.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === '2fa' && <TwoFactorAuth />}

        {activeTab === 'logs' && (
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Security Logs</h2>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border-b border-gray-750 pb-3 last:border-0">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-blue-400">{event.event}</span>
                    <span className="text-gray-500">{formatDate(event.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">IP: {event.ip || 'N/A'} | User ID: {event.userId || 'Guest'}</p>
                  {event.details && <p className="text-sm text-gray-300 mt-2 bg-gray-900/40 p-2 rounded">{event.details}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
