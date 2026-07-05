'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Clock, ShieldCheck, Sparkles } from 'lucide-react';

type ComingSoonGameProps = {
  name: string;
  category?: string;
  rtp?: number;
};

export function ComingSoonGame({ name, category = 'Originals', rtp }: ComingSoonGameProps) {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/games" className="mb-8 inline-flex items-center gap-2 text-[#94A3B8] transition-colors hover:text-[#FFFFFF]">
          <ArrowLeft className="h-5 w-5" />
          Back to Games
        </Link>

        <section className="overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#101010]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-10 lg:p-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FFFFFF]/30 bg-[#FFFFFF]/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#FFFFFF]">
                <Clock className="h-4 w-4" />
                Coming Soon
              </div>
              <h1 className="mb-4 text-4xl font-black text-white sm:text-5xl">{name}</h1>
              <p className="max-w-2xl text-lg leading-8 text-[#94A3B8]">
                This game is being finished for live wallet play, provably-fair verification, mobile controls, and production-grade settlement.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-[#FFFFFF]" />
                  <div className="text-sm text-[#94A3B8]">Status</div>
                  <div className="font-bold text-white">Locked until QA</div>
                </div>
                <div className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
                  <Sparkles className="mb-3 h-5 w-5 text-[#FFFFFF]" />
                  <div className="text-sm text-[#94A3B8]">Category</div>
                  <div className="font-bold text-white">{category}</div>
                </div>
                <div className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
                  <Bell className="mb-3 h-5 w-5 text-[#FFFFFF]" />
                  <div className="text-sm text-[#94A3B8]">Target RTP</div>
                  <div className="font-bold text-white">{rtp ? `${rtp}%` : 'Finalizing'}</div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/games" className="rounded-xl bg-[#FFFFFF] px-6 py-3 font-black text-black transition-colors hover:bg-[#7BE600]">
                  Browse Live Games
                </Link>
                <Link href="/support" className="rounded-xl border border-[#2A2A2A] px-6 py-3 font-bold text-white transition-colors hover:border-[#FFFFFF]/40">
                  Request Launch Alert
                </Link>
              </div>
            </div>

            <div className="relative min-h-[320px] border-t border-[#2A2A2A] bg-[#0B0B0B] lg:border-l lg:border-t-0">
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-px opacity-60">
                {Array.from({ length: 36 }).map((_, index) => (
                  <div key={index} className={index % 5 === 0 ? 'bg-[#FFFFFF]/20' : 'bg-white/[0.03]'} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-36 w-36 rounded-full border border-[#FFFFFF]/30 bg-[#FFFFFF]/10 shadow-[0_0_80px_rgba(139,255,0,0.18)]" />
              </div>
              <div className="absolute inset-x-8 bottom-8 rounded-xl border border-[#2A2A2A] bg-black/70 p-4 backdrop-blur">
                <div className="text-sm font-semibold text-[#94A3B8]">Launch checklist</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-bold text-white">
                  <span>Backend</span>
                  <span>Fairness</span>
                  <span>Mobile QA</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
