'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Gift,
  Trophy,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

type PromotionItem = {
  id: string;
  title: string;
  type: string;
  matchPercentage: number;
  maxBonus: number;
  wageringMultiplier: number;
  minDepositRequired: number;
  startDate: string;
  endDate: string;
  claimed: boolean;
};

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data) => setPromotions(data.promotions || []))
      .catch(() => setPromotions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async (id: string) => {
    setClaimingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/promotions/${id}/claim`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      setMessage({ id, text: `Claimed ₹${data.amountCredited.toLocaleString()}!`, ok: true });
      load();
    } catch (e) {
      setMessage({ id, text: e instanceof Error ? e.message : 'Claim failed', ok: false });
    } finally {
      setClaimingId(null);
    }
  };

  const formatExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const featured = promotions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-[#94A3B8] hover:text-[#FFFFFF] flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-black text-white">Promotions Center</h1>
        <p className="text-[#94A3B8] mt-2">Claim real bonuses credited to your wallet</p>
      </div>

      {featured && (
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-[#FFFFFF]/30 bg-gradient-to-br from-[#141414] to-[#0B0B0B] p-10"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{featured.title}</h2>
            <p className="text-[#94A3B8] text-lg mb-4">
              {featured.matchPercentage}% match up to ₹{featured.maxBonus.toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0B0B0B] rounded-full border border-[#2A2A2A]">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm">{formatExpiry(featured.endDate)}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0B0B0B] rounded-full border border-[#2A2A2A]">
                <Trophy className="w-4 h-4 text-[#FFFFFF]" />
                <span className="text-[#FFFFFF] font-bold text-sm">{featured.wageringMultiplier}x Wagering</span>
              </div>
            </div>
            <Button
              variant="primary"
              disabled={featured.claimed || claimingId === featured.id}
              onClick={() => claim(featured.id)}
            >
              {featured.claimed ? 'Already Claimed' : claimingId === featured.id ? 'Claiming…' : 'Claim Now'}
              {!featured.claimed && <ArrowRight className="w-5 h-5 inline-block ml-2" />}
            </Button>
          </motion.div>
        </div>
      )}

      <div className="mb-16">
        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
          <Gift className="w-7 h-7 text-[#FFFFFF]" />
          Active Promotions
        </h3>
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading promotions…</div>
        ) : promotions.length === 0 ? (
          <div className="text-center text-gray-400 py-12 rounded-2xl border border-[#2A2A2A]">
            No active promotions right now. Check back soon.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promotions.map((promo, idx) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative rounded-3xl overflow-hidden border border-[#2A2A2A] hover:border-[#FFFFFF]/30 transition-all"
              >
                <div className="h-32 bg-gradient-to-br from-green-400/30 to-amber-600/30 flex items-center justify-center">
                  <Gift className="w-16 h-16 text-white" />
                  {promo.claimed && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/80 rounded-full text-white text-xs font-black">
                      Claimed
                    </div>
                  )}
                </div>
                <div className="p-6 bg-gradient-to-br from-[#141414] to-[#0B0B0B]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-black text-white">{promo.title}</h3>
                    <span className="text-xs text-gray-400">{formatExpiry(promo.endDate)}</span>
                  </div>
                  <p className="text-[#94A3B8] text-sm mb-4">
                    {promo.matchPercentage}% up to ₹{promo.maxBonus.toLocaleString()}
                    {promo.minDepositRequired > 0 && (
                      <> · Min deposit ₹{promo.minDepositRequired.toLocaleString()}</>
                    )}
                  </p>
                  <p className="text-xs text-[#94A3B8] mb-4">{promo.wageringMultiplier}x wagering required</p>
                  {message?.id === promo.id && (
                    <p className={`text-sm mb-3 ${message.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {message.text}
                    </p>
                  )}
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={promo.claimed || claimingId === promo.id}
                    onClick={() => claim(promo.id)}
                  >
                    {promo.claimed ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Claimed
                      </span>
                    ) : claimingId === promo.id ? (
                      'Claiming…'
                    ) : (
                      'Claim Now'
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;
