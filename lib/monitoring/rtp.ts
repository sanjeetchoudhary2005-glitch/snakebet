import { prisma } from '@/lib/prisma';

interface RTPStats {
  gameId: string;
  totalWagered: number;
  totalPaid: number;
  actualRTP: number;
  expectedRTP: number;
  variance: number;
  thresholdBreached: boolean;
}

const EXPECTED_RTPS: Record<string, number> = {
  crash: 0.98,
  mines: 0.98,
  dice: 0.98,
  plinko: 0.98,
  limbo: 0.98,
  wheel: 0.98,
  keno: 0.97,
  hilo: 0.98,
  'dragon-tower': 0.98,
  coinflip: 0.98,
  roulette: 0.97,
  blackjack: 0.995,
  slots: 0.97,
  ludo: 0.95,
};

const RTP_THRESHOLD = 0.05; // Alert if actual RTP differs by more than 5%

export class RTPMonitor {
  async getStats(gameId?: string, periodHours = 24): Promise<RTPStats[]> {
    const games = gameId ? [gameId] : Object.keys(EXPECTED_RTPS);
    const stats: RTPStats[] = [];

    for (const game of games) {
      const transactions = await prisma.transaction.findMany({
        where: {
          gameId: game,
          createdAt: {
            gte: new Date(Date.now() - periodHours * 60 * 60 * 1000),
          },
        },
      });

      const totalWagered = transactions
        .filter(t => t.type === 'BET')
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);

      const totalPaid = transactions
        .filter(t => t.type === 'WIN')
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);

      const actualRTP = totalWagered > 0 ? totalPaid / totalWagered : 0;
      const expectedRTP = EXPECTED_RTPS[game] || 0.97;
      const variance = Math.abs(actualRTP - expectedRTP);
      const thresholdBreached = variance > RTP_THRESHOLD;

      stats.push({
        gameId: game,
        totalWagered,
        totalPaid,
        actualRTP,
        expectedRTP,
        variance,
        thresholdBreached,
      });
    }

    return stats;
  }

  async checkForAlerts(periodHours = 24): Promise<string[]> {
    const stats = await this.getStats(undefined, periodHours);
    const alerts: string[] = [];

    for (const stat of stats) {
      if (stat.thresholdBreached) {
        alerts.push(
          `RTP ALERT: ${stat.gameId} has actual RTP ${(stat.actualRTP * 100).toFixed(2)}% vs expected ${(stat.expectedRTP * 100).toFixed(2)}%`
        );
      }
    }

    return alerts;
  }
}

export const rtpMonitor = new RTPMonitor();
