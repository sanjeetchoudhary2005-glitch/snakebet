'use client';

import React from 'react';
import { BadgeIndianRupee, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BetControlPanelProps {
  betAmount: number;
  onChangeBetAmount: (amount: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  balance: number;
  minBet?: number;
  maxBet?: number;
  multiplier?: number | null;
  profit?: number | null;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function BetControlPanel({
  betAmount,
  onChangeBetAmount,
  onSubmit,
  isSubmitting,
  submitLabel,
  balance,
  minBet = 10,
  maxBet = 100000,
  multiplier = null,
  profit = null,
  disabled = false,
  children,
}: BetControlPanelProps) {
  const isInsufficient = betAmount > balance;
  
  const handleHalf = () => {
    const nextVal = Math.max(minBet, Math.round((betAmount / 2) * 100) / 100);
    onChangeBetAmount(nextVal);
  };

  const handleDouble = () => {
    const nextVal = Math.min(maxBet, Math.round(betAmount * 2 * 100) / 100);
    onChangeBetAmount(nextVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    onChangeBetAmount(val);
  };

  return (
    <div className="w-full bg-[#1e2330] rounded-xl border border-white/5 p-5 flex flex-col gap-4 shadow-xl transition-all duration-200">
      {/* Bet Amount Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bet Amount</span>
          <span className="text-xs text-gray-400">
            Min: ₹{minBet} • Max: ₹{maxBet}
          </span>
        </div>
        
        <div className="flex items-center bg-[#171a25] rounded-lg border border-white/10 focus-within:border-yellow-500/50 transition-all duration-200">
          <div className="pl-3 text-yellow-500 flex items-center">
            <BadgeIndianRupee className="w-4 h-4" />
          </div>
          <input
            type="number"
            value={betAmount === 0 ? '' : betAmount}
            onChange={handleInputChange}
            disabled={isSubmitting || disabled}
            className="w-full bg-transparent px-3 py-3 font-mono text-base font-bold text-white outline-none"
          />
          <div className="flex border-l border-white/10 h-full">
            <button
              type="button"
              onClick={handleHalf}
              disabled={isSubmitting || disabled}
              className="px-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-150 h-full border-r border-white/10 py-3"
            >
              ½
            </button>
            <button
              type="button"
              onClick={handleDouble}
              disabled={isSubmitting || disabled}
              className="px-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-150 h-full py-3"
            >
              2×
            </button>
          </div>
        </div>
        
        {/* Balance Validation Warning */}
        {isInsufficient && (
          <div className="mt-2 flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Can't bet more than your balance!</span>
          </div>
        )}
      </div>

      {/* Children elements (Game specific inputs) */}
      {children && <div className="flex flex-col gap-4">{children}</div>}

      {/* Live Profit Display */}
      {profit !== null && profit > 0 && (
        <div className="flex justify-between items-center bg-[#171a25]/60 rounded-lg p-3 border border-white/5">
          <span className="text-xs font-semibold text-gray-400">Total Profit</span>
          <div className="text-right">
            {multiplier && (
              <span className="text-xs font-bold text-green-400 mr-2">
                ({multiplier.toFixed(2)}x)
              </span>
            )}
            <span className="font-mono text-sm font-black text-white">
              ₹{profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || isInsufficient || betAmount < minBet || betAmount > maxBet || disabled}
        className="w-full py-4 text-base font-black rounded-lg transition-transform active:scale-[0.98] duration-150"
      >
        {isInsufficient ? 'Insufficient Balance' : submitLabel}
      </Button>
    </div>
  );
}
