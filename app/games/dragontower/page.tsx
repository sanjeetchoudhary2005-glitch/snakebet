'use client';

import { DragonTowerGame } from '@/components/games/dragontower/DragonTowerGame';

export default function DragonTowerPage() {
  return (
    <div className="pb-24 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">🐉 Dragon Tower</h1>
            <p className="text-muted-light text-lg flex items-center gap-2">
              <span className="inline-block px-4 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm font-semibold">
                ORIGINAL
              </span>
              <span>RTP: 99.00%</span>
            </p>
          </div>
        </div>

        <DragonTowerGame />
      </div>
    </div>
  );
}
