'use client';

// Phase 5 (tournaments): tournament listings below are intentionally mock UI — deferred to tournaments phase.

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Users, TrendingUp, Clock, Flame, Zap, CheckCircle2, XCircle, PlayCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';

interface Tournament {
  id: number;
  title: string;
  game: string;
  entryFee: number;
  prizePool: number;
  currentPlayers: number;
  maxPlayers: number;
  status: 'registering' | 'inProgress' | 'completed';
  startDate: string;
  endDate: string;
  tags: string[];
  prizes: { rank: number; amount: number }[];
  participants: { name: string; avatar: string }[];
}

const TournamentsPage = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'past'>('active');

  const tournaments: Tournament[] = [
    {
      id: 1,
      title: 'Weekly Crash Masters',
      game: 'Crash',
      entryFee: 100,
      prizePool: 50000,
      currentPlayers: 156,
      maxPlayers: 200,
      status: 'inProgress',
      startDate: new Date(Date.now() - 3600000).toLocaleString(),
      endDate: new Date(Date.now() + 3600000 * 5).toLocaleString(),
      tags: ['High Stakes', 'Popular'],
      prizes: [
        { rank: 1, amount: 25000 },
        { rank: 2, amount: 15000 },
        { rank: 3, amount: 10000 }
      ],
      participants: [
        { name: 'ProGamer99', avatar: 'PG' },
        { name: 'LuckyStreak', avatar: 'LS' },
        { name: 'HighRoller', avatar: 'HR' },
        { name: 'SlotQueen', avatar: 'SQ' }
      ]
    },
    {
      id: 2,
      title: 'Mines Royale',
      game: 'Mines',
      entryFee: 50,
      prizePool: 25000,
      currentPlayers: 89,
      maxPlayers: 150,
      status: 'registering',
      startDate: new Date(Date.now() + 3600000 * 24).toLocaleString(),
      endDate: new Date(Date.now() + 3600000 * 48).toLocaleString(),
      tags: ['Beginner Friendly'],
      prizes: [
        { rank: 1, amount: 12500 },
        { rank: 2, amount: 7500 },
        { rank: 3, amount: 5000 }
      ],
      participants: [
        { name: 'CardShark', avatar: 'CS' },
        { name: 'RouletteKing', avatar: 'RK' }
      ]
    },
    {
      id: 3,
      title: 'VIP Plinko Challenge',
      game: 'Plinko',
      entryFee: 500,
      prizePool: 200000,
      currentPlayers: 24,
      maxPlayers: 50,
      status: 'registering',
      startDate: new Date(Date.now() + 3600000 * 72).toLocaleString(),
      endDate: new Date(Date.now() + 3600000 * 96).toLocaleString(),
      tags: ['VIP Exclusive', 'Big Prizes'],
      prizes: [
        { rank: 1, amount: 100000 },
        { rank: 2, amount: 60000 },
        { rank: 3, amount: 40000 }
      ],
      participants: [
        { name: 'VipPlayer', avatar: 'VP' },
        { name: 'BlackjackPro', avatar: 'BP' }
      ]
    },
    {
      id: 4,
      title: 'Daily Slots Showdown',
      game: 'Slots',
      entryFee: 0,
      prizePool: 10000,
      currentPlayers: 0,
      maxPlayers: 0,
      status: 'completed',
      startDate: new Date(Date.now() - 3600000 * 24).toLocaleString(),
      endDate: new Date(Date.now() - 3600000).toLocaleString(),
      tags: ['Free to Play'],
      prizes: [
        { rank: 1, amount: 5000 },
        { rank: 2, amount: 3000 },
        { rank: 3, amount: 2000 }
      ],
      participants: [
        { name: 'PlayerOne', avatar: 'PO' }
      ]
    }
  ];

  const filteredTournaments = tournaments.filter(t => {
    if (activeTab === 'active') return t.status === 'inProgress';
    if (activeTab === 'upcoming') return t.status === 'registering';
    if (activeTab === 'past') return t.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="text-[#94A3B8] hover:text-[#FFFFFF] flex items-center gap-2 mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-black mb-2 text-white">Tournaments</h1>
        <p className="text-[#94A3B8]">Compete in exciting tournaments and win big prizes!</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
        {[
          { label: 'Live Now', value: 'active', icon: Flame },
          { label: 'Upcoming', value: 'upcoming', icon: Clock },
          { label: 'Past', value: 'past', icon: Trophy }
        ].map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value as any)}
            className={`px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === value
                ? 'bg-[#FFFFFF] text-black shadow-[0_0_20px_rgba(139,255,0,0.3)]'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#141414] border border-[#2A2A2A]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'active' && filteredTournaments.length === 0 && (
        <div className="text-center py-20">
          <Trophy className="w-20 h-20 text-[#2A2A2A] mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">No live tournaments</h2>
          <p className="text-[#94A3B8]">Check back later for upcoming tournaments!</p>
        </div>
      )}

      {/* Tournaments List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTournaments.map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A] overflow-hidden hover:border-[#FFFFFF]/30 transition-all hover:shadow-[0_10px_40px_rgba(139,255,0,0.1)]">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">{tournament.title}</h3>
                    <p className="text-[#94A3B8] text-sm">{tournament.game}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-black ${
                    tournament.status === 'inProgress' ? 'bg-red-500/20 text-red-400' :
                    tournament.status === 'registering' ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tournament.status === 'inProgress' ? 'LIVE' :
                     tournament.status === 'registering' ? 'REGISTERING' : 'COMPLETED'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {tournament.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-[#2A2A2A] rounded-full text-[#94A3B8] text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Prize Pool & Entry Fee */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#0B0B0B] rounded-xl p-4 border border-[#2A2A2A]">
                    <p className="text-[#94A3B8] text-xs mb-1">Prize Pool</p>
                    <p className="text-xl font-black text-[#FFFFFF]">₹{tournament.prizePool.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#0B0B0B] rounded-xl p-4 border border-[#2A2A2A]">
                    <p className="text-[#94A3B8] text-xs mb-1">Entry Fee</p>
                    <p className="text-xl font-black text-white">
                      {tournament.entryFee === 0 ? 'FREE' : `₹${tournament.entryFee}`}
                    </p>
                  </div>
                </div>

                {/* Players Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-[#94A3B8] flex items-center gap-1">
                      <Users className="w-4 h-4" /> {tournament.currentPlayers} / {tournament.maxPlayers} players
                    </p>
                    <p className="text-sm font-black text-[#FFFFFF]">
                      {Math.round((tournament.currentPlayers / tournament.maxPlayers) * 100)}%
                    </p>
                  </div>
                  <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFFFFF] to-amber-600 transition-all"
                      style={{ width: `${Math.min((tournament.currentPlayers / tournament.maxPlayers) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Prizes */}
                <div className="mb-6">
                  <p className="text-[#94A3B8] text-xs mb-2">Top Prizes</p>
                  <div className="flex gap-2">
                    {tournament.prizes.map(prize => (
                      <div key={prize.rank} className="flex-1 bg-[#0B0B0B] rounded-xl p-3 text-center border border-[#2A2A2A]">
                        <p className="text-xs font-black text-[#FFFFFF]">#{prize.rank}</p>
                        <p className="text-sm font-black text-white">₹{prize.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Participants Avatars */}
                {tournament.participants.length > 0 && (
                  <div className="flex items-center mb-4">
                    {tournament.participants.slice(0, 4).map((p, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gradient-to-br from-[#FFFFFF]/30 to-amber-600/30 rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-[#0B0B0B]"
                        style={{ marginLeft: i > 0 ? '-8px' : '0' }}
                      >
                        {p.avatar}
                      </div>
                    ))}
                    {tournament.currentPlayers > 4 && (
                      <p className="ml-3 text-sm text-[#94A3B8]">+{tournament.currentPlayers - 4} more</p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {tournament.status === 'registering' && (
                  <button className="w-full py-3 bg-gradient-to-r from-[#FFFFFF] to-amber-600 text-black font-black rounded-xl hover:scale-[1.02] transition-all">
                    Register Now
                  </button>
                )}
                {tournament.status === 'inProgress' && (
                  <button className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-black rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                    <PlayCircle className="w-5 h-5" /> Watch Live
                  </button>
                )}
                {tournament.status === 'completed' && (
                  <button className="w-full py-3 bg-[#2A2A2A] text-[#94A3B8] font-black rounded-xl cursor-not-allowed">
                    View Results
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TournamentsPage;