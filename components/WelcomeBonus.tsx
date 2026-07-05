'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, ArrowRight, PlayCircle, X } from 'lucide-react';
import Button from './ui/Button';

export function WelcomeBonus() {
  const [wagered, setWagered] = useState(5000);
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-gradient-to-br from-yellow-900/40 to-background border border-yellow-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-yellow-500/30">
        {/* Sparkles */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 text-yellow-400/40 text-4xl animate-pulse">✨</div>
          <div className="absolute top-20 right-20 text-yellow-400/40 text-3xl animate-pulse delay-500">✨</div>
          <div className="absolute bottom-20 left-1/4 text-yellow-400/40 text-2xl animate-pulse delay-1000">✨</div>
        </div>

        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-black text-yellow-400 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-10 h-10" /> Welcome Bonus <Sparkles className="w-10 h-10" />
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">100% Match Bonus up to ₹10,000</h3>
          <p className="text-gray-300 text-lg mb-8">Make your first deposit and get a 100% match bonus!</p>
          
          {/* Progress Ring */}
          <div className="mb-8 relative w-64 h-64 mx-auto">
            <div className="relative w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#374151" strokeWidth="6" fill="none" />
                <circle cx="50" cy="50" r="45" stroke="url(#ring)" strokeWidth="6" fill="none" 
                  strokeDasharray={`${(wagered / 50000) * 282.74} 282.74`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
                <defs>
                  <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-yellow-400">{(wagered / 50000 * 100).toFixed(0)}%</span>
                <span className="text-gray-400 text-sm">Complete</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-background/60 rounded-2xl p-6">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">₹5,000</div>
              <div className="text-gray-400">Wagered</div>
            </div>
            <div className="bg-background/60 rounded-2xl p-6">
              <Clock className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">7 Days</div>
              <div className="text-gray-400">Remaining</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="primary" size="xl" className="text-lg shadow-glow-white">
              Claim Bonus
            </Button>
            <Button variant="outline" size="xl" onClick={() => setIsOpen(false)}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
