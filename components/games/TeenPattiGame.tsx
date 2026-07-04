"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";
import { useGameEffects } from "@/hooks/useGameEffects";
import { Shield, Coins, Trophy, Eye, Clock, Users } from "lucide-react";
import { useReconnectingWebSocket } from "@/hooks/useReconnectingWebSocket";

// --- Types ---
type GamePhase = "waiting" | "dealing" | "blind_round" | "active_round" | "showdown" | "settled";

interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: string;
  value: number;
}

interface Player {
  id: string;
  userId: string | null;
  name: string;
  avatar: string;
  seatIndex: number;
  isBot: boolean;
  balance: number;
  betAmount: number;
  cards: Card[] | null;
  hasSeen: boolean;
  isFolded: boolean;
  isActive: boolean;
}

interface TeenPattiState {
  id: string;
  bootAmount: number;
  maxPlayers: number;
  status: GamePhase;
  currentPot: number;
  currentStake: number;
  players: Player[];
  currentTurnIndex: number;
  winnerId: string | null;
  turnEndsAt: number | null;
  lastActionAt: number;
}

// --- Constants ---
const SEAT_POSITIONS = [
  { top: "5%", left: "50%", transform: "translate(-50%, 0)" },
  { top: "10%", right: "15%", transform: "translate(0, 0)" },
  { top: "35%", right: "5%", transform: "translate(0, -50%)" },
  { bottom: "10%", right: "15%", transform: "translate(0, 0)" },
  { bottom: "10%", left: "15%", transform: "translate(0, 0)" },
  { bottom: "5%", left: "50%", transform: "translate(-50%, 0)" }, // current user is always mapped here via rotation
];

const SUITS: { [key: string]: string } = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

// --- Components ---
const PlayingCard = ({
  card,
  isFlipped,
  index,
  total,
}: {
  card: Card | null;
  isFlipped: boolean;
  index: number;
  total: number;
}) => {
  const isRed = card && (card.suit === "hearts" || card.suit === "diamonds");
  
  // Calculate fan angle based on 3 cards: -8, 0, 8 degrees
  const angleSpread = 16;
  const startAngle = -(angleSpread / 2);
  const angleStep = total > 1 ? angleSpread / (total - 1) : 0;
  const rotate = startAngle + index * angleStep;
  const offset = (index - 1) * 18;

  return (
    <motion.div
      initial={{ x: 0, y: -200, opacity: 0, scale: 0.5 }}
      animate={{ x: offset, y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.12, type: "spring", stiffness: 200, damping: 20 }}
      style={{
        transform: `rotate(${rotate}deg) translateX(${offset}px)`,
        perspective: "800px",
        zIndex: index,
        position: "absolute",
        transformOrigin: "bottom center"
      }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.35, type: "tween", ease: "easeInOut" }}
        className="relative w-[55px] h-[80px] transform-style-3d cursor-pointer"
      >
        {/* Front of Card */}
        <div
          className="absolute inset-0 backface-hidden rounded-[4px] border border-slate-300 shadow-md bg-white flex flex-col justify-between p-1 select-none"
          style={{ backfaceVisibility: "hidden" }}
        >
          {card && card.suit !== '?' && (
            <>
              <div className={`text-[10px] font-bold leading-none ${isRed ? "text-red-600" : "text-slate-900"}`}>
                {card.rank}
                <div className="text-[10px]">{SUITS[card.suit]}</div>
              </div>
              <div className={`text-xl font-bold text-center ${isRed ? "text-red-600" : "text-slate-900"}`}>
                {SUITS[card.suit]}
              </div>
              <div className={`text-[10px] font-bold leading-none rotate-180 self-end ${isRed ? "text-red-600" : "text-slate-900"}`}>
                {card.rank}
                <div className="text-[10px]">{SUITS[card.suit]}</div>
              </div>
            </>
          )}
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 backface-hidden bg-[#1A1A1A] border-2 border-yellow-600/50 rounded-[4px] flex items-center justify-center overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Snakebet pattern placeholder */}
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMUExQTFBIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-yellow-600 font-black text-[10px] bg-black/80 px-1 rounded">SB</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TurnTimer = ({ endsAt, totalDuration = 25000 }: { endsAt: number, totalDuration?: number }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let animationFrame: number;
    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, endsAt - now);
      setProgress((remaining / totalDuration) * 100);
      if (remaining > 0) animationFrame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animationFrame);
  }, [endsAt, totalDuration]);

  return (
    <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90 pointer-events-none">
      <circle
        cx="50%" cy="50%" r="48%"
        fill="transparent"
        stroke="rgba(250, 204, 21, 0.2)"
        strokeWidth="4"
      />
      <circle
        cx="50%" cy="50%" r="48%"
        fill="transparent"
        stroke={progress > 20 ? "#FACC15" : "#EF4444"}
        strokeWidth="4"
        strokeDasharray="300"
        strokeDashoffset={300 - (300 * progress) / 100}
        strokeLinecap="round"
        className="transition-all duration-100 ease-linear"
      />
    </svg>
  );
};

