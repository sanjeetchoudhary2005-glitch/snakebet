
import React, { useState } from "react";
import type { GameModule } from '@/lib/gameTypes';
import { Heart, Play, Users, Star, Zap, Sparkles } from "lucide-react";
import { useSnakebet } from "@/context/SnakebetContext";
import { motion } from "framer-motion";
import GameDetailsModal from "./GameDetailsModal";

/* ----------------------------------------------------------------
    Per-category artwork. Each is hand-built from SVG/CSS — no stock 
    photos, no external assets, no guessed icon names. Each category 
    gets its own visual signature so the grid doesn't feel templated.
----------------------------------------------------------------- */

function CrashArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="crashBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F1F0F" />
          <stop offset="100%" stopColor="#0B0B0B" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="300" height="180" fill="url(#crashBg)" />
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#1A1A1A" strokeWidth="1" />
      ))}
      <path
        d="M 10 160 Q 100 150 160 100 T 270 30"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        filter="url(#glow)"
        opacity="0.9"
      />
      <circle cx="270" cy="30" r="6" fill="#FFFFFF" filter="url(#glow)" />
      <text x="150" y="100" textAnchor="middle" fill="#FFFFFF" fontSize="26" fontWeight="700" opacity="0.95">
        2.47x
      </text>
    </svg>
  );
}

