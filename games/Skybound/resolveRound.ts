
import { generateCrashPoint } from '@/lib/provablyFair';

export function resolveRound(serverSeed: string, clientSeed: string, nonce: number) {
  // Use our new provably fair crash multiplier
  const crashMultiplier = generateCrashPoint(serverSeed, clientSeed, nonce, 1);
  
  return {
    win: false,
    amount: 0,
    multiplier: crashMultiplier,
    metadata: { crashPoint: crashMultiplier },
    serverSeed,
    clientSeed,
    nonce
  };
}
