'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useGameEffects } from '@/hooks/useGameEffects';
import { GameViewportLayout } from './GameViewportLayout';
import { Wheel3D } from './3d/Wheel3D';
import { motion } from 'framer-motion';
import { BetControlPanel } from './BetControlPanel';

const WHEEL_SEGMENTS: Record<string, { multiplier: number; color: string; label: string }[]> = {
  Low: [
    { multiplier: 1.5, color: '#22c55e', label: '1.5x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 1.5, color: '#22c55e', label: '1.5x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 2.0, color: '#3b82f6', label: '2.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 1.5, color: '#22c55e', label: '1.5x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 5.0, color: '#a855f7', label: '5.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
  ],
  Medium: [
    { multiplier: 2.0, color: '#3b82f6', label: '2.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 2.0, color: '#3b82f6', label: '2.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 5.0, color: '#a855f7', label: '5.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 10.0, color: '#ec4899', label: '10.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 25.0, color: '#eab308', label: '25.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
  ],
  High: [
    { multiplier: 3.0, color: '#a855f7', label: '3.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 3.0, color: '#a855f7', label: '3.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 10.0, color: '#ec4899', label: '10.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 50.0, color: '#eab308', label: '50.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
    { multiplier: 100.0, color: '#ef4444', label: '100.0x' },
    { multiplier: 0, color: '#374151', label: '0x' },
  ],
};

export function WheelGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const { playSound, triggerWin, triggerLose, WinFlashOverlay } = useGameEffects();

  // State
  const [betAmount, setBetAmount] = useState(100);
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'settled'>('idle');
  const [roundId, setRoundId] = useState<string | null>(null);
  
  const [rotation, setRotation] = useState(0);
  const [payout, setPayout] = useState(0);
  const [winMultiplier, setWinMultiplier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Seed Data
  const [verifyData, setVerifyData] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);

  const segments = WHEEL_SEGMENTS[riskLevel];

  const spinWheel = async () => {
    if (balance < betAmount || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    setGameState('playing');
    setWinMultiplier(null);
    setPayout(0);
    playSound('click');

    try {
      const response = await fetch('/api/games/wheel/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, riskLevel }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to trigger wheel play');

      setRoundId(data.roundId);
      setVerifyData({
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });

      // Calculate destination angle
      // segments.length = 10. The winner index is segmentIndex.
      // To land at the pointer top position (which is -Math.PI / 2), the segment index needs to settle correctly.
      const segmentAngle = (2 * Math.PI) / segments.length;
      const targetAngle = (segments.length - data.segmentIndex - 0.5) * segmentAngle;
      
      const spinsCount = 5; // 5 full loops
      const totalRotation = spinsCount * 2 * Math.PI + targetAngle;

      const duration = 4000; // 4 seconds spin
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease out
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentRot = totalRotation * ease;
        setRotation(currentRot);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Settled spin
          setTimeout(async () => {
            setWinMultiplier(data.multiplier);
            setPayout(data.payout);
            setGameState('settled');

            if (data.payout > 0) {
              triggerWin(data.multiplier);
            } else {
              triggerLose();
            }

            await refresh();
            fetchTransactions();
            setIsSubmitting(false);
          }, 200);
        }
      };

      animate();

    } catch (err: any) {
      setError(err.message || 'Error occurred starting Wheel');
      setGameState('idle');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    playSound('click');
    setGameState('idle');
    setWinMultiplier(null);
    setPayout(0);
    setRoundId(null);
    setError(null);
  };

  return (
    <GameViewportLayout
      gameId="wheel"
      gameName="🎡 Wheel of Fortune"
      rtp={97.0}
      verifyData={verifyData ? { ...verifyData, result: `${winMultiplier}x` } : null}
      controls={
        gameState === 'idle' ? (
          <div className="flex flex-col gap-4 w-full">
            {/* Risk Selection */}
            <div className="grid grid-cols-3 gap-2 bg-[#0b0f19]/80 p-1 border border-white/5 rounded-xl">
              {['Low', 'Medium', 'High'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskLevel(lvl as any)}
                  className={`py-3 rounded-lg font-black text-xs transition-all flex flex-col items-center justify-center ${
                    riskLevel === lvl 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25' 
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{lvl} Risk</span>
                </button>
              ))}
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex-1">
                <input 
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-center"
                />
              </div>
              <button
                onClick={spinWheel}
                disabled={isSubmitting || balance < betAmount}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition duration-150 active:scale-98 text-sm"
              >
                Spin Wheel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleReset}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:brightness-110 rounded-xl text-base font-black transition duration-150 active:scale-98"
          >
            Play Again
          </button>
        )
      }
    >
      <WinFlashOverlay />

      <div className="flex-1 w-full max-w-5xl flex flex-col lg:flex-row gap-6 relative justify-center items-center py-4">
        
        {/* Wheel R3F Viewer */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,#111827,#030712_75%)] border border-white/5 rounded-2xl p-6 relative flex items-center justify-center shadow-2xl w-full min-h-[340px]">
          <Wheel3D
            rotation={rotation}
            segments={segments}
            isSpinning={gameState === 'playing'}
            tickSound={() => playSound('bounce')} // Stub boundaries tick click
          />
        </div>

        {/* Info panel */}
        <div className="w-full lg:w-48 bg-[#141b2b] border border-white/5 rounded-2xl p-4 flex flex-col shrink-0 justify-center">
          <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 block">Outcome Details</span>
          
          <div className="flex flex-col gap-2">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Wager placed</span>
              <span className="text-sm font-black text-white">₹{betAmount}</span>
            </div>

            {gameState === 'settled' && winMultiplier !== null && (
              <div className={`p-3 rounded-xl border flex flex-col ${
                payout > 0 ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
              }`}>
                <span className="text-[10px] uppercase font-bold opacity-70">Multiplier hit</span>
                <span className="text-sm font-black font-mono">x{winMultiplier}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </GameViewportLayout>
  );
}
