
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { GameProps } from '@/lib/gameTypes';
import { Bomb, Gem, Settings, History, TrendingUp, CheckCircle2, Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSeed, hashSeed, calculateMultiplier, placeMines } from '@/lib/provablyFair';
import { useWallet } from '@/context/WalletContext';
import { DepositModal } from '@/components/DepositModal';

type GameState = 'waiting' | 'active' | 'cashed_out' | 'lost';

interface RoundEntry {
    id: string;
    minePositions: boolean[];
    revealedTiles: number[];
    result: 'won' | 'lost' | 'cashed_out';
    multiplier: number;
    betAmount: number;
    winAmount?: number;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    timestamp: number;
}

const MinesGame: React.FC<GameProps> = ({ 
  onBet, 
  onCashOut
}) => {
  const { balance, addBalance, deductBalance, refresh, user } = useWallet();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [mineCount, setMineCount] = useState<number>(3);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [minePositions, setMinePositions] = useState<boolean[]>(Array(25).fill(false));
  const [roundHistory, setRoundHistory] = useState<RoundEntry[]>([]);
  const [showProvablyFairModal, setShowProvablyFairModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [clientSeed, setClientSeed] = useState<string>(generateSeed());
  const [nonce, setNonce] = useState<number>(0);
  const [currentServerSeed, setCurrentServerSeed] = useState<string>('');
  const [currentServerSeedHash, setCurrentServerSeedHash] = useState<string>('');

    const startNewRound = useCallback(() => {
        const newServerSeed = generateSeed();
        const newServerSeedHash = hashSeed(newServerSeed);
        setCurrentServerSeed(newServerSeed);
        setCurrentServerSeedHash(newServerSeedHash);

        const newMinePositions = placeMines(25, mineCount, newServerSeed, clientSeed, nonce);
        setMinePositions(newMinePositions);

        setRevealedTiles([]);
        setCurrentMultiplier(1.00);
        setGameState('waiting');
    }, [mineCount, clientSeed, nonce]);

    const handleStartGame = () => {
    if (betAmount > balance) {
      setShowDepositModal(true);
      return;
    }
    deductBalance(betAmount); // Deduct bet amount
    onBet(betAmount, { mineCount });
    setGameState('active');
  };

    const handleTileClick = useCallback((index: number) => {
        if (gameState !== 'active') return;
        if (revealedTiles.includes(index)) return;

        if (minePositions[index]) {
            setRevealedTiles(prev => [...prev, index]);
            setGameState('lost');
            
            // Record game in database
            if (user?.id) {
                fetch('/api/games', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        type: 'MINES',
                        betAmount,
                        multiplier: 0,
                        result: 'LOSS',
                        winAmount: 0,
                        details: {
                            mineCount,
                            revealedTiles: [...revealedTiles, index],
                            minePositions: [...minePositions],
                            nonce,
                            clientSeed,
                            serverSeed: currentServerSeed
                        }
                    })
                });
            }

            const newEntry: RoundEntry = {
                id: Date.now().toString(),
                minePositions: [...minePositions],
                revealedTiles: [...revealedTiles, index],
                result: 'lost',
                multiplier: 0,
                betAmount,
                serverSeed: currentServerSeed,
                serverSeedHash: currentServerSeedHash,
                clientSeed,
                nonce,
                timestamp: Date.now()
            };
            setRoundHistory(prev => [newEntry, ...prev].slice(0, 20));
            setNonce(n => n + 1);
            return;
        }

        const newRevealed = [...revealedTiles, index];
        const newMultiplier = calculateMultiplier(newRevealed.length, mineCount);
        
        setRevealedTiles(newRevealed);
        setCurrentMultiplier(newMultiplier);
    }, [gameState, revealedTiles, minePositions, betAmount, currentServerSeed, currentServerSeedHash, clientSeed, nonce, user]);

    const handleCashOut = useCallback(async () => {
    if (gameState !== 'active' || revealedTiles.length === 0) return;
    
    const winAmount = betAmount * currentMultiplier;
    addBalance(winAmount); // Add win amount to balance
    onCashOut();
    setGameState('cashed_out');

    // Record game in database
    if (user?.id) {
        await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                type: 'MINES',
                betAmount,
                multiplier: currentMultiplier,
                result: 'WIN',
                winAmount,
                details: {
                    mineCount,
                    revealedTiles: [...revealedTiles],
                    minePositions: [...minePositions],
                    nonce,
                    clientSeed,
                    serverSeed: currentServerSeed
                }
            })
        });
        await refresh();
    }
    
    const newEntry: RoundEntry = {
      id: Date.now().toString(),
      minePositions: [...minePositions],
      revealedTiles: [...revealedTiles],
      result: 'cashed_out',
      multiplier: currentMultiplier,
      betAmount,
      winAmount,
      serverSeed: currentServerSeed,
      serverSeedHash: currentServerSeedHash,
      clientSeed,
      nonce,
      timestamp: Date.now()
    };
    setRoundHistory(prev => [newEntry, ...prev].slice(0, 20));
    setNonce(n => n + 1);
  }, [gameState, revealedTiles, betAmount, currentMultiplier, onCashOut, minePositions, currentServerSeed, currentServerSeedHash, clientSeed, nonce, addBalance, user, refresh]);

    // Initialize on mount
    React.useEffect(() => {
        startNewRound();
    }, [startNewRound]);

    const renderTile = (index: number) => {
        const isRevealed = revealedTiles.includes(index);
        const isMine = minePositions[index];

        let className = "aspect-square bg-secondary border border-gray-700 rounded-xl flex items-center justify-center transition-all duration-200";
        
        if (isRevealed) {
            if (isMine) {
                className += " bg-red-500/20 border-red-500";
            } else {
                className += " bg-primary/20 border-primary";
            }
        } else {
            if (gameState === 'active') {
                className += " hover:border-primary cursor-pointer hover:scale-105";
            }
        }

        return (
            <motion.button
                key={index}
                className={className}
                onClick={() => handleTileClick(index)}
                whileHover={gameState === 'active' && !isRevealed ? { scale: 1.05 } : {}}
                whileTap={gameState === 'active' && !isRevealed ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
            >
                {isRevealed && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, type: "spring" }}
                    >
                        {isMine ? (
                            <Bomb className="w-10 h-10 text-red-500" />
                        ) : (
                            <Gem className="w-10 h-10 text-primary" />
                        )}
                    </motion.div>
                )}
            </motion.button>
        );
    };

    return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-6xl mx-auto">
      <div className="flex-1">
        <Card className="p-6">
          {/* Balance & Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-left">
              <div className="text-[10px] text-muted uppercase tracking-widest font-semibold mb-1">Your Balance</div>
              <div className="text-3xl font-black text-primary flex items-center gap-2">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="ml-2 p-2 rounded-full bg-primary/20 hover:bg-primary/30 text-black transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black tracking-tight text-primary">
                {currentMultiplier.toFixed(2)}x
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-widest">
                {gameState === 'waiting' && 'Set your bet'}
                {gameState === 'active' && 'Reveal diamonds'}
                {gameState === 'cashed_out' && 'Cashed out!'}
                {gameState === 'lost' && 'Game over!'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
            {[...Array(25)].map((_, i) => renderTile(i))}
          </div>

          {gameState !== 'waiting' && (
            <div className="mt-8 max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Revealed</span>
                <span className="font-bold text-primary">{revealedTiles.length}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(revealedTiles.length / (25 - mineCount)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </Card>

                <Card className="mt-6 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-primary" />
                        <h3 className="font-bold text-xl">Recent Rounds</h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {roundHistory.slice(0, 10).map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between text-sm p-3 rounded-lg border"
                                style={{
                                    borderColor: entry.result === 'lost' ? 'rgba(239,68,68,0.3)' : 'rgba(0,231,1,0.3)',
                                    backgroundColor: entry.result === 'lost' ? 'rgba(239,68,68,0.05)' : 'rgba(0,231,1,0.05)'
                                }}
                            >
                                <div>
                                    <div className="font-bold" style={{ color: entry.result === 'lost' ? '#ef4444' : '#00e701' }}>
                                        {entry.result === 'lost' ? 'Lost' : `Won ₹${entry.winAmount?.toFixed(2)}`}
                                    </div>
                                    <div className="text-gray-400 text-xs">
                                        {entry.revealedTiles.length} tiles revealed
                                    </div>
                                </div>
                                <div className="font-bold" style={{ color: entry.result === 'lost' ? '#ef4444' : '#00e701' }}>
                                    {entry.multiplier.toFixed(2)}x
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="lg:w-80">
                <Card className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-white">Bet Amount</label>
                        <div className="relative mb-3">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary">₹</span>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value) || 1))}
                                min={1}
                                step={1}
                                disabled={gameState !== 'waiting'}
                                className="w-full pl-10 pr-4 py-3.5 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold text-white"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[10, 50, 100, 500].map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setBetAmount(amt)}
                                    disabled={gameState !== 'waiting'}
                                    className="px-3 py-2 bg-secondary border border-gray-700 rounded-lg hover:border-primary font-bold text-sm disabled:opacity-50 text-white transition-all"
                                >
                                    ₹{amt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-white">Number of Mines</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="number"
                                value={mineCount}
                                onChange={(e) => setMineCount(Math.max(1, Math.min(24, parseInt(e.target.value) || 3)))}
                                min={1}
                                max={24}
                                disabled={gameState !== 'waiting'}
                                className="flex-1 px-4 py-3.5 bg-background rounded-xl border border-gray-700 focus:border-primary outline-none text-lg font-bold text-white"
                            />
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 3, 5, 10, 15].map((cnt) => (
                                <button
                                    key={cnt}
                                    onClick={() => setMineCount(cnt)}
                                    disabled={gameState !== 'waiting'}
                                    className="px-3 py-2 bg-secondary border border-gray-700 rounded-lg hover:border-primary font-bold text-sm disabled:opacity-50 text-white transition-all"
                                >
                                    {cnt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {gameState === 'waiting' ? (
                        <Button
                            variant="primary"
                            size="xl"
                            onClick={handleStartGame}
                            disabled={betAmount > balance}
                            className="w-full py-5 text-xl"
                        >
                            <CheckCircle2 className="w-6 h-6 mr-2" />
                            New Game
                        </Button>
                    ) : gameState === 'active' ? (
                        <Button
                            variant="destructive"
                            size="xl"
                            onClick={handleCashOut}
                            disabled={revealedTiles.length === 0}
                            className="w-full py-5 text-xl"
                        >
                            <CheckCircle2 className="w-6 h-6 mr-2" />
                            Cash Out ₹{(betAmount * currentMultiplier).toFixed(2)}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="xl"
                            onClick={startNewRound}
                            className="w-full py-5 text-xl"
                        >
                            <CheckCircle2 className="w-6 h-6 mr-2" />
                            Play Again
                        </Button>
                    )}
                </Card>

                <Card className="p-6 mt-6">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                        <History className="text-primary" />
                        Provably Fair
                    </h3>
                    <div className="text-xs text-gray-400 space-y-2">
                        <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-gray-800">
                            <span className="text-gray-300">Server Seed Hash</span>
                            <span className="font-mono text-primary text-xs break-all max-w-[200px]">
                                {currentServerSeedHash.slice(0, 32)}...
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-gray-800">
                            <span className="text-gray-300">Client Seed</span>
                            <span className="font-mono text-primary text-xs break-all max-w-[200px]">
                                {clientSeed.slice(0, 32)}...
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-gray-800">
                            <span className="text-gray-300">Nonce</span>
                            <span className="font-mono text-primary">{nonce}</span>
                        </div>
                        <button
                            onClick={() => setShowProvablyFairModal(true)}
                            className="w-full text-primary hover:underline text-sm font-semibold mt-2"
                        >
                            Verify Last Round
                        </button>
                    </div>
                </Card>
            </div>

            <AnimatePresence>
                {showProvablyFairModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-secondary border border-gray-700 rounded-2xl p-8 max-w-lg w-full"
                        >
                            <h2 className="text-2xl font-black text-white mb-6">Verify Round Fairness</h2>
                            <div className="space-y-4">
                                <p className="text-gray-300 text-sm">
                                    You can verify that the mine positions were not changed after the round using
                                    the seeds and HMAC-SHA256 algorithm.
                                </p>
                                {roundHistory.length > 0 && (
                                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1">Server Seed (revealed)</div>
                                            <div className="font-mono text-xs break-all text-primary">
                                                {roundHistory[0].serverSeed}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1">Client Seed</div>
                                            <div className="font-mono text-xs break-all text-white">
                                                {roundHistory[0].clientSeed}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1">Nonce</div>
                                            <div className="font-mono text-xs text-white">
                                                {roundHistory[0].nonce}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1">Result</div>
                                            <div className="font-bold text-lg" style={{
                                                color: roundHistory[0].result === 'lost' ? '#ef4444' : '#00e701'
                                            }}>
                                                {roundHistory[0].multiplier.toFixed(2)}x
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowProvablyFairModal(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={() => {
                                            if (roundHistory.length > 0) {
                                                navigator.clipboard.writeText(
                                                    `Server Seed: ${roundHistory[0].serverSeed}\nClient Seed: ${roundHistory[0].clientSeed}\nNonce: ${roundHistory[0].nonce}`
                                                );
                                            }
                                        }}
                                    >
                                        Copy Seeds
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <DepositModal open={showDepositModal} onClose={() => setShowDepositModal(false)} />
        </div>
    );
};

export default MinesGame;
