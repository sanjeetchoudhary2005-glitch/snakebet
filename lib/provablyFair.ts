
import crypto from 'crypto';

export function generateSeed(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function hashSeed(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex');
}

export function verifySeed(serverSeed: string, clientSeed: string, nonce: number, expectedHash?: string): boolean {
    const combined = `${serverSeed}-${clientSeed}-${nonce}`;
    const hash = hashSeed(combined);
    return expectedHash ? hash === expectedHash : true;
}

// Crash-specific provably fair function - Industry Standard Formula
export function generateCrashPoint(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    houseEdgePercent: number = 1
): number {
    const houseEdge = houseEdgePercent / 100;
    
    const hmac = crypto
        .createHmac('sha256', serverSeed)
        .update(`${clientSeed}:${nonce}`)
        .digest('hex');

    // Take first 8 hex characters (32 bits) as uint32
    const uint32 = parseInt(hmac.slice(0, 8), 16);
    const maxUint32 = Math.pow(2, 32);
    
    const fairCrashPoint = maxUint32 / (uint32 + 1);
    const crashPointWithEdge = fairCrashPoint * (1 - houseEdge);
    
    return Math.max(1.0, crashPointWithEdge);
}

// HMAC-SHA256 based random number generator
class HmacRandom {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    counter: number;

    constructor(serverSeed: string, clientSeed: string, nonce: number) {
        this.serverSeed = serverSeed;
        this.clientSeed = clientSeed;
        this.nonce = nonce;
        this.counter = 0;
    }

    next(): number {
        const hmac = crypto
            .createHmac('sha256', this.serverSeed)
            .update(`${this.clientSeed}:${this.nonce}:${this.counter}`)
            .digest('hex');
        
        this.counter++;
        
        // Convert first 8 hex chars to a number between 0 and 1
        const intVal = parseInt(hmac.slice(0, 8), 16);
        return intVal / 0xffffffff;
    }
}

export function calculateMultiplier(
    revealedCount: number,
    mineCount: number,
    totalTiles: number = 25,
    houseEdge: number = 0.01
): number {
    let probability = 1.0;
    for (let i = 0; i < revealedCount; i++) {
        probability *= (totalTiles - mineCount - i) / (totalTiles - i);
    }

    const fairMultiplier = 1 / probability;
    const actualMultiplier = fairMultiplier * (1 - houseEdge);

    return Math.round(actualMultiplier * 100) / 100;
}

export function placeMines(
    totalTiles: number,
    mineCount: number,
    serverSeed: string,
    clientSeed: string,
    nonce: number
): boolean[] {
    let tiles = Array(totalTiles).fill(false);

    for (let i = 0; i < mineCount; i++) {
        tiles[i] = true;
    }

    const hmacRandom = new HmacRandom(serverSeed, clientSeed, nonce);
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(hmacRandom.next() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    return tiles;
}