function SlotsArt() {
  const reels = [
    { shape: "circle", blur: true },
    { shape: "star", blur: false },
    { shape: "diamond", blur: true },
  ];
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      {reels.map((r, i) => {
        const x = 40 + i * 90;
        return (
          <g key={i}>
            <rect
              x={x}
              y="30"
              width="70"
              height="120"
              rx="12"
              fill="#141414"
              stroke="#2A2A2A"
              strokeWidth="1.5"
            />
            <g opacity={r.blur ? 0.35 : 1} filter={r.blur ? "blur(2px)" : undefined}>
              {r.shape === "circle" && (
                <circle cx={x + 35} cy="90" r="22" fill="#FFFFFF" opacity="0.85" />
              )}
              {r.shape === "star" && (
                <path
                  d={`M${x + 35} 65 L${x + 44} 85 L${x + 65} 88 L${x + 49} 102 L${x + 53} 123 L${x + 35} 112 L${x + 17} 123 L${x + 21} 102 L${x + 5} 88 L${x + 26} 85 Z`}
                  fill="#FFFFFF"
                />
              )}
              {r.shape === "diamond" && (
                <rect x={x + 16} y="71" width="38" height="38" fill="#FFFFFF" opacity="0.85" transform={`rotate(45 ${x + 35} 90)`} />
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function DiceArt() {
  const pipSets = {
    five: [[20, 20], [50, 20], [35, 35], [20, 50], [50, 50]],
    three: [[20, 20], [35, 35], [50, 50]],
  };
  const Die = ({ x, y, size, pips, rotate, faded = false }: { 
    x: number; 
    y: number; 
    size: number | string; 
    pips: number[][]; 
    rotate: number; 
    faded?: boolean;
  }) => (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={faded ? 0.4 : 1}>
      <rect width={size} height={size} rx="10" fill="#141414" stroke="#FFFFFF" strokeWidth="1.5" />
      {pips.map(([px, py], i: number) => (
        <circle key={i} cx={(px / 70) * Number(size)} cy={(py / 70) * Number(size)} r={Number(size) * 0.07} fill="#FFFFFF" />
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      <Die x={70} y={75} size="70" pips={pipSets.three} rotate={-8} faded />
      <Die x={150} y={45} size="80" pips={pipSets.five} rotate={6} />
    </svg>
  );
}

function PlinkoArt() {
  const pegs = [];
  for (let row = 0; row < 5; row++) {
    const count = 5 + row;
    for (let c = 0; c < count; c++) {
      pegs.push({
        x: 150 + (c - (count - 1) / 2) * 26,
        y: 30 + row * 26,
      });
    }
  }
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      {pegs.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2A2A2A" />
      ))}
      <path d="M150 30 Q 130 90 165 150" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="3 4" />
      <circle cx="165" cy="150" r="7" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}

function MinesArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="minesBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B0B14" />
          <stop offset="50%" stopColor="#121222" />
          <stop offset="100%" stopColor="#07070F" />
        </linearGradient>
        <linearGradient id="gemGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FFCC" />
          <stop offset="100%" stopColor="#0066AA" />
        </linearGradient>
        <filter id="mineGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="300" height="180" fill="url(#minesBg)" />
      
      {/* 4x4 mini-grid representing Mines game board */}
      {[0, 1, 2, 3].map((row) => (
        [0, 1, 2, 3].map((col) => {
          const x = 70 + col * 32;
          const y = 35 + row * 32;
          // Randomly show some diamonds (revealed tiles)
          const isRevealed = (row === 1 && col === 2) || (row === 2 && col === 0) || (row === 0 && col === 3);
          const isMine = (row === 3 && col === 1);
          
          return (
            <g key={`${row}-${col}`}>
              <rect
                x={x}
                y={y}
                width="26"
                height="26"
                rx="6"
                fill={isRevealed ? "#0A202A" : isMine ? "#2A0A0A" : "#1A1A2E"}
                stroke={isRevealed ? "#00FFCC" : isMine ? "#FF3366" : "#2A2A4A"}
                strokeWidth="1.5"
              />
              {isRevealed && (
                <polygon
                  points={`${x + 13},${y + 4} ${x + 22},${y + 13} ${x + 13},${y + 22} ${x + 4},${y + 13}`}
                  fill="url(#gemGrad)"
                  filter="url(#mineGlow)"
                />
              )}
              {isMine && (
                <circle cx={x + 13} cy={y + 13} r="6" fill="#FF3366" filter="url(#mineGlow)" />
              )}
            </g>
          );
        })
      ))}
      
      {/* Branding overlay */}
      <rect x="200" y="25" width="85" height="130" rx="10" fill="#0A0A14/60" stroke="#334466" strokeWidth="1" opacity="0.8" />
      <text x="242" y="55" textAnchor="middle" fill="#8899BB" fontSize="8" fontWeight="bold" letterSpacing="1">ORIGINALS</text>
      <text x="242" y="78" textAnchor="middle" fill="#00FFCC" fontSize="16" fontWeight="900" letterSpacing="0.5" filter="url(#mineGlow)">MINES</text>
      <text x="242" y="98" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="800">PRO</text>
      <rect x="215" y="115" width="54" height="20" rx="5" fill="#00FFCC" />
      <text x="242" y="129" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="900">PLAY</text>
    </svg>
  );
}

function RouletteArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      <circle cx="150" cy="90" r="60" fill="#141414" stroke="#2A2A2A" strokeWidth="3" />
      <circle cx="150" cy="90" r="45" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="150" cy="90" r="10" fill="#FFFFFF" />
      <circle cx="195" cy="90" r="5" fill="#FFFFFF" />
    </svg>
  );
}

function BlackjackArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      <rect x="70" y="40" width="70" height="100" rx="8" fill="#141414" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="105" y="105" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontWeight="bold">A</text>
      <rect x="150" y="50" width="70" height="100" rx="8" fill="#141414" stroke="#2A2A2A" strokeWidth="1.5" />
      <text x="185" y="115" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontWeight="bold">K</text>
    </svg>
  );
}

function TableArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="tableFelt" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#1b5b41" />
          <stop offset="100%" stopColor="#0D0B14" />
        </radialGradient>
        <filter id="tableGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="300" height="180" fill="url(#tableFelt)" />
      <ellipse cx="150" cy="92" rx="112" ry="56" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.65" />
      <rect x="96" y="48" width="42" height="62" rx="6" fill="#efe8d8" stroke="#FFFFFF" strokeWidth="1.5" transform="rotate(-8 117 79)" />
      <rect x="134" y="42" width="42" height="62" rx="6" fill="#efe8d8" stroke="#FFFFFF" strokeWidth="1.5" />
      <rect x="172" y="48" width="42" height="62" rx="6" fill="#7c1d36" stroke="#FFFFFF" strokeWidth="1.5" transform="rotate(8 193 79)" />
      <text x="117" y="86" textAnchor="middle" fill="#8b102d" fontSize="22" fontWeight="800">A</text>
      <text x="155" y="80" textAnchor="middle" fill="#111827" fontSize="22" fontWeight="800">9</text>
      <circle cx="112" cy="128" r="11" fill="#FFFFFF" filter="url(#tableGlow)" />
      <circle cx="142" cy="132" r="11" fill="#2DD4BF" filter="url(#tableGlow)" />
      <circle cx="172" cy="128" r="11" fill="#FF6B6B" filter="url(#tableGlow)" />
    </svg>
  );
}

function SportsArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      <circle cx="150" cy="90" r="45" fill="#141414" stroke="#2A2A2A" strokeWidth="2" />
      <circle cx="150" cy="90" r="20" fill="#FFFFFF" />
      <line x1="100" y1="90" x2="200" y2="90" stroke="#2A2A2A" strokeWidth="1" />
      <line x1="150" y1="50" x2="150" y2="130" stroke="#2A2A2A" strokeWidth="1" />
    </svg>
  );
}

function OtherArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      {[...Array(10)].map((_, i) => (
        <rect
          key={i}
          x={20 + (i % 5) * 55}
          y={30 + Math.floor(i / 5) * 60}
          width="45"
          height="45"
          rx="8"
          fill="#141414"
          stroke="#FFFFFF"
          strokeWidth="1"
          opacity={0.5 + (i % 2) * 0.5}
        />
      ))}
    </svg>
  );
}

function LudoArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="ludoGrad" x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0a1a" />
          <stop offset="100%" stopColor="#1a1a3a" />
        </linearGradient>
        <filter id="ludoGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="300" height="180" fill="url(#ludoGrad)" />
      
      {/* Board base */}
      <rect x="75" y="30" width="150" height="120" rx="8" fill="#1a1a2e" stroke="#f5b342" strokeWidth="1.5" />
      
      {/* Colored homes */}
      <rect x="80" y="35" width="50" height="50" rx="4" fill="#e74c3c" opacity="0.3" />
      <circle cx="105" cy="60" r="12" fill="#e74c3c" />
      
      <rect x="170" y="35" width="50" height="50" rx="4" fill="#2ecc71" opacity="0.3" />
      <circle cx="195" cy="60" r="12" fill="#2ecc71" />
      
      <rect x="80" y="95" width="50" height="50" rx="4" fill="#f1c40f" opacity="0.3" />
      <circle cx="105" cy="120" r="12" fill="#f1c40f" />
      
      <rect x="170" y="95" width="50" height="50" rx="4" fill="#3498db" opacity="0.3" />
      <circle cx="195" cy="120" r="12" fill="#3498db" />
      
      {/* Center cross */}
      <rect x="140" y="35" width="8" height="110" fill="#f5b342" opacity="0.3" />
      <rect x="75" y="85" width="150" height="8" fill="#f5b342" opacity="0.3" />
      
      {/* Tokens */}
      <circle cx="140" cy="85" r="6" fill="#e74c3c" stroke="#fff" strokeWidth="1.5" filter="url(#ludoGlow)" />
      <circle cx="152" cy="85" r="6" fill="#2ecc71" stroke="#fff" strokeWidth="1.5" filter="url(#ludoGlow)" />
      <circle cx="140" cy="97" r="6" fill="#f1c40f" stroke="#fff" strokeWidth="1.5" filter="url(#ludoGlow)" />
      <circle cx="152" cy="97" r="6" fill="#3498db" stroke="#fff" strokeWidth="1.5" filter="url(#ludoGlow)" />
      
      {/* Text */}
      <text x="150" y="160" textAnchor="middle" fill="#f5b342" fontSize="14" fontWeight="700" filter="url(#ludoGlow)">
        LUDO
      </text>
    </svg>
  );
}

function CoinFlipArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="coinBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F1F0F" />
          <stop offset="100%" stopColor="#0B0B0B" />
        </linearGradient>
        <filter id="coinGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="300" height="180" fill="url(#coinBg)" />
      
      {/* Coin */}
      <circle cx="150" cy="90" r="50" fill="url(#coinGradient)" stroke="#FFFFFF" strokeWidth="2.5" filter="url(#coinGlow)" />
      <defs>
        <radialGradient id="coinGradient" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#b8860b" />
        </radialGradient>
      </defs>
      
      {/* Crown (Heads) */}
      <text x="150" y="105" textAnchor="middle" fill="#000000" fontSize="40" fontWeight="bold">👑</text>
      
      {/* Motion lines */}
      <path d="M 50 70 Q 60 90 50 110" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M 250 70 Q 240 90 250 110" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.5" />
    </svg>
  );
}

function WheelArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      <defs>
        <filter id="wheelGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Wheel */}
      <circle cx="150" cy="90" r="60" fill="#141414" stroke="#2A2A2A" strokeWidth="3" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
        <line
          key={i}
          x1="150"
          y1="30"
          x2="150"
          y2="35"
          stroke={i % 2 === 0 ? "#FFFFFF" : "#FF6600"}
          strokeWidth="2"
          transform={`rotate(${i * 36} 150 90)`}
        />
      ))}
      <circle cx="150" cy="90" r="15" fill="#FFFFFF" filter="url(#wheelGlow)" />
      {/* Pointer */}
      <polygon points="150,10 145,30 155,30" fill="#FF6600" />
    </svg>
  );
}

function HiLoArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      {/* Cards */}
      <rect x="80" y="50" width="60" height="90" rx="8" fill="#141414" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="110" y="105" textAnchor="middle" fill="#FF0000" fontSize="36" fontWeight="bold">7</text>
      <rect x="160" y="50" width="60" height="90" rx="8" fill="#141414" stroke="#2A2A2A" strokeWidth="1.5" />
      {/* Arrows */}
      <polygon points="150,150 145,140 155,140" fill="#FFFFFF" />
      <polygon points="150,40 145,50 155,50" fill="#FF6600" />
    </svg>
  );
}

function KenoArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      {/* Grid */}
      {[0, 1, 2, 3, 4].map(row => (
        [0, 1, 2, 3, 4, 5, 6, 7].map(col => {
          const isSelected = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36].includes(row * 8 + col);
          return (
            <rect
              key={`${row}-${col}`}
              x={40 + col * 28}
              y={30 + row * 26}
              width="24"
              height="22"
              rx="4"
              fill={isSelected ? "#0F2F12" : "#141414"}
              stroke={isSelected ? "#FFFFFF" : "#2A2A2A"}
              strokeWidth="1"
            />
          );
        })
      ))}
    </svg>
  );
}

function DragonTowerArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      {/* Tower */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(level => {
        const tiles = level === 0 ? 4 : (level % 2 === 0 ? 4 : 3);
        return (
          <g key={level}>
            {Array.from({ length: tiles }).map((_, i) => (
              <rect
                key={i}
                x={150 - ((tiles * 30 - 6) / 2) + i * 30}
                y={140 - level * 16}
                width="26"
                height="14"
                rx="3"
                fill={level === 0 ? "#0F2F12" : "#141414"}
                stroke={level === 0 ? "#FFFFFF" : "#2A2A2A"}
                strokeWidth="1"
              />
            ))}
          </g>
        );
      })}
      {/* Dragon head */}
      <text x="150" y="18" textAnchor="middle" fontSize="24">🐉</text>
    </svg>
  );
}

function ArcadeArt() {
  return (
    <svg viewBox="0 0 300 180" className="absolute inset-0 w-full h-full">
      <rect width="300" height="180" fill="#0B0B0B" />
      {/* Screen */}
      <rect x="75" y="20" width="150" height="100" rx="8" fill="#0F1F0F" stroke="#FFFFFF" strokeWidth="2" />
      {/* Paddle */}
      <rect x="115" y="100" width="70" height="8" fill="#FFFFFF" />
      {/* Ball */}
      <circle cx="150" cy="70" r="6" fill="#FFFFFF" />
      {/* Bricks */}
      {[...Array(6)].map((_, i) => (
        <rect
          key={i}
          x={80 + i * 24}
          y={30}
          width="20"
          height="12"
          rx="4"
          fill={["#FF4444", "#FFDD00", "#4444FF", "#FFFFFF", "#FF8800", "#FF00FF"][i]}
        />
      ))}
    </svg>
  );
}

