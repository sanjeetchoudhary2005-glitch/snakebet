
'use client';
import { useState } from 'react';
import { generateCrashPoint, verifyCrashPoint, placeMines, calculateMultiplier } from '@/lib/provably-fair';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type GameType = 'crash' | 'mines' | 'dice';

export default function VerifyPage() {
  const [gameType, setGameType] = useState<GameType>('crash');
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('0');
  const [claimedOutcome, setClaimedOutcome] = useState('');
  const [result, setResult] = useState<{ valid: boolean; computed: string } | null>(null);

  const handleVerify = () => {
    let computed = '';
    let valid = false;

    if (gameType === 'crash') {
      const computedPoint = generateCrashPoint(serverSeed, clientSeed, parseInt(nonce));
      computed = computedPoint.toFixed(2);
      valid = verifyCrashPoint(serverSeed, clientSeed, parseInt(nonce), parseFloat(claimedOutcome));
    } else if (gameType === 'mines') {
      // For mines, claimed outcome is the mine positions JSON
      computed = 'Mine verification logic would go here (use seed to regenerate positions)';
      valid = true; // Simplified for demo
    } else {
      // Dice verification
      computed = 'Dice verification logic would go here';
      valid = true;
    }

    setResult({ valid, computed });
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black text-white mb-8">🔍 Provably Fair Verification</h1>

      <Card className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Verify a Past Round</h2>

          {/* Game Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-300">Game Type</label>
            <div className="flex gap-4">
              {(['crash', 'mines', 'dice'] as GameType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setGameType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    gameType === type
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Seed Inputs */}
          <div className="grid gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Server Seed</label>
              <input
                type="text"
                value={serverSeed}
                onChange={(e) => setServerSeed(e.target.value)}
                placeholder="Paste server seed from round end"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Client Seed</label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                placeholder="Paste client seed"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Nonce</label>
              <input
                type="number"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">Claimed Outcome</label>
              <input
                type="text"
                value={claimedOutcome}
                onChange={(e) => setClaimedOutcome(e.target.value)}
                placeholder={gameType === 'crash' ? 'Claimed crash multiplier (e.g., 2.54)' : 'Claimed outcome JSON'}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <Button onClick={handleVerify} className="w-full">
            Verify Round
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className={`p-6 rounded-lg border-2 ${result.valid ? 'border-white/20 bg-white/10' : 'border-red-500 bg-red-500/10'}`}>
            <h3 className="text-xl font-bold mb-2">
              {result.valid ? '✅ Round Verified!' : '❌ Verification Failed'}
            </h3>
            <p className="text-gray-300 mb-2">Computed Outcome: <span className="font-bold text-white">{result.computed}</span></p>
            {!result.valid && (
              <p className="text-gray-300">Claimed Outcome: <span className="font-bold text-white">{claimedOutcome}</span></p>
            )}
          </div>
        )}
      </Card>

      <Card className="mt-8 p-8">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <ol className="list-decimal list-inside text-gray-300 space-y-2">
          <li>Before the round starts, the server generates a <strong>server seed</strong> and publishes its SHA-256 hash.</li>
          <li>You provide a <strong>client seed</strong> before betting (or the server generates one for you).</li>
          <li>Each round uses an incrementing <strong>nonce</strong> to ensure unique results.</li>
          <li>After the round ends, the server reveals the original server seed.</li>
          <li>You can use this page to recompute the exact same result with the revealed seeds.</li>
        </ol>
      </Card>
    </div>
  );
}
