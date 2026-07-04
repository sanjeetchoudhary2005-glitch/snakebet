'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameRegistry } from '@/games/gameRegistry';
import { LuxuryGameCard } from '@/components/LuxuryGameCard';

// Map old category names to our new category system
const CATEGORY_MAP: Record<string, string[]> = {
  'All': [],
  'Originals': ['crash', 'mines', 'plinko', 'dice', 'coinflip', 'hilo', 'wheel', 'keno', 'dragontower'],
  'Table': ['table', 'blackjack', 'roulette'],
  'Slots': ['slots'],
  'Board': ['ludo']
};

const CATEGORIES = ['All', 'Originals', 'Table', 'Slots', 'Board'];

export default function GamesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = gameRegistry.filter(game => {
    // Filter by category
    let categoryMatch = true;
    if (activeCategory !== 'All') {
      const allowedCategories = CATEGORY_MAP[activeCategory];
      categoryMatch = allowedCategories ? allowedCategories.includes(game.category) : false;
    }
    
    // Filter by search
    const searchMatch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
          <input
            placeholder="Search games..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 w-48"
          />
        </div>
      </div>

      {/* Game Grid — 5 columns on desktop, fills one screen */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence>
            {filtered.map((game, i) => (
              <LuxuryGameCard key={game.id} game={game} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
