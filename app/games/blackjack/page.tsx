'use client';

import { BlackjackGame } from '@/components/games/blackjack/BlackjackGame';

export default function BlackjackPage() {
  return (
    <div className="pb-24 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">♠️ Blackjack</h1>
            <p className="text-muted-light text-lg flex items-center gap-2">
              <span className="inline-block px-4 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-semibold">
                TABLE
              </span>
              <span>RTP: 99.50%</span>
            </p>
          </div>
        </div>

        <BlackjackGame />
      </div>
    </div>
  );
}
