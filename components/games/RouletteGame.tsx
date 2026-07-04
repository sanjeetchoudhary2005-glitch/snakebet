'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { RouletteWheel3D } from './3d/RouletteWheel3D';
import { Shield, Coins, Trash2, HelpCircle, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

type BetType = 'red' | 'black' | 'odd' | 'even' | 'number';

interface ClientBet {
  type: BetType;
  value?: number;
  amount: number;
}

export function RouletteGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // Game States
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [bets, setBets] = useState<ClientBet[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{
    result: number;
    payout: number;
    won: boolean;
  } | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Provably Fair States
  const [showVerify, setShowVerify] = useState(false);
  const [verifyData, setVerifyData] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    result: number;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const chipDenominations = [20, 50, 100, 250, 500];
  const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  const getNumberColor = (num: number) => {
    if (num === 0) return 'text-[#34c759]';
    return RED_NUMBERS.includes(num) ? 'text-[#ff3b30]' : 'text-gray-400';
  };

  const getNumberBg = (num: number) => {
    if (num === 0) return 'bg-[#16a34a] border-[#22c55e]/25';
    return RED_NUMBERS.includes(num) 
      ? 'bg-[#dc2626] border-[#ef4444]/20' 
      : 'bg-[#111827] border-white/5';
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const addBet = (type: BetType, value?: number) => {
    if (isSpinning) return;
    playSound('chip');
    
    // Validation
    if (totalBetAmount + selectedChip > balance) {
      setError("Can't place bet: Insufficient balance!");
      return;
    }
    setError(null);

    // Look for duplicate bet
    const existingIndex = bets.findIndex(
      (b) => b.type === type && (type !== 'number' || b.value === value)
    );

    if (existingIndex > -1) {
      const updated = [...bets];
      updated[existingIndex].amount += selectedChip;
      setBets(updated);
    } else {
      setBets([...bets, { type, value, amount: selectedChip }]);
    }
  };

  const removeBet = (type: BetType, value?: number) => {
    if (isSpinning) return;
    playSound('click');
    const existingIndex = bets.findIndex(
      (b) => b.type === type && (type !== 'number' || b.value === value)
    );

    if (existingIndex > -1) {
      const updated = [...bets];
      if (updated[existingIndex].amount > selectedChip) {
        updated[existingIndex].amount -= selectedChip;
        setBets(updated);
      } else {
        setBets(bets.filter((_, i) => i !== existingIndex));
      }
    }
  };

  const clearBets = () => {
    if (isSpinning) return;
    playSound('click');
    setBets([]);
    setError(null);
  };

  const executeSpin = async () => {
    if (bets.length === 0 || totalBetAmount > balance || isSpinning) return;
    
    setError(null);
    setIsSpinning(true);
    setWinningNumber(null);
    setLastResult(null);
    playSound('click');

    try {
      const response = await fetch('/api/games/roulette/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bets }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to complete bet');

      // Set the winning number to trigger 3D animation
      setWinningNumber(data.result);
      
      // Store verification data
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
        result: data.result,
      });

      // Keep round result to apply after spin animation completes
      setLastResult({
        result: data.result,
        payout: data.payout,
        won: data.payout > 0,
      });

    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
      setIsSpinning(false);
      setWinningNumber(null);
    }
  };

  const handleSpinComplete = async () => {
    setIsSpinning(false);
    if (!lastResult) return;

    // Trigger visual results
    if (lastResult.won) {
      const netWin = lastResult.payout - totalBetAmount;
      const mult = totalBetAmount > 0 ? lastResult.payout / totalBetAmount : 1;
      triggerWin(mult);
    } else {
      triggerLose();
    }

    setHistory((prev) => [lastResult.result, ...prev].slice(0, 12));
    
    // Settle bets: clear board after a short delay
    setTimeout(() => {
      setBets([]);
    }, 2500);

    await refresh();
    fetchTransactions();
  };

  const getCellBetAmount = (type: BetType, value?: number) => {
    const bet = bets.find((b) => b.type === type && (type !== 'number' || b.value === value));
    return bet ? bet.amount : 0;
  };

  return (
    <div className="relative min-h-[600px] w-full flex flex-col lg:flex-row gap-6 p-1 overflow-hidden select-none">
      <WinFlashOverlay />

      {/* Control Panel (Left Column) */}
      <div className="w-full lg:w-[320px] shrink-0 z-10">
        <div className="w-full bg-[#1e2330] rounded-xl border border-white/5 p-5 flex flex-col gap-5 shadow-xl">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Select Chip
            </span>
            <div className="flex gap-1.5 justify-between">
              {chipDenominations.map((denom) => (
                <button
                  key={denom}
                  onClick={() => setSelectedChip(denom)}
                  className={`w-11 h-11 rounded-full border-2 font-mono text-[10px] font-black flex items-center justify-center transition-all duration-200 active:scale-90 ${
                    selectedChip === denom
                      ? 'bg-yellow-500 border-white text-black shadow-lg scale-105 shadow-yellow-500/20'
                      : 'bg-[#171a25] border-white/10 text-gray-300 hover:border-white/30'
                  }`}
                  style={{
                    boxShadow: selectedChip === denom ? '0 0 12px rgba(234, 179, 8, 0.4)' : '',
                  }}
                >
                  ₹{denom}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Bet Totals */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-400">Total Bet Amount</span>
              <span className="font-mono font-black text-white">₹{totalBetAmount}</span>
            </div>
            
            {totalBetAmount > balance && (
              <div className="mt-1 flex items-center gap-1.5 text-red-400 text-[10px] font-bold">
                <span>Can't bet more than your balance!</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={clearBets}
              disabled={isSpinning || bets.length === 0}
              className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white rounded-lg text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Bets</span>
            </button>
            <button
              onClick={executeSpin}
              disabled={isSpinning || bets.length === 0 || totalBetAmount > balance}
              className="flex-[2] py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:brightness-110 rounded-lg text-sm font-black transition duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpinning ? 'Spinning...' : 'Spin Wheel'}
            </button>
          </div>

          {/* Summary/History view of current bets */}
          {bets.length > 0 && (
            <div className="flex-1 max-h-40 overflow-y-auto pr-1 flex flex-col gap-1 text-[11px] font-mono text-gray-400 border border-white/5 rounded-lg p-2.5 bg-[#171a25]/50">
              {bets.map((b, idx) => (
                <div key={idx} className="flex justify-between border-b border-white/5 py-1">
                  <span className="capitalize">
                    {b.type === 'number' ? `Number ${b.value}` : b.type}
                  </span>
                  <span className="font-bold text-white">₹{b.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Wheel & Board Display (Right Column) */}
      <div className="flex-1 bg-[#111622] rounded-xl border border-white/5 p-5 flex flex-col gap-6 relative">
        {/* Top Ticker */}
        <div className="flex justify-between items-center z-10">
          <div className="flex gap-1.5 overflow-x-auto max-w-[70%] pb-1">
            {history.map((num, i) => (
              <span
                key={i}
                className={`w-7 h-7 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 border ${getNumberBg(
                  num
                )} text-white`}
              >
                {num}
              </span>
            ))}
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

        {/* Error / Result Display */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs font-semibold text-center z-10">
            {error}
          </div>
        )}

        {lastResult && !isSpinning && (
          <div className={`p-3 border rounded-lg text-sm font-bold text-center z-10 ${
            lastResult.won 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {lastResult.won 
              ? `Won ₹${lastResult.payout.toFixed(2)} on number ${lastResult.result}!` 
              : `Result was number ${lastResult.result}. Better luck next spin!`}
          </div>
        )}

        {/* 3D Wheel Element */}
        <RouletteWheel3D
          winningNumber={winningNumber}
          isSpinning={isSpinning}
          onSpinComplete={handleSpinComplete}
        />

        {/* Custom Grid Betting Table */}
        <div className="w-full overflow-x-auto pb-2 z-10">
          <div className="min-w-[650px] flex flex-col gap-1.5">
            {/* Main numbers section */}
            <div className="flex gap-1">
              {/* Green Zero cell */}
              <button
                onClick={() => addBet('number', 0)}
                onContextMenu={(e) => { e.preventDefault(); removeBet('number', 0); }}
                disabled={isSpinning}
                className="w-12 bg-green-950/30 border border-green-500/20 hover:bg-green-500/20 text-green-400 font-mono font-bold text-lg rounded flex flex-col items-center justify-center relative active:scale-95 duration-100 min-h-36"
              >
                <span>0</span>
                {getCellBetAmount('number', 0) > 0 && (
                  <span className="absolute bottom-1 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    ₹{getCellBetAmount('number', 0)}
                  </span>
                )}
              </button>

              {/* Numbers grid (3 rows, 12 columns) */}
              <div className="flex-1 grid grid-cols-12 gap-1 font-mono font-bold text-sm">
                {[
                  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
                ].map((row, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    {row.map((num) => {
                      const isRed = RED_NUMBERS.includes(num);
                      const betOnCell = getCellBetAmount('number', num);
                      return (
                        <button
                          key={num}
                          onClick={() => addBet('number', num)}
                          onContextMenu={(e) => { e.preventDefault(); removeBet('number', num); }}
                          disabled={isSpinning}
                          className={`h-11 rounded border flex items-center justify-center relative active:scale-95 duration-100 hover:brightness-125 ${
                            isRed 
                              ? 'bg-red-950/40 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                              : 'bg-gray-950/40 border-white/5 text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          <span>{num}</span>
                          {betOnCell > 0 && (
                            <span className="absolute bottom-0.5 scale-90 bg-yellow-500 text-black text-[8px] font-black px-1 rounded-full">
                              ₹{betOnCell}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Outside Bet Sections */}
            <div className="grid grid-cols-6 gap-1 text-xs font-black uppercase text-gray-400">
              <button
                onClick={() => addBet('red')}
                onContextMenu={(e) => { e.preventDefault(); removeBet('red'); }}
                disabled={isSpinning}
                className="py-3 bg-red-950/20 border border-red-500/10 hover:bg-red-500/15 rounded flex items-center justify-center gap-1.5 relative active:scale-98 duration-100 text-red-400"
              >
                <span>Red</span>
                {getCellBetAmount('red') > 0 && (
                  <span className="bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    ₹{getCellBetAmount('red')}
                  </span>
                )}
              </button>

              <button
                onClick={() => addBet('black')}
                onContextMenu={(e) => { e.preventDefault(); removeBet('black'); }}
                disabled={isSpinning}
                className="py-3 bg-gray-950/30 border border-white/5 hover:bg-white/5 rounded flex items-center justify-center gap-1.5 relative active:scale-98 duration-100 text-white"
              >
                <span>Black</span>
                {getCellBetAmount('black') > 0 && (
                  <span className="bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    ₹{getCellBetAmount('black')}
                  </span>
                )}
              </button>

              <button
                onClick={() => addBet('odd')}
                onContextMenu={(e) => { e.preventDefault(); removeBet('odd'); }}
                disabled={isSpinning}
                className="py-3 bg-gray-950/20 border border-white/5 hover:bg-white/5 rounded flex items-center justify-center gap-1.5 relative active:scale-98 duration-100"
              >
                <span>Odd</span>
                {getCellBetAmount('odd') > 0 && (
                  <span className="bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    ₹{getCellBetAmount('odd')}
                  </span>
                )}
              </button>

              <button
                onClick={() => addBet('even')}
                onContextMenu={(e) => { e.preventDefault(); removeBet('even'); }}
                disabled={isSpinning}
                className="py-3 bg-gray-950/20 border border-white/5 hover:bg-white/5 rounded flex items-center justify-center gap-1.5 relative active:scale-98 duration-100"
              >
                <span>Even</span>
                {getCellBetAmount('even') > 0 && (
                  <span className="bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    ₹{getCellBetAmount('even')}
                  </span>
                )}
              </button>
            </div>
          </div>
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
                Roulette outcomes are determined deterministically using HMAC-SHA256. You can verify the result using a standard SHA256 script.
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

              <div className="mt-2 p-3 bg-green-500/5 border border-green-500/10 rounded flex justify-between items-center text-xs">
                <span className="font-bold text-gray-400">Winning Number</span>
                <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-full ${getNumberBg(verifyData.result)} text-white`}>
                  {verifyData.result}
                </span>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-[#171a25] flex justify-end">
              <button
                onClick={() => setShowVerify(false)}
                className="px-4 py-2 bg-primary text-black font-bold text-xs rounded transition duration-150 hover:brightness-95"
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
