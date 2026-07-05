'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime } from '@/lib/privacy';

type WinItem = {
  id: string;
  username: string;
  amount: number;
  gameName: string;
  timestamp: string;
};

const LiveTicker = () => {
  const [items, setItems] = useState<WinItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch('/api/live/snapshot')
      .then((res) => res.json())
      .then((data) => {
        setItems(
          (data.recentWins || []).map((w: WinItem) => ({
            id: w.id,
            username: w.username,
            amount: w.amount,
            gameName: w.gameName,
            timestamp: w.timestamp,
          }))
        );
      })
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-[#141414]/90 via-[#0B0B0B] to-[#141414]/90 border-y border-[#FFFFFF]/20 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          Be the first to win big today
        </div>
      </div>
    );
  }

  const current = items[activeIndex];

  return (
    <div className="w-full bg-gradient-to-r from-[#141414]/90 via-[#0B0B0B] to-[#141414]/90 border-y border-[#FFFFFF]/20 py-4 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse" />
              <span className="text-[#FFFFFF] font-bold uppercase text-xs tracking-widest">Live</span>
            </div>
            <span className="text-white">
              <span className="font-bold">{current.username}</span> just won{' '}
              <span className="text-[#FFFFFF] font-black">₹{current.amount.toLocaleString()}</span> on{' '}
              <span className="font-semibold">{current.gameName}</span>
              <span className="text-gray-500 text-sm ml-2">{formatRelativeTime(current.timestamp)}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveTicker;
