'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Check, Copy } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface GameViewportLayoutProps {
  gameId: string;
  gameName: string;
  rtp: number;
  children: React.ReactNode; // Renders in [game-area]
  controls: React.ReactNode; // Renders in [controls]
  verifyData?: {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    result?: string | number;
  } | null;
}

export function GameViewportLayout({
  gameId,
  gameName,
  rtp,
  children,
  controls,
  verifyData = null,
}: GameViewportLayoutProps) {
  const { balance } = useWallet();
  const [showVerify, setShowVerify] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 1500);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0b0f19] z-40 overflow-hidden select-none flex flex-col text-white">
      {/* Root Grid Layout conforming strictly to zero-ambiguity spec */}
      <div 
        className="w-full h-full grid"
        style={{
          gridTemplateRows: '[navbar] auto [game-area] 1fr [controls] auto',
        }}
      >
        {/* ROW 1: [navbar] auto */}
        <header className="h-14 bg-[#141b2b] border-b border-white/5 flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Link 
              href="/games" 
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight">{gameName}</span>
              <span className="text-[10px] text-gray-500 font-bold">RTP: {rtp}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance Widget */}
            <div className="bg-[#0b0f19] px-4 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gray-500">Balance</span>
              <span className="font-mono text-sm font-black text-yellow-500">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Provably Fair trigger */}
            {verifyData && (
              <button
                onClick={() => setShowVerify(true)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg border border-transparent transition duration-150"
              >
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="hidden sm:inline">Verify</span>
              </button>
            )}
          </div>
        </header>

        {/* ROW 2: [game-area] 1fr */}
        <main className="min-h-0 relative overflow-hidden bg-[#090d16] flex flex-col justify-center items-center p-4">
          {children}
        </main>

        {/* ROW 3: [controls] auto */}
        <footer className="bg-[#141b2b] border-t border-white/5 p-4 sm:p-5 z-10 shrink-0 flex justify-center items-center">
          <div className="w-full max-w-5xl">
            {controls}
          </div>
        </footer>
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
            
            <div className="p-5 flex flex-col gap-4 text-left">
              <p className="text-xs text-gray-400 leading-relaxed">
                Outcomes are determined deterministically using HMAC-SHA256. You can copy the seeds below to verify the result using a standard script.
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

              {verifyData.result !== undefined && (
                <div className="mt-2 p-3 bg-green-500/5 border border-green-500/10 rounded flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-400">Winning Outcome</span>
                  <span className="font-mono font-black text-green-400 text-sm">{verifyData.result}</span>
                </div>
              )}
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
