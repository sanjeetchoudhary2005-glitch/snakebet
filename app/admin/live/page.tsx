'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLiveFeed() {
  const [events, setEvents] = useState<any[]>([]);
  
  useEffect(() => {
    const sse = new EventSource('/api/admin/live-feed');
    
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents(prev => [data, ...prev].slice(0, 50)); // Keep last 50 events
      } catch (err) {}
    };

    sse.onerror = () => {
      // Reconnect handled automatically by EventSource
    };

    return () => sse.close();
  }, []);

  const getEventStyle = (event: any) => {
    if (event.type === 'admin_action') return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
    if (event.action === 'WIN') return 'border-green-500/50 bg-green-500/10 text-green-400';
    if (event.action === 'BET') return 'border-red-500/50 bg-red-500/10 text-red-400';
    if (event.action === 'DEPOSIT') return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
    return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
  };

  const getEventMessage = (event: any) => {
    if (event.type === 'admin_action') {
      return \`Admin \${event.username} performed \${event.action}\`;
    }
    if (event.action === 'WIN') {
      return \`🏆 \${event.username} won ₹\${Number(event.amount).toLocaleString()} on \${event.game || 'Game'}\`;
    }
    if (event.action === 'BET') {
      return \`🎲 \${event.username} placed ₹\${Number(event.amount).toLocaleString()} bet on \${event.game || 'Game'}\`;
    }
    if (event.action === 'DEPOSIT') {
      return \`💰 \${event.username} deposited ₹\${Number(event.amount).toLocaleString()}\`;
    }
    return \`User \${event.username} performed \${event.action}\`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">Live Activity Feed</h1>
          <p className="text-gray-400 mt-1 font-mono text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse block"></span>
            Real-time platform events
          </p>
        </div>
      </div>

      <div className="bg-[#161224] rounded-2xl border border-white/5 p-4 min-h-[60vh] max-h-[80vh] overflow-y-auto shadow-inner">
        <AnimatePresence>
          {events.length === 0 ? (
             <div className="text-gray-500 font-mono text-center mt-10">Waiting for live events...</div>
          ) : (
            events.map((ev, i) => (
              <motion.div
                key={ev.id || i}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                className={\`p-4 mb-3 rounded-xl border \${getEventStyle(ev)} font-mono text-sm\`}
              >
                <div className="flex items-center justify-between">
                  <span>{getEventMessage(ev)}</span>
                  <span className="opacity-50 text-xs">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
                {ev.details && (
                   <div className="mt-2 text-xs opacity-70 truncate">{ev.details}</div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
