
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Gift, Users, Flame, Zap, ArrowRight, MessageCircle, Wallet, ChevronRight, Sparkles, Coins, Dices } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTrendingGames, gameRegistry } from '@/games/gameRegistry';
import HeroCarousel from '@/components/HeroCarousel';
import FloatingWidgets from '@/components/FloatingWidgets';
import LiveTicker from '@/components/LiveTicker';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { HomeWinnersSection } from '@/components/HomeWinnersSection';
import { LuxuryGameCard } from '@/components/LuxuryGameCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const trendingGames = getTrendingGames(6);
  const popularGames = [...gameRegistry].sort((a, b) => b.players - a.players).slice(0, 8);

  return (
    <div className="pb-24">
      <HeroCarousel />
      <LiveTicker />

      {/* Trending Games */}
      <section className="py-16 bg-gradient-to-b from-[#0B0B0B] to-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Flame className="w-6 h-6 text-[#FFFFFF]" />
                <span className="text-[#FFFFFF] font-semibold uppercase tracking-wider text-sm">Hot Right Now</span>
              </div>
              <h2 className="text-4xl font-black text-white">Trending Games</h2>
            </div>
            <Link href="/games">
              <Button variant="outline" size="lg" className="border-[#FFFFFF]/30 hover:border-[#FFFFFF]/70">
                View All
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {trendingGames.map((game, index) => (
              <LuxuryGameCard
                key={game.id}
                game={game}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Live Winners Feed */}
      <section className="py-16 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-[#FFFFFF]" />
                <span className="text-[#FFFFFF] font-semibold uppercase tracking-wider text-sm">Live Activity</span>
              </div>
              <h2 className="text-4xl font-black text-white">Recent Winners</h2>
            </div>
          </div>

          <HomeWinnersSection />
        </div>
      </section>

      {/* Popular Games */}
      <section className="py-16 bg-gradient-to-b from-[#0F0F0F] to-[#0B0B0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Dices className="w-6 h-6 text-[#FFFFFF]" />
                <span className="text-[#FFFFFF] font-semibold uppercase tracking-wider text-sm">All Games</span>
              </div>
              <h2 className="text-4xl font-black text-white">Popular Games</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularGames.map((game, index) => (
              <LuxuryGameCard
                key={game.id}
                game={game}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section className="py-16 bg-[#0B0B0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-6 h-6 text-[#FFFFFF]" />
                <span className="text-[#FFFFFF] font-semibold uppercase tracking-wider text-sm">Promotions</span>
              </div>
              <h2 className="text-4xl font-black text-white">Exclusive Offers</h2>
            </div>
          </div>

          <div className="text-center">
            <Link href="/promotions">
              <Button variant="primary" size="lg">View Active Promotions</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* VIP Section */}
      <section className="py-16 bg-gradient-to-b from-[#0B0B0B] to-[#141414]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 border-[#FFFFFF]/30 bg-gradient-to-r from-[#0F2F12] via-[#141414] to-[#0F2F12]">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-8 h-8 text-[#FFFFFF]" />
                  <span className="text-[#FFFFFF] font-bold uppercase tracking-wider text-sm">Join Elite</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Upgrade to VIP</h2>
                <p className="text-[#94A3B8] text-lg mb-8">Unlock exclusive bonuses, dedicated support, higher limits, and much more when you join our VIP program.</p>
                <Link href="/vip">
                  <Button variant="gold" size="xl" className="shadow-glow-green">
                    View Your VIP Status
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#FFFFFF]/30 to-[#FFFFFF]/30 flex items-center justify-center animate-pulse">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#141414] to-[#0B0B0B] border-4 border-[#FFFFFF]/40 flex items-center justify-center">
                    <Trophy className="w-20 h-20 text-[#FFFFFF]" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
      <LiveActivityFeed />
    </div>
  );
}