const ART_BY_CATEGORY: Record<string, React.FC> = {
  crash: CrashArt,
  slots: SlotsArt,
  dice: DiceArt,
  plinko: PlinkoArt,
  mines: MinesArt,
  roulette: RouletteArt,
  blackjack: BlackjackArt,
  table: TableArt,
  sports: SportsArt,
  other: OtherArt,
  arcade: ArcadeArt,
  ludo: LudoArt,
  coinflip: CoinFlipArt,
  wheel: WheelArt,
  hilo: HiLoArt,
  keno: KenoArt,
  dragontower: DragonTowerArt,
};

function GameThumbnail({ category, gameId, thumbnailUrl }: { category: string, gameId: string, thumbnailUrl?: string }) {
  const hasLocalImage = ['crash', 'ludo', 'teen-patti', 'blackjack', 'andar-bahar', 'baccarat', 'dragon-tiger', 'dragontiger', 'mines', 'dragontower'].includes(gameId);
  const displayImage = hasLocalImage ? `/images/games/thumbnails/${gameId === 'dragontiger' ? 'dragon-tiger' : gameId}.jpg` : thumbnailUrl;
  const Art = ART_BY_CATEGORY[category] || CrashArt;

  return (
    <div className="relative w-full aspect-[5/3] overflow-hidden rounded-t-2xl bg-[#0B0B0B]">
      {displayImage ? (
        <img
          src={displayImage}
          alt={`${gameId} cover`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <Art />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
    </div>
  );
}

/* ----------------------------------------------------------------
    Full card — drop-in replacement for the existing game cards.
----------------------------------------------------------------- */

export function LuxuryGameCard({ game, index }: { game: GameModule, index?: number }) {
  const { favorites, toggleFavorite } = useSnakebet();
  const isFav = favorites.includes(game.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isPlayable = game.playable !== false && !game.comingSoon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: (index || 0) * 0.1 }}
        whileHover={{ y: -5, scale: isPlayable ? 1.02 : 1 }}
        onClick={() => setIsModalOpen(true)}
        className={`game-card group relative rounded-lg bg-gradient-to-br from-bv-surface to-bv-bg border border-white/5 overflow-hidden shadow-lg cursor-pointer ${
          isPlayable ? 'hover:border-bv-gold/40' : 'opacity-75 hover:border-white/10'
        }`}
      >
        <GameThumbnail category={game.category} gameId={game.id} thumbnailUrl={game.thumbnailUrl} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {game.trending && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-bv-gold border border-bv-gold/30 shadow-glow-white">
              <Zap className="w-3.5 h-3.5 fill-bv-gold" />
              Hot
            </div>
          )}
          {game.new && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600/80 to-purple-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white border border-purple-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              New
            </div>
          )}
          {game.comingSoon && (
            <div className="flex items-center gap-1 bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white border border-white/20">
              Coming Soon
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(game.id);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 transition-all border border-white/10"
        >
          <Heart className={`w-5 h-5 transition-all duration-300 ${isFav ? "fill-[#FFFFFF] text-[#FFFFFF] scale-110" : "text-white/80 hover:text-white"}`} />
        </motion.button>

        {/* Play Now Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 font-black px-7 py-3 rounded-full ${
              isPlayable
                ? 'bg-gradient-to-r from-[#FFFFFF] to-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            {isPlayable && <Play className="w-5 h-5 fill-black" />}
            {isPlayable ? 'View Details' : 'Coming Soon'}
          </motion.button>
        </div>

        {/* Game Info */}
        <div className="p-6">
          <p className="text-bv-gold text-[11px] font-black uppercase tracking-widest mb-2 opacity-90">
            {game.category}
          </p>
          <h3 className="text-white font-black text-xl mb-3 leading-tight">{game.name}</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-[#94A3B8] font-semibold">
              <Users className="w-4.5 h-4.5 text-bv-gold/80" />
              {game.players.toLocaleString()} players
            </span>
            <span className="flex items-center gap-1.5 text-[#94A3B8] font-semibold">
              <Star className="w-4.5 h-4.5 text-bv-gold/80" />
              {game.rtp}% RTP
            </span>
          </div>
        </div>
      </motion.div>

      <GameDetailsModal
        game={game}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
