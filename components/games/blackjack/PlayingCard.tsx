"use client";

import React from "react";
import { motion } from "framer-motion";

export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";

export interface CardData {
  rank: string;
  suit: CardSuit;
  value: number;
}

interface PlayingCardProps {
  rank?: string;
  suit?: CardSuit;
  faceDown?: boolean;
  index?: number;
  total?: number;
  className?: string;
}

const SUIT_SYMBOLS: Record<CardSuit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  rank = "A",
  suit = "spades",
  faceDown = false,
  index = 0,
  total = 1,
  className = "",
}) => {
  const isRed = suit === "hearts" || suit === "diamonds";

  // Calculate fan effect if in a hand
  const offset = index * 28;
  const rotation = index * 2;
  const dropOffset = index * 4;

  return (
    <motion.div
      initial={{ x: 0, y: -300, opacity: 0, rotateY: 180 }}
      animate={{
        x: offset,
        y: dropOffset,
        opacity: 1,
        rotate: rotation,
        rotateY: faceDown ? 180 : 0,
      }}
      transition={{
        delay: index * 0.15, // 150ms stagger
        duration: 0.4,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      style={{
        position: index > 0 ? "absolute" : "relative",
        top: 0,
        left: 0,
        zIndex: index,
        transformOrigin: "bottom left",
        transformStyle: "preserve-3d",
      }}
      className={`w-[100px] h-[140px] md:w-[120px] md:h-[168px] cursor-pointer drop-shadow-2xl ${className}`}
    >
      {/* Front Face */}
      <div
        className="absolute inset-0 bg-white rounded-lg border border-gray-300 flex flex-col justify-between p-2 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] backface-hidden"
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className={`text-xl font-bold leading-none ${isRed ? "text-red-600" : "text-black"}`}>
          {rank}
          <div className="text-xl">{SUIT_SYMBOLS[suit]}</div>
        </div>

        <div className={`text-5xl self-center font-bold ${isRed ? "text-red-600" : "text-black"}`}>
          {SUIT_SYMBOLS[suit]}
        </div>

        <div className={`text-xl font-bold leading-none self-end rotate-180 ${isRed ? "text-red-600" : "text-black"}`}>
          {rank}
          <div className="text-xl">{SUIT_SYMBOLS[suit]}</div>
        </div>
      </div>

      {/* Back Face */}
      <div
        className="absolute inset-0 rounded-lg border-2 border-white/20 shadow-lg overflow-hidden backface-hidden"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "radial-gradient(circle at center, #1e3a8a, #0f172a)",
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l10 10-10 10L0 10z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute inset-2 border-2 border-white/30 rounded flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <span className="text-white/80 font-black text-xl italic tracking-tighter">SB</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
