'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveWebSocket } from '@/hooks/useLiveWebSocket';
import { formatRelativeTime } from '@/lib/privacy';

type SnapshotEvent = {
  id: string;
  username: string;
  amount: number;
  gameName: string;
  timestamp: string;
};

export function LiveActivityFeed() {
  const { activities, stats, connected, setActivities } = useLiveWebSocket();
  const [online, setOnline] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    fetch('/api/live/snapshot')
      .then((res) => res.json())
      .then((data) => {
        setOnline(data.onlineUsers || 0);
        if (!seeded.current && data.recentWins?.length) {
          seeded.current = true;
          setActivities(
            data.recentWins.map((w: SnapshotEvent) => ({
              id: w.id,
              maskedUsername: w.username,
              gameId: w.gameName.toLowerCase(),
              gameName: w.gameName,
              amount: w.amount,
              eventType: 'win' as const,
              timestamp: w.timestamp,
            }))
          );
        }
      })
      .catch(() => undefined);
  }, [setActivities]);

  useEffect(() => {
    if (stats.dbOnline > 0 || stats.online > 0) {
      setOnline(stats.dbOnline || stats.online);
    }
  }, [stats]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [activities]);

  const getGameEmoji = (game: string) => {
    const g = game.toLowerCase();
    if (g.includes('crash') || g.includes('sky')) return '🚀';
    if (g.includes('mine')) return '💎';
    if (g.includes('plinko')) return '🎱';
    if (g.includes('dice')) return '🎲';
    if (g.includes('slot')) return '🎰';
    return '🎰';
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 w-80 hidden lg:block z-40">
      <div className="bg-background/80 backdrop-blur-md rounded-2xl border border-gray-700 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">🔥 Live Activity</h3>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
            <span className="text-sm text-gray-300">{online.toLocaleString()} online</span>
          </div>
        </div>

        <div ref={feedRef} className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          {activities.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              Be the first to win big today
            </div>
          ) : (
            activities.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-xl transition-all ${
                  event.eventType === 'win' && event.amount > 1000
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-gray-800/50 border border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getGameEmoji(event.gameName)}</span>
                  <span className="text-white font-bold truncate">{event.maskedUsername}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`font-bold ${event.eventType === 'win' ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {event.eventType === 'win' ? 'Won' : 'Bet'} ₹{event.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(event.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #fbbf24 0%, #8b5cf6 100%);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
