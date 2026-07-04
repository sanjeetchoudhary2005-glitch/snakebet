'use client';

import { useEffect, useState } from 'react';
import { useLiveWebSocket } from '@/hooks/useLiveWebSocket';
import { formatRelativeTime } from '@/lib/privacy';

type WinItem = {
  username: string;
  amount: number;
  gameName: string;
  timestamp: string;
};

export function LiveStats() {
  const { stats } = useLiveWebSocket();
  const [online, setOnline] = useState(0);
  const [recentWins, setRecentWins] = useState<WinItem[]>([]);

  useEffect(() => {
    fetch('/api/live/snapshot')
      .then((res) => res.json())
      .then((data) => {
        setOnline(data.onlineUsers || 0);
        setRecentWins(
          (data.recentWins || []).slice(0, 5).map((w: WinItem & { gameName: string }) => ({
            username: w.username,
            amount: w.amount,
            gameName: w.gameName,
            timestamp: w.timestamp,
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (stats.dbOnline > 0 || stats.online > 0) {
      setOnline(stats.dbOnline || stats.online);
    }
  }, [stats]);

  return (
    <div className="live-stats bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Online</span>
          <span className="font-bold text-white">{online.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-3 overflow-hidden min-h-[1.5rem]">
        {recentWins.length === 0 ? (
          <p className="text-sm text-gray-500">No recent wins yet — play a game to appear here.</p>
        ) : (
          <div className="animate-marquee whitespace-nowrap">
            {recentWins.map((win, i) => (
              <span key={`${win.username}-${i}`} className="inline-block mx-4 text-sm">
                🔥 {win.username} won <span className="text-primary">₹{win.amount.toLocaleString()}</span> on{' '}
                {win.gameName}
                <span className="text-gray-500 ml-2">{formatRelativeTime(win.timestamp)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
