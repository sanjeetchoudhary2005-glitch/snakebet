'use client';
import { CrashGame } from '@/components/games/CrashGame';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CrashGamePage() {
  return (
    <div className="h-[calc(100vh-96px)] w-full flex flex-col p-4 md:p-6 bg-[#040406] overflow-hidden">
      {/* Top action row */}
      <div className="flex-shrink-0 flex items-center mb-2">
        <Link href="/" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors text-sm font-bold">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Game widget container */}
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto">
        <CrashGame
          minBet={20}
          maxBet={100000}
          defaultBetAmount={20}
          quickBetAmounts={[20, 50, 100, 250, 500]}
        />
      </div>
    </div>
  );
}