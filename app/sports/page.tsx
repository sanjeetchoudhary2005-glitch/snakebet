'use client';

// Phase 3 (sports): match listings and odds below are intentionally mock UI — deferred to sports betting phase.

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Clock, 
  ChevronDown,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';

const SportsPage = () => {
  const [activeSport, setActiveSport] = useState('all');
  const [expandedLeague, setExpandedLeague] = useState<string | null>('soccer');

  const sports = [
    { key: 'all', label: 'All Sports', icon: Trophy },
    { key: 'soccer', label: 'Soccer', icon: Trophy },
    { key: 'basketball', label: 'Basketball', icon: Trophy },
    { key: 'tennis', label: 'Tennis', icon: Trophy },
    { key: 'esports', label: 'E-Sports', icon: Trophy },
    { key: 'hockey', label: 'Hockey', icon: Trophy }
  ];

  const matches = [
    { league: 'soccer', home: 'Manchester United', away: 'Liverpool', time: '2 hours', odds: { home: 2.5, draw: 3.2, away: 2.8 }, live: false },
    { league: 'soccer', home: 'Real Madrid', away: 'Barcelona', time: '5 hours', odds: { home: 2.2, draw: 3.5, away: 3.0 }, live: false },
    { league: 'basketball', home: 'Lakers', away: 'Celtics', time: '1 hour', odds: { home: 1.9, draw: null, away: 2.1 }, live: true },
    { league: 'basketball', home: 'Bulls', away: 'Heat', time: '4 hours', odds: { home: 2.3, draw: null, away: 1.7 }, live: false },
    { league: 'tennis', home: 'Djokovic', away: 'Nadal', time: '3 hours', odds: { home: 1.6, draw: null, away: 2.4 }, live: false }
  ];

  const filteredMatches = activeSport === 'all' ? matches : matches.filter(m => m.league === activeSport);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Sports Betting</h1>
        <p className="text-muted mt-2">Bet on your favorite sports</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-secondary rounded-2xl p-4 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Sports</h3>
            <div className="space-y-2">
              {sports.map((sport) => {
                const IconComponent = sport.icon;
                return (
                  <button
                    key={sport.key}
                    onClick={() => setActiveSport(sport.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeSport === sport.key ? 'bg-primary/20 text-primary' : 'text-muted hover:bg-gray-800'}`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-bold">{sport.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-secondary rounded-2xl p-6 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-5 h-5 animate-pulse" />
                <span className="font-bold">LIVE</span>
              </div>
              <div className="text-2xl font-bold text-white">12 Matches Live Now</div>
            </div>
            <button className="px-6 py-2 border border-primary text-primary rounded-full hover:bg-primary hover:text-black transition-all font-bold">
              Live Betting
            </button>
          </div>

          {filteredMatches.map((match, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-secondary rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {match.live && (
                    <span className="flex items-center gap-2 text-red-400 text-sm font-bold">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  )}
                  <span className="text-muted text-sm">{match.time}</span>
                </div>
                <span className="text-xs text-muted px-3 py-1 bg-background rounded-full">
                  {match.league}
                </span>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="col-span-2">
                    <div className="font-bold text-lg mb-2">{match.home}</div>
                    <div className="text-muted">{match.away}</div>
                  </div>

                  <div className="col-span-3 grid grid-cols-3 gap-2">
                    <button className="p-4 bg-background hover:bg-primary hover:text-black rounded-xl transition-all text-center">
                      <div className="text-xs text-muted mb-1">Home</div>
                      <div className="text-xl font-bold">{match.odds.home}</div>
                    </button>
                    {match.odds.draw && (
                      <button className="p-4 bg-background hover:bg-primary hover:text-black rounded-xl transition-all text-center">
                        <div className="text-xs text-muted mb-1">Draw</div>
                        <div className="text-xl font-bold">{match.odds.draw}</div>
                      </button>
                    )}
                    <button className={`p-4 hover:bg-primary hover:text-black rounded-xl transition-all text-center ${match.odds.draw ? '' : 'col-start-2'}`}>
                      <div className="text-xs text-muted mb-1">Away</div>
                      <div className="text-xl font-bold">{match.odds.away}</div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SportsPage;