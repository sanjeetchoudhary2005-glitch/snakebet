'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { BetControlPanel } from './BetControlPanel';
import { Shield, Sparkles, HelpCircle, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUIT_SYMBOL = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

interface SplitHandData {
  hands: Card[][];
  activeHandIndex: number;
  isSplit: boolean;
}

export function BlackjackGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // Game States
  const [betAmount, setBetAmount] = useState(100);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDealing, setIsDealing] = useState(false);

  // Hand States
  const [playerHand, setPlayerHand] = useState<Card[] | SplitHandData>([]);
  const [dealerHand, setDealerHand] = useState<(Card | null)[]>([]);
  const [playerScore, setPlayerScore] = useState<number | null>(0);
  const [dealerScore, setDealerScore] = useState<number | null>(0);
  
  // Results
  const [payout, setPayout] = useState(0);

  // Provably Fair States
  const [showVerify, setShowVerify] = useState(false);
  const [verifyData, setVerifyData] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Basic Strategy Suggestion Helper
  const getRecommendation = (): 'hit' | 'stand' | 'double' | 'split' | null => {
    if (gameState !== 'playing') return null;

    const isSplit = playerHand && typeof playerHand === 'object' && !Array.isArray(playerHand);
    
    if (isSplit) {
      const splitData = playerHand as SplitHandData;
      const activeHand = splitData.hands[splitData.activeHandIndex];
      const score = calculateLocalScore(activeHand);
      if (score < 12) return 'hit';
      if (score >= 17) return 'stand';
      return 'hit';
    }

    const cards = playerHand as Card[];
    if (cards.length === 2 && cards[0].rank === cards[1].rank) {
      if (['A', '8'].includes(cards[0].rank)) return 'split';
    }

    const score = playerScore || 0;
    if (score === 10 || score === 11) {
      if (cards.length === 2) return 'double';
    }
    
    if (score < 12) return 'hit';
    if (score >= 17) return 'stand';
    
    // Default stand on 12-16 if dealer has low card (e.g. <= 6), else hit
    const firstDealerCard = dealerHand[0];
    if (firstDealerCard) {
      const dealerVal = ['J', 'Q', 'K'].includes(firstDealerCard.rank) 
        ? 10 
        : firstDealerCard.rank === 'A' 
          ? 11 
          : parseInt(firstDealerCard.rank);
      if (dealerVal <= 6) return 'stand';
    }
    return 'hit';
  };

  const calculateLocalScore = (cards: Card[]): number => {
    let score = 0;
    let aces = 0;
    cards.forEach((card) => {
      if (['J', 'Q', 'K'].includes(card.rank)) {
        score += 10;
      } else if (card.rank === 'A') {
        score += 11;
        aces += 1;
      } else {
        score += parseInt(card.rank);
      }
    });
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const handleStartGame = async () => {
    if (balance < betAmount || gameState === 'playing' || isDealing) return;

    setError(null);
    setIsDealing(true);
    setGameState('playing');
    setPayout(0);
    playSound('click');

    try {
      const response = await fetch('/api/games/blackjack/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start game');

      setRoundId(data.roundId);
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);
      
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });

      // Staggered card deal sounds
      setTimeout(() => playSound('card'), 100);
      setTimeout(() => playSound('card'), 300);
      setTimeout(() => playSound('card'), 500);
      setTimeout(() => playSound('card'), 700);

      if (data.status === 'settled') {
        setGameState('settled');
        setPayout(data.payout);
        if (data.payout > betAmount) {
          triggerWin(data.payout / betAmount);
        } else {
          triggerLose();
        }
      }

      await refresh();
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
      setGameState('idle');
    } finally {
      setIsDealing(false);
    }
  };

  const handleHit = async () => {
    if (!roundId || isDealing) return;
    playSound('click');
    setIsDealing(true);

    try {
      const response = await fetch('/api/games/blackjack/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process hit');

      playSound('card');
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);
      if (data.dealerScore) setDealerScore(data.dealerScore);

      if (data.status === 'settled') {
        setGameState('settled');
        setPayout(data.payout);
        if (data.payout > 0) {
          triggerWin(data.payout / (betAmount * 2));
        } else {
          triggerLose();
        }
      }

      await refresh();
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Error occurred during hit');
    } finally {
      setIsDealing(false);
    }
  };

  const handleStand = async () => {
    if (!roundId || isDealing) return;
    playSound('click');
    setIsDealing(true);

    try {
      const response = await fetch('/api/games/blackjack/stand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process stand');

      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);

      // Staggered dealer reveal card flips
      setTimeout(() => playSound('card'), 100);

      setGameState('settled');
      setPayout(data.payout);

      if (data.payout > 0) {
        triggerWin(data.payout / (betAmount * 2));
      } else {
        triggerLose();
      }

      await refresh();
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Error occurred during stand');
    } finally {
      setIsDealing(false);
    }
  };

  const handleDoubleDown = async () => {
    if (!roundId || balance < betAmount || isDealing) return;
    playSound('click');
    setIsDealing(true);

    try {
      const response = await fetch('/api/games/blackjack/double', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to double down');

      playSound('card');
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);
      setGameState('settled');
      setPayout(data.payout);

      if (data.payout > 0) {
        triggerWin(data.payout / (betAmount * 2));
      } else {
        triggerLose();
      }

      await refresh();
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Error occurred during Double Down');
    } finally {
      setIsDealing(false);
    }
  };

  const handleSplit = async () => {
    if (!roundId || balance < betAmount || isDealing) return;
    playSound('click');
    setIsDealing(true);

    try {
      const response = await fetch('/api/games/blackjack/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to split');

      playSound('card');
      playSound('card');
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);

      await refresh();
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Error occurred during Split');
    } finally {
      setIsDealing(false);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerScore(0);
    setDealerScore(0);
    setPayout(0);
    setRoundId(null);
    setError(null);
    setIsDealing(false);
  };

  // Check split availability
  const isSplitAvailable = (): boolean => {
    if (gameState !== 'playing') return false;
    const isSplit = playerHand && typeof playerHand === 'object' && !Array.isArray(playerHand);
    if (isSplit) return false;
    
    const cards = playerHand as Card[];
    return cards.length === 2 && cards[0].rank === cards[1].rank && balance >= betAmount;
  };

  const isDoubleAvailable = (): boolean => {
    if (gameState !== 'playing') return false;
    const isSplit = playerHand && typeof playerHand === 'object' && !Array.isArray(playerHand);
    if (isSplit) return false;
    
    const cards = playerHand as Card[];
    return cards.length === 2 && balance >= betAmount;
  };

  const recommendation = getRecommendation();
  const isPlayerSplit = playerHand && typeof playerHand === 'object' && 'isSplit' in playerHand && (playerHand as SplitHandData).isSplit;
  const splitData = isPlayerSplit ? (playerHand as SplitHandData) : null;

  return (
    <div className="relative min-h-[600px] w-full flex flex-col lg:flex-row gap-6 p-1 overflow-hidden select-none">
      <WinFlashOverlay />

      {/* Control Panel (Left Column) */}
      <div className="w-full lg:w-[320px] shrink-0 z-10">
        {gameState === 'idle' ? (
          <BetControlPanel
            betAmount={betAmount}
            onChangeBetAmount={setBetAmount}
            onSubmit={handleStartGame}
            isSubmitting={isDealing}
            submitLabel="Deal Bet"
            balance={balance}
            minBet={50}
            maxBet={100000}
          />
        ) : (
          <div className="w-full bg-[#1e2330] rounded-xl border border-white/5 p-5 flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Game Actions</h3>
            
            <div className="bg-[#171a25]/60 rounded-lg p-3 border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Original Bet</span>
                <span className="font-mono font-bold text-white">₹{betAmount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                <span className="text-gray-400">Total Wager</span>
                <span className="font-mono font-black text-yellow-500">
                  ₹{isPlayerSplit ? betAmount * 2 : gameState === 'settled' && payout > 0 && payout !== betAmount ? betAmount * 2 : betAmount}
                </span>
              </div>
            </div>

            {gameState === 'playing' && (
              <div className="flex flex-col gap-2">
                {/* Hit / Stand Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleHit}
                    className={`flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg text-sm transition duration-150 active:scale-98 flex items-center justify-center gap-1.5 ${
                      recommendation === 'hit' ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : ''
                    }`}
                  >
                    <span>Hit</span>
                    {recommendation === 'hit' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />}
                  </button>
                  <button
                    onClick={handleStand}
                    className={`flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg text-sm transition duration-150 active:scale-98 flex items-center justify-center gap-1.5 ${
                      recommendation === 'stand' ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : ''
                    }`}
                  >
                    <span>Stand</span>
                    {recommendation === 'stand' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />}
                  </button>
                </div>

                {/* Double / Split Actions */}
                <div className="flex gap-2">
                  {isDoubleAvailable() && (
                    <button
                      onClick={handleDoubleDown}
                      className={`flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-xs transition duration-150 active:scale-98 flex items-center justify-center gap-1 ${
                        recommendation === 'double' ? 'ring-2 ring-yellow-400' : ''
                      }`}
                    >
                      Double
                    </button>
                  )}
                  {isSplitAvailable() && (
                    <button
                      onClick={handleSplit}
                      className={`flex-1 py-2.5 bg-[#4c1d95] hover:bg-[#5b21b6] text-white font-bold rounded-lg text-xs transition duration-150 active:scale-98 flex items-center justify-center gap-1 ${
                        recommendation === 'split' ? 'ring-2 ring-yellow-400' : ''
                      }`}
                    >
                      Split
                    </button>
                  )}
                </div>
              </div>
            )}

            {gameState === 'settled' && (
              <button
                onClick={handleReset}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:brightness-110 rounded-lg text-base font-black transition duration-150 active:scale-98"
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Felt Board (Right Column) */}
      <div className="flex-1 min-h-[450px] bg-[radial-gradient(circle_at_center,#062b1b,#02130c_75%)] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative shadow-inner overflow-hidden">
        {/* Overhead soft spotlight highlight */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(52,199,89,0.06)_10%,transparent_60%)]" />

        {/* Top bar (history + details) */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-1 bg-black/30 border border-white/5 rounded px-2 py-0.5 text-[10px] text-gray-400">
            <span>6-deck shoe</span>
          </div>

          {verifyData && (
            <button
              onClick={() => setShowVerify(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition duration-150"
            >
              <Shield className="w-3.5 h-3.5 text-green-400" />
              <span>Verify Fairness</span>
            </button>
          )}
        </div>

        {/* Error panel */}
        {error && (
          <div className="my-2 p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs font-semibold text-center z-10">
            {error}
          </div>
        )}

        {/* Card Table View */}
        <div className="flex-1 flex flex-col justify-around py-4 z-10">
          
          {/* Dealer hand row */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Dealer Score:</span>
              <span className="font-mono text-xs font-black text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">
                {gameState === 'settled' ? dealerScore : '?'}
              </span>
            </div>
            <div className="flex gap-3 justify-center min-h-[112px]">
              {(dealerHand.length > 0 ? dealerHand : [null, null]).map((card, idx) => (
                <CardFlip 
                  key={`dealer-${idx}`}
                  card={card}
                  flipped={card !== null}
                  delay={idx * 0.15}
                />
              ))}
            </div>
          </div>

          {/* Outcome banner centered */}
          <div className="flex justify-center items-center py-2 min-h-[60px]">
            {gameState === 'settled' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-8 py-2.5 rounded-xl border text-center shadow-2xl font-black tracking-widest uppercase text-sm ${
                  payout > betAmount 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-green-500/10' 
                    : payout === betAmount 
                      ? 'bg-gray-500/10 border-gray-500/30 text-gray-400 shadow-gray-500/10' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/10'
                }`}
              >
                {payout > betAmount ? 'WINNER!' : payout === betAmount ? 'PUSH' : 'BUSTED'}
              </motion.div>
            )}
          </div>

          {/* Player Hand Rows */}
          {isPlayerSplit && splitData ? (
            /* Render split hands side by side */
            <div className="grid grid-cols-2 gap-4 w-full">
              {splitData.hands.map((hand, idx) => {
                const active = splitData.activeHandIndex === idx;
                const score = calculateLocalScore(hand);
                
                return (
                  <div 
                    key={`split-${idx}`}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
                      active 
                        ? 'bg-white/5 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                        : 'bg-transparent border-transparent opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Hand {idx + 1}:</span>
                      <span className="font-mono text-xs font-black text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {score}
                      </span>
                    </div>
                    <div className="flex gap-2.5 justify-center min-h-[112px]">
                      {hand.map((card, cardIdx) => (
                        <CardFlip 
                          key={`split-hand-${idx}-${cardIdx}`}
                          card={card}
                          flipped={true}
                          delay={cardIdx * 0.1}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard hand */
            <div className="flex flex-col items-center">
              <div className="flex gap-2.5 justify-center min-h-[112px]">
                {((Array.isArray(playerHand) ? playerHand : []) as Card[]).map((card, idx) => (
                  <CardFlip 
                    key={`player-${idx}`}
                    card={card}
                    flipped={true}
                    delay={idx * 0.15}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Your Hand:</span>
                <span className="font-mono text-xs font-black text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">
                  {playerScore}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fairness verification modal overlay */}
      {showVerify && verifyData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2330] rounded-xl border border-white/10 max-w-lg w-full overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#171a25]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Fairness Verification</span>
              </h3>
              <button 
                onClick={() => setShowVerify(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Blackjack deals are deterministically generated from seeds using Fisher-Yates shuffling over a 6-deck shoe shoe.
              </p>

              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Server Seed Hash (Committed)</span>
                <div className="flex items-center justify-between bg-[#171a25] rounded p-2 text-xs font-mono text-white border border-white/5 overflow-hidden">
                  <span className="truncate max-w-[85%]">{verifyData.serverSeedHash}</span>
                  <button 
                    onClick={() => handleCopy(verifyData.serverSeedHash, 'hash')}
                    className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded"
                  >
                    {copiedText === 'hash' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Client Seed</span>
                  <div className="flex items-center justify-between bg-[#171a25] rounded p-2 text-xs font-mono text-white border border-white/5 overflow-hidden">
                    <span className="truncate max-w-[70%]">{verifyData.clientSeed}</span>
                    <button 
                      onClick={() => handleCopy(verifyData.clientSeed, 'client')}
                      className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded"
                    >
                      {copiedText === 'client' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Nonce</span>
                  <div className="flex items-center justify-between bg-[#171a25] rounded p-2 text-xs font-mono text-white border border-white/5 overflow-hidden">
                    <span>{verifyData.nonce.toString()}</span>
                    <button 
                      onClick={() => handleCopy(verifyData.nonce.toString(), 'nonce')}
                      className="text-gray-400 hover:text-white hover:bg-white/5 p-1 rounded"
                    >
                      {copiedText === 'nonce' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-[#171a25] flex justify-end">
              <button
                onClick={() => setShowVerify(false)}
                className="px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded transition duration-150 hover:brightness-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3D Staggered Flip Card Sub-component
function CardFlip({ card, flipped, delay = 0 }: { card: Card | null; flipped: boolean; delay?: number }) {
  const suitSymbol = card ? SUIT_SYMBOL[card.suit] : '♠';
  const isRed = card ? (card.suit === 'hearts' || card.suit === 'diamonds') : false;

  return (
    <div className="w-20 h-28 relative" style={{ perspective: '1000px' }}>
      <motion.div
        initial={{ rotateY: 180, scale: 0.8, y: -20, opacity: 0 }}
        animate={{ 
          rotateY: flipped ? 0 : 180, 
          scale: 1, 
          y: 0, 
          opacity: 1 
        }}
        transition={{ 
          type: 'spring',
          stiffness: 120,
          damping: 14,
          delay 
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* Card Face (Front) */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className={`absolute inset-0 bg-gradient-to-br from-white to-[#ece9d8] rounded-lg border border-yellow-600/30 flex flex-col justify-between p-2 select-none shadow-lg ${
            isRed ? 'text-red-600' : 'text-black'
          }`}
        >
          <div className="text-xs font-black font-mono leading-none">{card?.rank}</div>
          <div className="text-3xl font-black text-center select-none leading-none">{suitSymbol}</div>
          <div className="text-xs font-black font-mono leading-none rotate-180 self-end">{card?.rank}</div>
        </div>

        {/* Card Back */}
        <div 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-[3px] border-blue-500/30 rounded-lg p-1.5 flex items-center justify-center shadow-lg"
        >
          {/* Blue patterned card backing */}
          <div className="w-full h-full rounded border border-blue-500/10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.25)_0%,transparent_70%)] flex items-center justify-center bg-[length:8px_8px] bg-[linear-gradient(45deg,#0b0f19_25%,transparent_25%,transparent_75%,#0b0f19_75%)]">
            <span className="text-[9px] text-blue-500/40 font-black tracking-widest uppercase font-mono">BV</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
