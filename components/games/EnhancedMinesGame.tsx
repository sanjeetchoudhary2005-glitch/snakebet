'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import confetti from 'canvas-confetti';
import { Bomb, Gem, Trophy, History, RefreshCw } from 'lucide-react';

export function EnhancedMinesGame() {
  const { balance, refresh, fetchTransactions } = useWallet();
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [mineCount, setMineCount] = useState(3);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1);
  const [gameState, setGameState] = useState<'waiting' | 'active' | 'lost' | 'won' | 'cashedout'>('waiting');
  const [revealCount, setRevealCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server round state
  const [roundId, setRoundId] = useState<string | null>(null);
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('');
  const [nonce, setNonce] = useState(0);
  const [revealedServerSeed, setRevealedServerSeed] = useState<string>('');
  const [roundHistory, setRoundHistory] = useState<any[]>([]);

  const startGame = async () => {
    if (balance < betAmount) return;
    setError(null);

    try {
      const res = await fetch('/api/games/mines/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, mineCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start game');

      setRoundId(data.roundId);
      setServerSeedHash(data.serverSeedHash);
      setClientSeed(data.clientSeed);
      setNonce(data.nonce);
      setRevealedServerSeed('');
      setRevealed(Array(25).fill(false));
      setMinePositions([]);
      setRevealCount(0);
      setMultiplier(1);
      setGameState('active');
      setIsAnimating(false);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    }
  };

  const revealTile = async (index: number) => {
    if (gameState !== 'active' || revealed[index] || isAnimating || !roundId) return;

    setIsAnimating(true);
    setError(null);

    try {
      const res = await fetch('/api/games/mines/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, tileIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reveal tile');

      const newRevealed = [...revealed];
      newRevealed[index] = true;

      if (data.isMine) {
        // Hit a mine
        if (data.minePositions) {
          setMinePositions(data.minePositions);
          // Reveal all mines
          data.minePositions.forEach((pos: number) => {
            newRevealed[pos] = true;
          });
        }
        setRevealed(newRevealed);
        setGameState('lost');
        triggerExplosion(index);

        setRoundHistory(prev => [{
          serverSeedHash,
          clientSeed,
          nonce,
          result: 'lost',
          multiplier: 0,
          mineCount,
          revealedTiles: revealCount,
        }, ...prev].slice(0, 20));
      } else {
        // Safe tile
        setRevealed(newRevealed);
        const newCount = revealCount + 1;
        setRevealCount(newCount);
        setMultiplier(data.currentMultiplier);
        triggerDiamond(index);

        if (data.status === 'cashed_out') {
          // All safe tiles revealed - auto win
          const winAmount = betAmount * data.currentMultiplier;
          setGameState('won');
          triggerWinConfetti();
          setRoundHistory(prev => [{
            serverSeedHash,
            clientSeed,
            nonce,
            result: 'won',
            multiplier: data.currentMultiplier,
            mineCount,
            revealedTiles: newCount,
          }, ...prev].slice(0, 20));
          await refresh();
          await fetchTransactions();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reveal tile');
    } finally {
      setTimeout(() => setIsAnimating(false), 400);
    }
  };

  const cashOut = async () => {
    if (gameState !== 'active' || revealCount === 0 || !roundId) return;
    setError(null);

    try {
      const res = await fetch('/api/games/mines/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cash out');

      setGameState('cashedout');
      triggerCashoutConfetti();

      // Reveal all tiles using server-provided mine positions
      if (data.minePositions) {
        setMinePositions(data.minePositions);
        const newRevealed = Array(25).fill(true);
        setRevealed(newRevealed);
      }

      if (data.serverSeed) {
        setRevealedServerSeed(data.serverSeed);
      }

      setRoundHistory(prev => [{
        serverSeedHash,
        serverSeed: data.serverSeed,
        clientSeed,
        nonce,
        result: 'cashedout',
        multiplier,
        mineCount,
        revealedTiles: revealCount,
      }, ...prev].slice(0, 20));

      await refresh();
      await fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to cash out');
    }
  };

  // Animation effects
  const triggerExplosion = (index: number) => {
    const tile = document.querySelector(`[data-index="${index}"]`);
    if (tile) {
      tile.classList.add('explode');
      setTimeout(() => tile.classList.remove('explode'), 500);
    }
    document.querySelector('.game-container')?.classList.add('shake');
    setTimeout(() => document.querySelector('.game-container')?.classList.remove('shake'), 500);
  };

  const triggerDiamond = (index: number) => {
    const tile = document.querySelector(`[data-index="${index}"]`);
    if (tile) {
      tile.classList.add('diamond-pop');
      setTimeout(() => tile.classList.remove('diamond-pop'), 400);
    }
  };

  const triggerWinConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFFFFF', '#0088FF']
    });
  };

  const triggerCashoutConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#FFFFFF', '#00AAFF']
    });
  };

  // Helper to check if a position is a mine (only known after game ends)
  const isMine = (index: number) => minePositions.includes(index);

  return (
    <div className="mines-game game-container">
      {/* Stats Bar */}
      <div className="stats-bar flex flex-wrap justify-between items-center bg-background p-4 rounded-2xl mb-6 border border-gray-700">
        <div>
          <span className="text-sm text-gray-400">Multiplier</span>
          <div className={`text-3xl font-bold ${multiplier > 2 ? 'text-primary' : 'text-white'}`}>
            {multiplier.toFixed(2)}x
          </div>
        </div>
        <div className="text-center">
          <span className="text-sm text-gray-400">Safe Tiles</span>
          <div className="text-xl font-bold text-white">{revealCount} / {25 - mineCount}</div>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-400">Potential Win</span>
          <div className="text-xl font-bold text-white">
            ₹{(betAmount * multiplier).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-center">
          {error}
        </div>
      )}

      {/* 5x5 Grid with Animations */}
      <div className="grid grid-cols-5 gap-2 mb-6 max-w-md mx-auto">
        {Array(25).fill(null).map((_, i) => (
          <div
            key={i}
            data-index={i}
            onClick={() => revealTile(i)}
            className={`
              tile aspect-square rounded-2xl flex items-center justify-center text-3xl cursor-pointer 
              transition-all duration-300 transform hover:scale-105 
              ${revealed[i] && isMine(i) ? 'bg-red-600/80 scale-95 border-2 border-red-400' : ''}
              ${revealed[i] && !isMine(i) ? 'bg-white/80 scale-95 border-2 border-white/30' : ''}
              ${!revealed[i] && gameState === 'active' ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' : ''}
              ${!revealed[i] && (gameState === 'lost' || gameState === 'won' || gameState === 'cashedout') && !isMine(i) ? 'bg-white/10 border border-white/20' : ''}
              ${!revealed[i] && (gameState === 'lost' || gameState === 'won' || gameState === 'cashedout') && isMine(i) ? 'bg-red-900/50 border border-red-700' : ''}
              ${isAnimating ? 'pointer-events-none' : ''}
            `}
          >
            {revealed[i] && (isMine(i) ? <Bomb className="w-8 h-8 text-red-200" /> : <Gem className="w-8 h-8 text-yellow-300" />)}
            {!revealed[i] && gameState === 'waiting' && <span className="text-gray-500">❓</span>}
            {!revealed[i] && (gameState === 'lost' || gameState === 'won' || gameState === 'cashedout') && !isMine(i) && <Gem className="w-6 h-6 text-gray-600" />}
            {!revealed[i] && (gameState === 'lost' || gameState === 'won' || gameState === 'cashedout') && isMine(i) && <Bomb className="w-6 h-8 text-gray-600" />}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="controls bg-background p-6 rounded-2xl border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Bet Amount</label>
            <div className="flex gap-2 flex-wrap">
              {[10, 50, 100, 250, 500].map(val => (
                <button
                  key={val}
                  onClick={() => setBetAmount(val)}
                  className={`px-3 py-2 rounded-lg font-bold transition-all ${
                    betAmount === val ? 'bg-primary text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  disabled={gameState === 'active'}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Number of Mines: {mineCount}</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={24}
                value={mineCount}
                onChange={(e) => setMineCount(Number(e.target.value))}
                className="w-full accent-primary"
                disabled={gameState === 'active'}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={startGame}
            disabled={gameState === 'active' || balance < betAmount}
            className="flex-1 py-4 bg-primary hover:bg-primary-dark text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gameState === 'active' ? '⏳ In Progress' : '🎮 New Game'}
          </button>
          <button
            onClick={cashOut}
            disabled={gameState !== 'active' || revealCount === 0}
            className={`flex-1 py-4 font-bold rounded-xl transition-all ${
              gameState === 'active' && revealCount > 0
                ? 'bg-white hover:bg-gray-200 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            💰 Cash Out {gameState === 'active' && revealCount > 0 ? `₹${(betAmount * multiplier).toFixed(2)}` : ''}
          </button>
        </div>

        <div className="text-sm text-gray-400 text-center">
          Balance: <span className="text-white font-bold">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Provably Fair Section */}
      <div className="mt-6 bg-background p-6 rounded-2xl border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-primary" />
          <h3 className="font-bold text-xl text-white">Provably Fair</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-[#0B0B0B] border border-gray-700 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Server Seed Hash</div>
            <div className="font-mono text-xs text-primary break-all">
              {serverSeedHash ? `${serverSeedHash.slice(0, 32)}...` : '-'}
            </div>
          </div>

          <div className="bg-[#0B0B0B] border border-gray-700 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Client Seed</div>
            <div className="font-mono text-xs text-white break-all">
              {clientSeed ? `${clientSeed.slice(0, 32)}...` : '-'}
            </div>
          </div>

          <div className="bg-[#0B0B0B] border border-gray-700 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Nonce</div>
            <div className="font-mono text-xl text-primary">
              {nonce}
            </div>
          </div>
        </div>

        {revealedServerSeed && (
          <div className="mb-4 bg-[#0B0B0B] border border-white/20 rounded-xl p-4">
            <div className="text-xs text-white mb-1">Server Seed (revealed after cashout)</div>
            <div className="font-mono text-xs text-white break-all">
              {revealedServerSeed}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center">
          <Link href="/verify" className="text-primary hover:underline font-bold text-sm">
            Verify Previous Round on Fairness Page
          </Link>
        </div>
      </div>
    </div>
  );
}