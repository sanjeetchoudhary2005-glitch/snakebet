'use client';

import { useState, useEffect } from 'react';

const DEFAULT_GAMES = [
  'DICE', 'PLINKO', 'MINES', 'CRASH', 'WHEEL', 'HILO', 'COIN_FLIP', 'TEEN_PATTI', 'ANDAR_BAHAR'
];

export default function AdminGamesPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/games');
      const data = await res.json();
      if (!data.error) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleGame = async (game: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setSettings(prev => {
        const exists = prev.find(s => s.game === game);
        if (exists) {
          return prev.map(s => s.game === game ? { ...s, isActive: !currentStatus } : s);
        }
        return [...prev, { game, isActive: !currentStatus }];
      });

      await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, isActive: !currentStatus })
      });
    } catch (err) {
      console.error(err);
      fetchSettings(); // revert
    }
  };

  const getStatus = (game: string) => {
    const s = settings.find(s => s.game === game);
    return s ? s.isActive : true; // Default true if not explicitly disabled in DB
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">Game Management</h1>
        <p className="text-gray-400 mt-1 font-mono text-sm">Enable or disable games site-wide</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEFAULT_GAMES.map(game => {
          const isActive = getStatus(game);
          return (
            <div key={game} className="bg-[#161224] p-6 rounded-2xl border border-white/5 flex items-center justify-between shadow-lg">
              <div>
                <h3 className="font-bold text-white uppercase tracking-widest">{game.replace('_', ' ')}</h3>
                <p className={\`text-[10px] font-mono mt-1 \${isActive ? 'text-green-400' : 'text-red-400'}\`}>
                  {isActive ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
              <button
                onClick={() => toggleGame(game, isActive)}
                className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-black \${isActive ? 'bg-teal-500' : 'bg-gray-600'}\`}
              >
                <span className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${isActive ? 'translate-x-6' : 'translate-x-1'}\`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
