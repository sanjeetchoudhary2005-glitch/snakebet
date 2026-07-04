'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft, Gift, Star, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/Button';

type VipStatus = {
  tier: number;
  tierName: string;
  lifetimeWagered: number;
  perks: string[];
  cashbackRate: number;
  progressToNext: {
    nextTier: string;
    nextTierMin: number;
    remaining: number;
    percent: number;
  } | null;
  rakeback: {
    claimable: number;
    netLossSinceLastClaim: number;
    lastClaimAt: string | null;
  };
  allTiers: Array<{
    tier: number;
    name: string;
    minWagered: number;
    cashbackRate: number;
    benefits: string[];
  }>;
};

const VIPPage = () => {
  const [status, setStatus] = useState<VipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/vip/status')
      .then((res) => {
        if (res.status === 401) throw new Error('Please log in to view VIP status');
        return res.json();
      })
      .then(setStatus)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const claimRakeback = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch('/api/vip/claim-rakeback', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">Loading VIP status…</div>;
  }

  if (error && !status) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/login"><Button variant="primary">Log In</Button></Link>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-8">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-4">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
          <span className="bg-gradient-to-r from-[#FFFFFF] to-green-400 bg-clip-text text-transparent">
            {status.tierName} VIP
          </span>
        </h1>
        <p className="text-muted text-lg">Lifetime wagered: ₹{status.lifetimeWagered.toLocaleString()}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A] rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white mb-4">Your Progress</h2>
          {status.progressToNext ? (
            <>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{status.tierName}</span>
                <span>{status.progressToNext.nextTier}</span>
              </div>
              <div className="h-4 bg-[#2A2A2A] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-[#FFFFFF] transition-all"
                  style={{ width: `${status.progressToNext.percent}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">
                ₹{status.progressToNext.remaining.toLocaleString()} more wagered to reach {status.progressToNext.nextTier}
              </p>
            </>
          ) : (
            <p className="text-green-400 font-bold">You&apos;ve reached the highest VIP tier.</p>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-3">Your Perks</h3>
            <ul className="space-y-2">
              {status.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-gray-300 text-sm">
                  <Star className="w-4 h-4 text-[#FFFFFF]" /> {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A] rounded-2xl p-8">
          <Gift className="w-10 h-10 text-[#FFFFFF] mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Weekly Cashback</h3>
          <p className="text-3xl font-black text-green-400 mb-1">
            ₹{status.rakeback.claimable.toLocaleString()}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {(status.cashbackRate * 100).toFixed(0)}% of net losses since last claim
          </p>
          <Button
            variant="primary"
            className="w-full"
            disabled={claiming || status.rakeback.claimable <= 0}
            onClick={claimRakeback}
          >
            {claiming ? 'Claiming…' : 'Claim Cashback'}
          </Button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      </div>

      <h2 className="text-2xl font-black text-white mb-6">All VIP Tiers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {status.allTiers.map((tier) => (
          <div
            key={tier.tier}
            className={`rounded-2xl border p-5 ${
              tier.tier === status.tier
                ? 'border-[#FFFFFF] bg-[#FFFFFF]/10'
                : 'border-[#2A2A2A] bg-[#141414]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-white">{tier.name}</h3>
              {tier.tier === status.tier && <Trophy className="w-5 h-5 text-yellow-400" />}
            </div>
            <p className="text-sm text-gray-400 mb-2">₹{tier.minWagered.toLocaleString()} wagered</p>
            <p className="text-xs text-green-400 mb-3">{(tier.cashbackRate * 100).toFixed(0)}% cashback</p>
            <ul className="space-y-1">
              {tier.benefits.slice(0, 3).map((b) => (
                <li key={b} className="text-xs text-gray-500 flex gap-1">
                  <TrendingUp className="w-3 h-3 shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VIPPage;
