'use client';

import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useGameEffects() {
  const [winFlash, setWinFlash] = useState(false);

  const playSound = useCallback((type: 'click' | 'win' | 'lose' | 'chip' | 'card' | 'dice' | 'bounce') => {
    // Sound hooks: stubbed for now but fully structured to allow dropping audio files in later
    console.log(`[Sound Hook] Trigger sound: ${type}`);
    
    // Example future-proofing implementation:
    // try {
    //   const audio = new Audio(`/sounds/${type}.mp3`);
    //   audio.volume = 0.5;
    //   audio.play().catch(() => {});
    // } catch (e) {}
  }, []);

  const triggerWin = useCallback((multiplier: number = 1) => {
    // Sound hook
    playSound('win');

    // Win flash: green glow on screen borders
    setWinFlash(true);
    setTimeout(() => setWinFlash(false), 600);

    // Confetti burst for big wins (e.g. 5x+)
    if (multiplier >= 5) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#eab308', '#3b82f6', '#ec4899'],
      });
    } else {
      // Small sparkle confetti on small win
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#eab308'],
      });
    }
  }, [playSound]);

  const triggerLose = useCallback(() => {
    playSound('lose');
    // Loss moments are quick and clean - no distracting or punishing animations.
  }, [playSound]);

  const WinFlashOverlay = () => {
    if (!winFlash) return null;
    return (
      <div 
        className="pointer-events-none fixed inset-0 z-50 border-[12px] border-green-500/25 transition-opacity duration-500 opacity-100"
        style={{
          boxShadow: 'inset 0 0 100px rgba(34, 197, 94, 0.3)',
        }}
      />
    );
  };

  return {
    playSound,
    triggerWin,
    triggerLose,
    WinFlashOverlay,
  };
}
