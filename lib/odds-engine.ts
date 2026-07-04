/**
 * Combinatorics & Odds Calculation Engine for Snakebet
 */

// --- 1. Basic Combinatorics ---
export function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function nCr(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

export function nPr(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / factorial(n - r);
}

// --- 2. Accumulator Odds ---
export function combineOdds(legs: number[]): number {
  return legs.reduce((product, odd) => product * odd, 1);
}

// --- 3. Cluster Detection (for Slots!) ---
export interface Cluster {
  symbols: string;
  size: number;
  positions: { row: number; col: number }[];
}

export function findClusters(
  grid: string[][],
  minSize: number = 5
): Cluster[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const clusters: Cluster[] = [];

  // Directions: up, down, left, right
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];

  function bfs(startRow: number, startCol: number): Cluster | null {
    const key = `${startRow},${startCol}`;
    if (visited.has(key)) return null;

    const queue = [{ row: startRow, col: startCol }];
    const cluster: Cluster = {
      symbols: grid[startRow][startCol],
      size: 0,
      positions: []
    };

    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      const currentKey = `${row},${col}`;

      if (
        row < 0 || row >= rows || col < 0 || col >= cols ||
        visited.has(currentKey) || grid[row][col] !== cluster.symbols
      ) continue;

      visited.add(currentKey);
      cluster.size++;
      cluster.positions.push({ row, col });

      for (const [dr, dc] of directions) {
        queue.push({ row: row + dr, col: col + dc });
      }
    }
    return cluster.size >= minSize ? cluster : null;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cluster = bfs(r, c);
      if (cluster) clusters.push(cluster);
    }
  }
  return clusters;
}

// --- 4. RNG Sequence Wrapper ---
export class RNGSequence {
  private cursor: number = 0;
  private serverSeed: string;
  private clientSeed: string;
  private nonce: number;

  constructor(serverSeed: string, clientSeed: string, nonce: number) {
    this.serverSeed = serverSeed;
    this.clientSeed = clientSeed;
    this.nonce = nonce;
  }

  next(): number {
    const r = this.hmacRandom(this.serverSeed, this.clientSeed, this.nonce, this.cursor);
    this.cursor++;
    return r;
  }

  private hmacRandom(serverSeed: string, clientSeed: string, nonce: number, cursor: number): number {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}:${cursor}`).digest('hex');
    const value = parseInt(hmac.substring(0, 16), 16);
    return value / (2 ** 64);
  }
}
