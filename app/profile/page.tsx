'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Trophy,
  Wallet,
  TrendingUp,
  Clock,
  Users,
  Settings,
  History,
  Heart,
  Share2,
  Edit,
  Gamepad2,
  Zap,
  Crown
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSnakebet } from '@/context/SnakebetContext';

const ProfilePage = () => {
  const { balance } = useSnakebet();

  const stats = [
    { label: 'Total Wagered', value: '₹1,42,500', change: '+12.5%', icon: TrendingUp },
    { label: 'Total Wins', value: '₹89,234', change: '+8.2%', icon: Trophy },
    { label: 'Games Played', value: '4,567', change: '+23', icon: Clock },
    { label: 'Win Rate', value: '48.2%', change: '+2.1%', icon: Zap },
  ];

  const recentActivity = [
    { game: 'Crash Extreme', amount: '+₹1,250', time: '2 hours ago', type: 'win' },
    { game: 'Blackjack Pro', amount: '-₹340', time: '5 hours ago', type: 'loss' },
    { game: 'Roulette X', amount: '+₹890', time: '8 hours ago', type: 'win' },
    { game: 'Mega Slots', amount: '-₹200', time: '1 day ago', type: 'loss' },
    { game: 'Dice Master', amount: '+₹560', time: '1 day ago', type: 'win' },
  ];

  const badges = [
    { name: 'First Win', icon: Trophy, color: 'text-[#FFFFFF]', earned: true },
    { name: 'High Roller', icon: Wallet, color: 'text-[#FFFFFF]', earned: true },
    { name: 'Lucky Streak', icon: Zap, color: 'text-white', earned: false },
    { name: 'VIP Member', icon: Crown, color: 'text-purple-400', earned: false },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="text-[#94A3B8] hover:text-[#FFFFFF] flex items-center gap-2 mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <Card className="p-8 relative overflow-hidden bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFFFFF]/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-8">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(139,255,0,0.3)]">
              <User className="w-16 h-16 text-black" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-black mb-1 text-white">PlayerOne</h1>
                  <p className="text-[#94A3B8]">Level 8 • VIP Silver</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Balance</p>
                  <p className="text-2xl font-black text-[#FFFFFF]">₹{balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">XP</p>
                  <p className="text-2xl font-black text-white">12,450 / 20,000</p>
                  <div className="w-48 h-2 bg-[#2A2A2A] rounded-full mt-2 overflow-hidden">
                    <div className="w-3/5 h-full bg-gradient-to-r from-[#FFFFFF] to-green-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
        {['Overview', 'Stats', 'Achievements', 'History', 'Settings'].map((tab, i) => (
          <button
            key={tab}
            className={`px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap ${
              i === 0 ? 'bg-[#FFFFFF] text-black shadow-[0_0_20px_rgba(139,255,0,0.3)]' : 'text-[#94A3B8] hover:text-white hover:bg-[#141414] border border-[#2A2A2A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#FFFFFF]/10 rounded-xl">
                        <Icon className="w-6 h-6 text-[#FFFFFF]" />
                      </div>
                      <span className={`text-sm font-black ${stat.change.startsWith('+') ? 'text-white' : 'text-red-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-black mb-1 text-white">{stat.value}</p>
                    <p className="text-[#94A3B8] text-sm">{stat.label}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Recent Activity</h2>
              <Link href="/transactions" className="text-[#FFFFFF] text-sm hover:underline font-semibold">
                View all
              </Link>
            </div>
            <Card className="divide-y divide-[#2A2A2A] bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#2A2A2A] rounded-xl flex items-center justify-center border border-[#2A2A2A]">
                      <Gamepad2 className="w-5 h-5 text-[#94A3B8]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{activity.game}</p>
                      <p className="text-xs text-[#94A3B8]">{activity.time}</p>
                    </div>
                  </div>
                  <div className={`text-lg font-black ${activity.type === 'win' ? 'text-white' : 'text-red-400'}`}>
                    {activity.amount}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="p-6 bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
            <h3 className="font-black mb-4 text-white">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/wallet" className="w-full">
                <Button variant="secondary" className="w-full justify-start">
                  <Wallet className="w-5 h-5 mr-3" /> Deposit Funds
                </Button>
              </Link>
              <Link href="/promotions" className="w-full">
                <Button variant="secondary" className="w-full justify-start">
                  <Trophy className="w-5 h-5 mr-3" /> Claim Bonus
                </Button>
              </Link>
              <Link href="/settings" className="w-full">
                <Button variant="secondary" className="w-full justify-start">
                  <Settings className="w-5 h-5 mr-3" /> Settings
                </Button>
              </Link>
            </div>
          </Card>

          {/* Badges */}
          <Card className="p-6 bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A]">
            <h3 className="font-black mb-4 text-white">Achievements</h3>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-2xl text-center ${badge.earned ? 'bg-[#FFFFFF]/10 border border-[#FFFFFF]/30' : 'bg-[#2A2A2A] border border-[#2A2A2A]'}`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${badge.earned ? badge.color : 'opacity-30'}`} />
                    <p className={`text-xs font-black ${!badge.earned && 'opacity-30'}`}>{badge.name}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
