
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Trophy, Users, Info, ChevronDown, ChevronUp, ExternalLink, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import type { GameModule } from "@/lib/gameTypes";
import { gameRegistry } from "@/games/gameRegistry";
import { formatRelativeTime } from "@/lib/privacy";

interface GameDetailsModalProps {
  game: GameModule;
  isOpen: boolean;
  onClose: () => void;
}

const GameDetailsModal: React.FC<GameDetailsModalProps> = ({ game, isOpen, onClose }) => {
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const isPlayable = game.playable !== false && !game.comingSoon;

  // Find related games
  const relatedGames = useMemo(() => {
    return gameRegistry
      .filter(g => g.id !== game.id && g.category === game.category)
      .slice(0, 4);
  }, [game.id, game.category]);

  const [recentWinners, setRecentWinners] = useState<Array<{ user: string; amount: number; time: string }>>([]);

  useEffect(() => {
    if (!isOpen || !game.id) return;
    fetch(`/api/live/wins?gameId=${encodeURIComponent(game.id)}&limit=4`)
      .then((res) => res.json())
      .then((data) => {
        setRecentWinners(
          (data.wins || []).map((w: { user: string; amount: number; time: string }) => ({
            user: w.user,
            amount: w.amount,
            time: formatRelativeTime(w.time),
          }))
        );
      })
      .catch(() => setRecentWinners([]));
  }, [isOpen, game.id]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-[#141414] to-[#0B0B0B] border border-[#2A2A2A] shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-3 rounded-full bg-[#0B0B0B]/80 hover:bg-[#0B0B0B] border border-[#2A2A2A] transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="p-8">
              {/* Game Thumbnail */}
              <div className="relative mb-8 rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-[#FFFFFF]/20 to-[#141414]">
                {/* Dynamic thumbnail based on game category */}
                <div className="absolute inset-0">
                  {game.category === "crash" && (
                    <svg viewBox="0 0 300 180" className="w-full h-full">
                      <defs>
                        <linearGradient id="crashBg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0F1F0F" />
                          <stop offset="100%" stopColor="#0B0B0B" />
                        </linearGradient>
                        <filter id="crashGlow">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <rect width="300" height="180" fill="url(#crashBg)" />
                      <path
                        d="M 10 160 Q 100 150 160 100 T 270 30"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        filter="url(#crashGlow)"
                      />
                      <circle cx="270" cy="30" r="6" fill="#FFFFFF" filter="url(#crashGlow)" />
                    </svg>
                  )}
                  {game.category === "mines" && (
                    <svg viewBox="0 0 300 180" className="w-full h-full">
                      <rect width="300" height="180" fill="#0B0B0B" />
                      {Array.from({ length: 9 }).map((_, i) => {
                        const row = Math.floor(i / 3);
                        const col = i % 3;
                        const x = 95 + col * 40;
                        const y = 30 + row * 40;
                        return (
                          <g key={i}>
                            <rect
                              x={x}
                              y={y}
                              width="32"
                              height="32"
                              rx="6"
                              fill={i === 4 ? "#0F2F12" : "#141414"}
                              stroke={i === 4 ? "#FFFFFF" : "#2A2A2A"}
                              strokeWidth="1.5"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  )}
                  {game.category === "plinko" && (
                    <svg viewBox="0 0 300 180" className="w-full h-full">
                      <rect width="300" height="180" fill="#0B0B0B" />
                      {[...Array(20)].map((_, i) => {
                        const row = Math.floor(i / 5);
                        const col = i % 5 - row * 0.5;
                        return (
                          <circle
                            key={i}
                            cx={150 + col * 30}
                            cy={30 + row * 25}
                            r="3"
                            fill="#2A2A2A"
                          />
                        );
                      })}
                    </svg>
                  )}
                  {game.category === "ludo" && (
                    <svg viewBox="0 0 300 180" className="w-full h-full">
                      <defs>
                        <linearGradient id="ludoGrad" x1="0" y1="0" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0a0a1a" />
                          <stop offset="100%" stopColor="#1a1a3a" />
                        </linearGradient>
                      </defs>
                      <rect width="300" height="180" fill="url(#ludoGrad)" />
                      <rect x="75" y="30" width="150" height="120" rx="8" fill="#1a1a2e" stroke="#f5b342" strokeWidth="1.5" />
                    </svg>
                  )}
                  {game.category === "coinflip" && (
                    <svg viewBox="0 0 300 180" className="w-full h-full">
                      <defs>
                        <linearGradient id="coinModalBg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0F1F0F" />
                          <stop offset="100%" stopColor="#0B0B0B" />
                        </linearGradient>
                        <radialGradient id="coinModalGradient" cx="50%" cy="30%" r="60%">
                          <stop offset="0%" stopColor="#ffd700" />
                          <stop offset="100%" stopColor="#b8860b" />
                        </radialGradient>
                      </defs>
                      <rect width="300" height="180" fill="url(#coinModalBg)" />
                      <circle cx="150" cy="90" r="50" fill="url(#coinModalGradient)" stroke="#FFFFFF" strokeWidth="2.5" />
                      <text x="150" y="105" textAnchor="middle" fill="#000" fontSize="40">👑</text>
                    </svg>
                  )}
                  {game.category === "table" && (
                    <svg viewBox="0 0 300 180" className="w-full h-full">
                      <defs>
                        <radialGradient id="tableModalFelt" cx="50%" cy="45%" r="70%">
                          <stop offset="0%" stopColor="#1b5b41" />
                          <stop offset="100%" stopColor="#0D0B14" />
                        </radialGradient>
                      </defs>
                      <rect width="300" height="180" fill="url(#tableModalFelt)" />
                      <ellipse cx="150" cy="92" rx="112" ry="56" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.65" />
                      <rect x="96" y="48" width="42" height="62" rx="6" fill="#efe8d8" stroke="#FFFFFF" strokeWidth="1.5" transform="rotate(-8 117 79)" />
                      <rect x="134" y="42" width="42" height="62" rx="6" fill="#efe8d8" stroke="#FFFFFF" strokeWidth="1.5" />
                      <rect x="172" y="48" width="42" height="62" rx="6" fill="#7c1d36" stroke="#FFFFFF" strokeWidth="1.5" transform="rotate(8 193 79)" />
                      <text x="117" y="86" textAnchor="middle" fill="#8b102d" fontSize="22" fontWeight="800">A</text>
                      <text x="155" y="80" textAnchor="middle" fill="#111827" fontSize="22" fontWeight="800">9</text>
                    </svg>
                  )}
                  {!["crash", "mines", "plinko", "ludo", "coinflip", "wheel", "hilo", "keno", "dragontower", "roulette", "blackjack", "slots", "table"].includes(game.category) && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-[#141414] border-2 border-[#FFFFFF]/30 flex items-center justify-center">
                          <Play className="w-12 h-12 text-[#FFFFFF] fill-[#FFFFFF] ml-2" />
                        </div>
                        <p className="text-[#94A3B8] text-lg">Game Preview</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent opacity-60" />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left column */}
                <div className="lg:col-span-2">
                  <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {game.trending && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF]/10 border border-[#FFFFFF]/30">
                          <Zap className="w-4 h-4 text-[#FFFFFF] fill-[#FFFFFF]" />
                          <span className="text-[#FFFFFF] text-sm font-bold uppercase tracking-wider">Hot</span>
                        </div>
                      )}
                      {game.new && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 text-sm font-bold uppercase tracking-wider">New</span>
                        </div>
                      )}
                      {game.comingSoon && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                          <span className="text-white text-sm font-bold uppercase tracking-wider">Coming Soon</span>
                        </div>
                      )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{game.name}</h1>

                    <div className="flex flex-wrap items-center gap-6 text-[#94A3B8]">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#FFFFFF]" />
                          <span className="font-mono font-semibold tabular-nums">{game.players.toLocaleString()} playing now</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#FFFFFF]" />
                        <span className="font-mono font-semibold tabular-nums">{game.rtp}% RTP</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-[#2A2A2A] border border-[#2A2A2A]">
                        <span className="text-white text-sm font-semibold">{game.category.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">About {game.name}</h3>
                    <p className="text-[#94A3B8] leading-relaxed">
                      Experience the thrill of {game.name} on Snakebet! Enjoy fair gameplay, instant payouts, 
                      and compete with thousands of players worldwide.
                    </p>
                  </div>

                  {/* Recent Winners */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Winners</h3>
                    {recentWinners.length === 0 ? (
                      <p className="text-[#94A3B8] text-sm">Be the first to win big on {game.name} today.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {recentWinners.map((winner, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold">{winner.user}</span>
                            <span className="text-[#94A3B8] text-xs">{winner.time}</span>
                          </div>
                          <div className="text-[#FFFFFF] font-mono font-black text-lg">₹{winner.amount.toLocaleString()}</div>
                        </div>
                      ))}
                      </div>
                    )}
                  </div>

                  {/* Provably Fair */}
                  <div className="mb-8">
                    <button
                      onClick={() => setShowProvablyFair(!showProvablyFair)}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A] hover:border-[#FFFFFF]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-[#FFFFFF]" />
                        <span className="text-white font-bold">Provably Fair</span>
                      </div>
                      {showProvablyFair ? (
                        <ChevronUp className="w-5 h-5 text-[#94A3B8]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
                      )}
                    </button>
                    <AnimatePresence>
                      {showProvablyFair && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0">
                            <p className="text-[#94A3B8] mt-4 leading-relaxed">
                              This game uses provably fair technology to ensure every outcome is completely random 
                              and verifiable. You can verify each round using the seed and hash provided.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Related Games */}
                  {relatedGames.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">You May Also Like</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {relatedGames.map((relatedGame) => (
                          <Link
                            key={relatedGame.id}
                            href={`/games/${relatedGame.id}`}
                            onClick={onClose}
                            className="group p-4 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A] hover:border-[#FFFFFF]/30 transition-all"
                          >
                            <div className="text-white font-bold mb-1 group-hover:text-[#FFFFFF] transition-colors">
                              {relatedGame.name}
                            </div>
                            <div className="text-[#94A3B8] text-sm font-mono">{relatedGame.rtp}% RTP</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  {/* Play Now Button */}
                  {isPlayable ? (
                    <Link href={`/games/${game.id}`} onClick={onClose}>
                      <Button
                        variant="gold"
                        size="xl"
                        className="w-full shadow-glow-green text-lg group"
                      >
                        <Play className="w-6 h-6 mr-2 fill-black group-hover:scale-110 transition-transform" />
                        Play Now
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="xl"
                      disabled
                      className="w-full border-white/20 text-lg opacity-70 cursor-not-allowed"
                    >
                      Coming Soon
                    </Button>
                  )}

                  {/* Demo Button */}
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full border-[#FFFFFF]/40 hover:border-[#FFFFFF]/70 text-lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Play for Fun (Demo)
                  </Button>

                  {/* Quick Info */}
                  <div className="p-6 rounded-2xl bg-[#0B0B0B] border border-[#2A2A2A]">
                    <h4 className="text-white font-bold mb-4">Game Info</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Category</span>
                        <span className="text-white font-semibold">{game.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">RTP</span>
                        <span className="text-white font-mono font-semibold">{game.rtp}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Provider</span>
                        <span className="text-white font-semibold">Snakebet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Players</span>
                        <span className="text-[#FFFFFF] font-mono font-semibold">{game.players.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GameDetailsModal;
