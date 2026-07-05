'use client';

// Phase 4 (live casino): dealer tables and player counts below are intentionally mock UI — deferred to live casino phase.

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const LivePage = () => {
  const liveGames = [
    { id: 1, name: 'Live Roulette', dealer: 'Sarah', players: 45, image: 'https://picsum.photos/id/11/300/300' },
    { id: 2, name: 'Live Blackjack', dealer: 'Mike', players: 32, image: 'https://picsum.photos/id/12/300/300' },
    { id: 3, name: 'Live Baccarat', dealer: 'Emma', players: 28, image: 'https://picsum.photos/id/13/300/300' },
    { id: 4, name: 'Live Poker', dealer: 'Chris', players: 56, image: 'https://picsum.photos/id/14/300/300' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Live Casino</h1>
        <p className="text-muted mt-2">Play with real dealers in real-time</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {liveGames.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -8 }}
            className="bg-secondary rounded-2xl overflow-hidden cursor-pointer"
          >
            <div className="relative aspect-video">
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="text-white text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4" /> {game.players}
                </div>
                <button className="px-4 py-2 bg-primary text-black text-sm font-bold rounded-full">
                  Play
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="font-bold text-lg mb-1">{game.name}</div>
              <div className="text-muted text-sm">Dealer: {game.dealer}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LivePage;