const SeatPlayer = ({
  player,
  isCurrentTurn,
  isWinner,
  turnEndsAt
}: {
  player: Player;
  isCurrentTurn: boolean;
  isWinner: boolean;
  turnEndsAt: number | null;
}) => {
  const position = SEAT_POSITIONS[player.seatIndex];

  return (
    <div
      className={`absolute flex flex-col items-center transition-all duration-300 ${player.isFolded ? 'grayscale opacity-50' : ''}`}
      style={position}
    >
      <div className={`mb-1 text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded text-white shadow`}>
        {player.name}
      </div>

      <div className="relative mb-2">
        {isCurrentTurn && turnEndsAt && (
          <TurnTimer endsAt={turnEndsAt} />
        )}
        <div
          className={`w-14 h-14 rounded-full border-[3px] ${
            isCurrentTurn ? "border-yellow-400" : "border-slate-700"
          } bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl relative z-10`}
        >
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-slate-300">{player.name[0]}</span>
          )}
        </div>
        
        {/* Blind/Seen Badge */}
        {player.cards && (
          <div className="absolute -bottom-2 -right-2 z-20">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#1A5C3A] ${
              player.hasSeen ? "bg-yellow-500 text-black" : "bg-slate-400 text-white"
            }`}>
              {player.hasSeen ? "S" : "B"}
            </div>
          </div>
        )}
      </div>

      {player.betAmount > 0 && (
        <div className="flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-full border border-yellow-500/20 shadow-lg">
          <Coins className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] font-mono font-bold text-yellow-400">
            {player.betAmount}
          </span>
        </div>
      )}

      {player.cards && !player.isFolded && (
        <div className="absolute top-16 w-10 h-10 flex items-center justify-center pointer-events-none">
          {player.cards.map((card, idx) => (
            <PlayingCard
              key={idx}
              card={card}
              isFlipped={!(card.suit !== '?' && card.rank !== '?')}
              index={idx}
              total={player.cards!.length}
            />
          ))}
        </div>
      )}

      {isWinner && (
        <motion.div
          initial={{ scale: 0, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          className="absolute -top-6 z-30"
        >
          <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
        </motion.div>
      )}
    </div>
  );
};

export const TeenPattiGame = () => {
  const { balance, user } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();
  const [gameState, setGameState] = useState<TeenPattiState | null>(null);
  const [bootAmount, setBootAmount] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [xpPopup, setXpPopup] = useState(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'tp_game') {
        setGameState(data.table);
        
        if (data.event === 'dealt') playSound('card');
        if (data.event === 'action') playSound('click');
        if (data.event === 'settled') {
          const winnerId = data.table.winnerId;
          const me = data.table.players.find((p: any) => p.userId === user?.id);
          if (me && me.id === winnerId) {
            triggerWin(data.table.currentPot);
            setXpPopup(true);
            setTimeout(() => setXpPopup(false), 3000);
          }
        }
      }
    } catch (e) {}
  }, [user?.id, playSound, triggerWin]);

  const handleOpen = useCallback((socket: WebSocket) => {
    setIsConnected(true);
    if (user?.id) {
       socket.send(JSON.stringify({ game: 'teen-patti', action: 'join', userId: user.id, username: user.username, bootAmount }));
    }
  }, [user?.id, user?.username, bootAmount]);

  const wsUrl = typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080`
    : 'ws://localhost:8080';

  const { status: wsStatus, send } = useReconnectingWebSocket(wsUrl, {
    onMessage: handleMessage,
    onOpen: handleOpen,
  });

  const handleAction = (action: string, amount?: number) => {
    playSound("click");
    send({ game: 'teen-patti', action, amount });
  };

  const myPlayer = gameState?.players.find(p => p.userId === user?.id);
  const isMyTurn = gameState?.players[gameState.currentTurnIndex]?.userId === user?.id;

  // Remap players so user is always at bottom-center (index 5)
  const renderPlayers = () => {
    if (!gameState) return [];
    const players = [...gameState.players];
    if (myPlayer) {
      const offset = (5 - myPlayer.seatIndex + 6) % 6;
      return players.map(p => ({
        ...p,
        displaySeatIndex: (p.seatIndex + offset) % 6
      }));
    }
    return players.map(p => ({ ...p, displaySeatIndex: p.seatIndex }));
  };

  return (
    <div className="relative w-full min-h-[650px] flex flex-col font-sans select-none">
      <WinFlashOverlay />

      {/* --- HUD --- */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start pointer-events-none">
        <div className="flex gap-2">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 pointer-events-auto">
            <span className="text-yellow-400 font-bold text-xs uppercase">Mode | Regular</span>
          </div>
          <button onClick={() => setShowVerify(true)} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 pointer-events-auto hover:bg-white/10">
            <Shield className="w-3 h-3 text-green-400" />
            <span className="text-xs font-bold text-slate-200">Fair</span>
          </button>
        </div>

        <div className="flex flex-col items-end">
           <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500/30 rounded-xl p-2 px-4 shadow-lg pointer-events-auto flex flex-col items-center">
             <div className="text-[10px] text-purple-200 font-bold uppercase mb-0.5">Daily Reward</div>
             <div className="flex items-center gap-2">
               <Trophy className="w-4 h-4 text-yellow-400" />
               <span className="text-sm font-mono font-bold text-white">23h 56m</span>
             </div>
           </div>
           
           <AnimatePresence>
             {xpPopup && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: -20 }}
                 exit={{ opacity: 0 }}
                 className="mt-2 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg"
               >
                 +4 XP
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* --- Table Area --- */}
      <div className="flex-1 relative overflow-hidden bg-[#2D1B4E] rounded-t-3xl border-t border-x border-white/5 shadow-2xl">
        {/* Purple Background Pattern */}
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #1A0F2E 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l15 30-15 30L15 30z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}
        />

        {/* Green Felt Table */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full max-w-4xl h-full max-h-[500px] rounded-[200px] bg-[#1A5C3A] shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)] border-[20px] border-[#3E2723]">
             {/* Inner Rail Bevel */}
             <div className="absolute inset-2 rounded-[180px] border-4 border-[#2E7D32]/40" />

             {/* Felt Noise Texture */}
             <div className="absolute inset-0 rounded-[180px] opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

             {/* TEEN PATTI Watermark */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-7xl font-black text-black opacity-10 select-none tracking-widest">TEEN PATTI</span>
             </div>

             {/* Dealer Illustration */}
             <div className="absolute top-[2%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 bg-[#2D1B4E] rounded-full border-4 border-yellow-600/50 flex items-center justify-center shadow-2xl overflow-hidden relative"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-end pt-2">
                     <div className="w-10 h-10 bg-[#FFD1B3] rounded-full z-10" /> {/* Face */}
                     <div className="w-14 h-12 bg-[#1A0F2E] rounded-t-full absolute top-1 z-20" /> {/* Hair */}
                     <div className="w-16 h-10 bg-purple-700 rounded-t-3xl mt-1 z-10" /> {/* Dress */}
                  </div>
                </motion.div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-0.5 rounded text-[9px] text-yellow-500 font-bold uppercase tracking-widest border border-yellow-500/30">Dealer</div>
             </div>

             {/* Pot Display */}
             {gameState && gameState.status !== 'waiting' && (
               <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                 <span className="text-[10px] uppercase tracking-widest text-green-200 mb-1 font-bold bg-black/40 px-3 rounded-full">Total Pot</span>
                 <div className="bg-black/60 backdrop-blur-sm px-6 py-2 rounded-2xl border border-yellow-500/40 shadow-xl flex items-center gap-2">
                   <Coins className="text-yellow-400 w-5 h-5" />
                   <span className="text-2xl font-mono font-black text-yellow-400">
                     {gameState.currentPot}
                   </span>
                 </div>
               </div>
             )}

             {/* Waiting State */}
             {!gameState || gameState.status === 'waiting' ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <Users className="w-12 h-12 text-white/20 mb-4" />
                 <span className="text-xl font-bold text-white/50">Waiting for players...</span>
               </div>
             ) : (
               renderPlayers().map((player) => (
                 <SeatPlayer
                   key={player.id}
                   player={{ ...player, seatIndex: player.displaySeatIndex }}
                   isCurrentTurn={gameState.currentTurnIndex === player.seatIndex}
                   isWinner={gameState.winnerId === player.id}
                   turnEndsAt={gameState.currentTurnIndex === player.seatIndex ? gameState.turnEndsAt : null}
                 />
               ))
             )}
          </div>
        </div>
      </div>

      {/* --- Control Bar --- */}
      <div className="bg-[#111] border-t-2 border-yellow-600/30 p-4 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-40 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Balance & Boot */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-xl px-4 py-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                ₹
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-slate-400">Balance</span>
                <span className="text-sm font-mono font-bold text-white">{balance.toString()}</span>
              </div>
            </div>
            {(!gameState || gameState.status === 'waiting') && (
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Boot Amount</span>
                <select 
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-1 text-sm font-bold text-yellow-400 outline-none"
                  value={bootAmount}
                  onChange={(e) => setBootAmount(Number(e.target.value))}
                >
                  <option value={100}>₹100</option>
                  <option value={500}>₹500</option>
                  <option value={2000}>₹2,000</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <div className="px-6 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl animate-pulse">
                Connecting to Table...
              </div>
            ) : (!gameState || gameState.status === 'waiting') && !myPlayer ? (
              <button
                onClick={() => handleOpen(wsRef.current!)}
                className="px-10 py-3 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95 border-b-4 border-green-900 uppercase"
              >
                Join Table
              </button>
            ) : (gameState?.status === 'waiting') ? (
              <div className="px-6 py-2 bg-yellow-500/20 text-yellow-400 font-bold rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin-slow" />
                Waiting to Start...
              </div>
            ) : isMyTurn && myPlayer && !myPlayer.isFolded ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("pack")}
                  className="px-6 py-3 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold rounded-xl shadow-lg border-b-4 border-red-900 transition-transform active:scale-95"
                >
                  Pack
                </button>
                
                {!myPlayer.hasSeen && (
                  <>
                    <button
                      onClick={() => handleAction("blind")}
                      className="px-6 py-3 bg-gradient-to-b from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white font-bold rounded-xl shadow-lg border-b-4 border-slate-900 transition-transform active:scale-95 flex flex-col items-center leading-none"
                    >
                      <span>Blind</span>
                      <span className="text-[10px] text-slate-300 font-mono mt-1">₹{gameState.currentStake}</span>
                    </button>
                    <button
                      onClick={() => handleAction("seen")}
                      className="px-6 py-3 bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl shadow-lg border-b-4 border-yellow-700 transition-transform active:scale-95 flex items-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      SEE CARDS
                    </button>
                  </>
                )}

                {myPlayer.hasSeen && (
                  <button
                    onClick={() => handleAction("chaal")}
                    className="px-6 py-3 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg border-b-4 border-blue-900 transition-transform active:scale-95 flex flex-col items-center leading-none"
                  >
                    <span>Chaal</span>
                    <span className="text-[10px] text-blue-200 font-mono mt-1">₹{gameState.currentStake * 2}</span>
                  </button>
                )}
                
                {myPlayer.hasSeen && (
                  <button
                    onClick={() => handleAction("show")}
                    className="px-6 py-3 bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg border-b-4 border-purple-900 transition-transform active:scale-95 flex flex-col items-center leading-none"
                  >
                    <span>Show</span>
                    <span className="text-[10px] text-purple-200 font-mono mt-1">₹{gameState.currentStake * 2}</span>
                  </button>
                )}
              </div>
            ) : myPlayer && !myPlayer.isFolded ? (
              <div className="px-6 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl border border-slate-700">
                Waiting for Turn...
              </div>
            ) : myPlayer && myPlayer.isFolded ? (
               <div className="px-6 py-2 bg-red-950/50 text-red-500 font-bold rounded-xl border border-red-900/50">
                Packed
              </div>
            ) : null}
          </div>

        </div>
      </div>

      {/* --- Verify Modal --- */}
      {showVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e2330] rounded-xl border border-white/10 max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#171a25]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Provably Fair</span>
              </h3>
              <button onClick={() => setShowVerify(false)} className="text-gray-400 hover:text-white text-lg font-bold">&times;</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400 mb-4">This game uses a provably fair algorithm with HMAC-SHA256 shuffling.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
