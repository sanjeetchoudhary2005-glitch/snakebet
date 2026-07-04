import { describe, it, expect } from 'vitest';
import { 
  generateSeed, 
  hashSeed, 
  generateCrashPoint, 
  verifyCrashPoint, 
  placeMines, 
  calculateMultiplier, 
  rollDice, 
  flipCoin,
  spinRoulette
} from '../provably-fair';

describe('provably-fair utilities', () => {
  describe('seed generation', () => {
    it('should generate seed of correct length', () => {
      const seed = generateSeed();
      expect(seed).toHaveLength(64); // 32 bytes = 64 hex chars
    });
    it('should hash seed correctly', () => {
      const seed = 'test-seed';
      const hash = hashSeed(seed);
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });
  });

  describe('crash point', () => {
    it('should generate deterministic crash point', () => {
      const serverSeed = 'test-server-seed';
      const clientSeed = 'test-client-seed';
      const nonce = 0;
      const point1 = generateCrashPoint(serverSeed, clientSeed, nonce);
      const point2 = generateCrashPoint(serverSeed, clientSeed, nonce);
      expect(point1).toEqual(point2);
    });
    it('should verify crash point correctly', () => {
      const serverSeed = 'test-server-seed';
      const clientSeed = 'test-client-seed';
      const nonce = 0;
      const point = generateCrashPoint(serverSeed, clientSeed, nonce);
      expect(verifyCrashPoint(serverSeed, clientSeed, nonce, point)).toBe(true);
      expect(verifyCrashPoint(serverSeed, clientSeed, nonce + 1, point)).toBe(false);
    });
  });

  describe('mines', () => {
    it('should generate consistent mine positions', () => {
      const serverSeed = 'test-server';
      const clientSeed = 'test-client';
      const nonce = 0;
      const mines = 5;
      const pos1 = placeMines(serverSeed, clientSeed, nonce, mines);
      const pos2 = placeMines(serverSeed, clientSeed, nonce, mines);
      expect(pos1).toEqual(pos2);
    });
    it('should generate correct number of mine positions', () => {
      const serverSeed = 'test-server';
      const clientSeed = 'test-client';
      const nonce = 0;
      const mines = 3;
      const positions = placeMines(serverSeed, clientSeed, nonce, mines);
      expect(positions).toHaveLength(mines);
    });
  });

  describe('dice', () => {
    it('should roll between 0 and 100 inclusive', () => {
      const serverSeed = 'test-server';
      const clientSeed = 'test-client';
      const nonce = 0;
      const roll = rollDice(serverSeed, clientSeed, nonce);
      expect(roll).toBeGreaterThanOrEqual(0);
      expect(roll).toBeLessThanOrEqual(100);
    });
  });

  describe('coinflip', () => {
    it('should flip heads or tails', () => {
      const serverSeed = 'test-server';
      const clientSeed = 'test-client';
      const nonce = 0;
      const result = flipCoin(serverSeed, clientSeed, nonce);
      expect(['heads', 'tails']).toContain(result);
    });
  });

  describe('roulette', () => {
    it('should spin between 0 and 36 inclusive', () => {
      const serverSeed = 'test-server';
      const clientSeed = 'test-client';
      const nonce = 0;
      const result = spinRoulette(serverSeed, clientSeed, nonce);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(36);
    });
  });
});
