
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseAutoplayParams {
  maxRounds: number;
  lossLimit: number;
  profitTarget: number;
  betAmount: number;
  onPlaceBet: () => void;
  canPlaceBet: boolean;
}

export function useAutoplay({
  maxRounds,
  lossLimit,
  profitTarget,
  betAmount,
  onPlaceBet,
  canPlaceBet,
}: UseAutoplayParams) {
  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [stopReason, setStopReason] = useState<string | null>(null);
  
  const isActiveRef = useRef(false);
  const roundResultProcessedRef = useRef(false);

  const startAutoplay = useCallback(() => {
    setIsActive(true);
    isActiveRef.current = true;
    setCurrentRound(0);
    setSessionProfit(0);
    setStopReason(null);
    roundResultProcessedRef.current = true;
  }, []);

  const stopAutoplay = useCallback((reason: string) => {
    setIsActive(false);
    isActiveRef.current = false;
    setStopReason(reason);
  }, []);

  const registerRoundResult = useCallback((won: boolean, profit: number) => {
    if (!isActiveRef.current) return;

    setSessionProfit((prev) => prev + profit);
    roundResultProcessedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isActiveRef.current || !canPlaceBet || !roundResultProcessedRef.current) {
      return;
    }

    const nextRound = currentRound + 1;

    if (nextRound > maxRounds) {
      stopAutoplay("Maximum rounds reached");
      return;
    }

    if (sessionProfit <= -lossLimit) {
      stopAutoplay("Loss limit reached");
      return;
    }

    if (sessionProfit >= profitTarget) {
      stopAutoplay("Profit target reached");
      return;
    }

    roundResultProcessedRef.current = false;
    setCurrentRound(nextRound);
    
    const timer = setTimeout(() => {
      onPlaceBet();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    isActive,
    currentRound,
    sessionProfit,
    maxRounds,
    lossLimit,
    profitTarget,
    canPlaceBet,
    onPlaceBet,
    stopAutoplay,
  ]);

  return {
    isActive,
    currentRound,
    sessionProfit,
    stopReason,
    startAutoplay,
    stopAutoplay: () => stopAutoplay("Manually stopped"),
    registerRoundResult,
  };
}

