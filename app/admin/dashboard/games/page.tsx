'use client';
import React, { useState, useEffect } from 'react';
import { Gamepad2, Play, Square, Settings, RefreshCw, BarChart2 } from 'lucide-react';

interface GameConfig {
  id: string;
  game: string;
  isActive: boolean;
  houseEdge: number;
  minBet: number;
  maxBet: number;
  config: any;
  statsToday: {
    totalBets: number;
    totalPayout: number;
    houseProfit: number;
    totalRounds: number;
  };
}

export default function GameControlPanel() {
  const [games, setGames] = useState<GameConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing config states
  const [activeEditingGame, setActiveEditingGame] = useState<GameConfig | null>(null);
  const [houseEdge, setHouseEdge] = useState(3);
  const [minBet, setMinBet] = useState(10);
  const [maxBet, setMaxBet] = useState(50000);
  const [isActive, setIsActive] = useState(true);
  
  // Custom game configs
  const [crashMaxMult, setCrashMaxMult] = useState(1000);
  const [crashFreq, setCrashFreq] = useState('medium');
  const [minesMin, setMinesMin] = useState(3);
  const [minesMax, setMinesMax] = useState(10);
  const [diceOverUnder, setDiceOverUnder] = useState(50);
  const [diceOdds, setDiceOdds] = useState(1.98);

  const fetchGamesConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch (err) {
      console.error('Failed to load games config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamesConfig();
  }, []);

  const openSettings = (game: GameConfig) => {
    setActiveEditingGame(game);
    setIsActive(game.isActive);
    setHouseEdge(game.houseEdge);
    setMinBet(game.minBet);
    setMaxBet(game.maxBet);

    if (game.game === 'CRASH') {
      setCrashMaxMult(game.config.maxMultiplier || 1000);
      setCrashFreq(game.config.bigMultiplierFreq || 'medium');
    } else if (game.game === 'MINES') {
      setMinesMin(game.config.minMines || 3);
      setMinesMax(game.config.maxMines || 10);
    } else if (game.game === 'DICE') {
      setDiceOverUnder(game.config.defaultOverUnder || 50);
      setDiceOdds(game.config.payoutOdds || 1.98);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditingGame) return;

    let updatedConfig: any = {};
    if (activeEditingGame.game === 'CRASH') {
      updatedConfig = { maxMultiplier: Number(crashMaxMult), bigMultiplierFreq: crashFreq };
    } else if (activeEditingGame.game === 'MINES') {
      updatedConfig = { minMines: Number(minesMin), maxMines: Number(minesMax) };
    } else if (activeEditingGame.game === 'DICE') {
      updatedConfig = { defaultOverUnder: Number(diceOverUnder), payoutOdds: Number(diceOdds) };
    }

    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: activeEditingGame.game,
          isActive,
          houseEdge,
          minBet,
          maxBet,
          config: updatedConfig
        })
      });

      if (res.ok) {
        setActiveEditingGame(null);
        fetchGamesConfig();
      }
    } catch (err) {
      console.error('Failed to update game settings', err);
    }
  };

  const handleQuickToggle = async (gameName: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: gameName,
          isActive: !currentStatus
        })
      });
      if (res.ok) fetchGamesConfig();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Game Configuration Control</h1>
          <p className="text-gray-400 text-sm mt-1">Manage platform game modules, house margins, RTP configurations, and betting restrictions</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-[#FFFFFF] animate-spin" />
        </div>
      ) : (
        /* Game Config Panels */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {games.map((g) => (
            <div
              key={g.id}
              className={`bg-[#111111] border rounded-2xl p-6 relative flex flex-col justify-between transition-all ${
                g.isActive ? 'border-gray-800' : 'border-red-950/40 opacity-60 bg-[#0d0d0d]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-[#FFFFFF]">
                      <Gamepad2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{g.game} Game</h3>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded mt-1.5 inline-block ${
                        g.isActive ? 'bg-green-950 text-white border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
                      }`}>
                        {g.isActive ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickToggle(g.game, g.isActive)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      g.isActive
                        ? 'bg-red-950/40 text-red-500 border border-red-900/40'
                        : 'bg-green-950/40 text-[#FFFFFF] border border-green-900/40'
                    }`}
                  >
                    {g.isActive ? 'Toggle OFF' : 'Toggle ON'}
                  </button>
                </div>

                {/* Margins Stats */}
                <div className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800/80 mb-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Margin/House Edge</span>
                    <span className="text-[#FFFFFF] font-bold">{g.houseEdge}% (RTP {100 - g.houseEdge}%)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Limits (Min-Max)</span>
                    <span className="text-white font-bold">₹{g.minBet} - ₹{g.maxBet}</span>
                  </div>
                </div>

                {/* Stats Today */}
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/60 mb-6">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-300">
                    <BarChart2 className="w-4 h-4 text-[#FFFFFF]" /> Daily Round Metrics
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">Total Bets</span>
                      <span className="text-white font-bold">₹{g.statsToday.totalBets.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Payouts</span>
                      <span className="text-gray-300 font-bold">₹{g.statsToday.totalPayout.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">House profit</span>
                      <span className={`font-black ${g.statsToday.houseProfit >= 0 ? 'text-[#FFFFFF]' : 'text-red-400'}`}>
                        ₹{g.statsToday.houseProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configure Controls Button */}
              <button
                onClick={() => openSettings(g)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Settings className="w-4 h-4 text-gray-400" /> Advanced Settings
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Settings Modal */}
      {activeEditingGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Configure {activeEditingGame.game} Parameters</h2>
              <p className="text-xs text-gray-400 mt-1">Directly adjust core payout multipliers and active limit parameters</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-xl border border-gray-800">
                <span className="text-xs font-semibold text-gray-300">Game Active Status</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isActive ? 'bg-[#FFFFFF] text-black' : 'bg-red-950 text-red-400 border border-red-900/40'
                  }`}
                >
                  {isActive ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* RTP House Margin Edge */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-gray-400 uppercase">House Edge (RTP = {100 - houseEdge}%)</span>
                  <span className="text-[#FFFFFF] font-bold">{houseEdge}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={houseEdge}
                  onChange={(e) => setHouseEdge(Number(e.target.value))}
                  className="w-full accent-[#FFFFFF]"
                />
              </div>

              {/* Betting Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Minimum Bet (₹)</label>
                  <input
                    type="number"
                    required
                    value={minBet}
                    onChange={(e) => setMinBet(Number(e.target.value))}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Maximum Bet (₹)</label>
                  <input
                    type="number"
                    required
                    value={maxBet}
                    onChange={(e) => setMaxBet(Number(e.target.value))}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              {/* Game Specific Configurations */}
              {activeEditingGame.game === 'CRASH' && (
                <div className="space-y-3 bg-[#0a0a0a] p-4 rounded-xl border border-gray-800">
                  <span className="text-xs font-bold text-gray-300 block mb-1">Crash Game Parameters</span>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Max Multiplier Cap</label>
                    <input
                      type="number"
                      value={crashMaxMult}
                      onChange={(e) => setCrashMaxMult(Number(e.target.value))}
                      className="w-full p-2 bg-[#121212] border border-gray-800 rounded-lg text-white outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Big Multipliers Appearance Frequency</label>
                    <select
                      value={crashFreq}
                      onChange={(e) => setCrashFreq(e.target.value)}
                      className="w-full p-2 bg-[#121212] border border-gray-800 rounded-lg text-white outline-none focus:border-[#FFFFFF]"
                    >
                      <option value="low">Low (Rarely)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="high">High (Frequent)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeEditingGame.game === 'MINES' && (
                <div className="space-y-3 bg-[#0a0a0a] p-4 rounded-xl border border-gray-800">
                  <span className="text-xs font-bold text-gray-300 block mb-1">Mines Game Grid Parameters</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Min Mines Allowed</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={minesMin}
                        onChange={(e) => setMinesMin(Number(e.target.value))}
                        className="w-full p-2 bg-[#121212] border border-gray-800 rounded-lg text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Max Mines Allowed</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={minesMax}
                        onChange={(e) => setMinesMax(Number(e.target.value))}
                        className="w-full p-2 bg-[#121212] border border-gray-800 rounded-lg text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEditingGame.game === 'DICE' && (
                <div className="space-y-3 bg-[#0a0a0a] p-4 rounded-xl border border-gray-800">
                  <span className="text-xs font-bold text-gray-300 block mb-1">Dice Game Parameters</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Default Threshold</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={diceOverUnder}
                        onChange={(e) => setDiceOverUnder(Number(e.target.value))}
                        className="w-full p-2 bg-[#121212] border border-gray-800 rounded-lg text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Payout Odds (x)</label>
                      <input
                        type="number"
                        step={0.01}
                        value={diceOdds}
                        onChange={(e) => setDiceOdds(Number(e.target.value))}
                        className="w-full p-2 bg-[#121212] border border-gray-800 rounded-lg text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveEditingGame(null)}
                  className="flex-1 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FFFFFF] text-black font-bold rounded-xl hover:bg-[#b8860b] transition-all text-xs shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
