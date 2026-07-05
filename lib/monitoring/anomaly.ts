import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/audit';

export class AnomalyDetector {
  private thresholds = {
    MAX_WITHDRAWAL: 100000, // Max withdrawal amount before flagging
    MAX_DEPOSIT: 500000,    // Max deposit amount before flagging
    MAX_GAMES_PER_MINUTE: 60, // Max games per minute
    MAX_LOGIN_ATTEMPTS: 5, // Max failed login attempts before lock
    UNUSUAL_HOURS: [0, 1, 2, 3, 4, 5], // 12 AM - 6 AM
  };

  async checkWithdrawal(userId: string, amount: number): Promise<boolean> {
    if (amount > this.thresholds.MAX_WITHDRAWAL) {
      await this.alert('HIGH_WITHDRAWAL', { userId, amount });
      return false;
    }
    return true;
  }

  async checkDeposit(userId: string, amount: number): Promise<boolean> {
    if (amount > this.thresholds.MAX_DEPOSIT) {
      await this.alert('HIGH_DEPOSIT', { userId, amount });
      return false;
    }
    return true;
  }

  async checkLoginAttempt(userId: string, ip: string): Promise<boolean> {
    const attempts = await prisma.securityLog.count({
      where: {
        userId,
        event: 'LOGIN_FAILED',
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 minutes
      },
    });

    if (attempts >= this.thresholds.MAX_LOGIN_ATTEMPTS) {
      await prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + 30 * 60 * 1000) }, // Lock for 30 minutes
      });
      await this.alert('ACCOUNT_LOCKED', { userId, attempts, ip });
      return false;
    }
    return true;
  }

  async checkGameActivity(userId: string): Promise<boolean> {
    const games = await prisma.game.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) }, // Last minute
      },
    });

    if (games > this.thresholds.MAX_GAMES_PER_MINUTE) {
      await this.alert('RAPID_GAMING', { userId, games });
      return false;
    }
    return true;
  }

  private async alert(type: string, data: any) {
    await logSecurityEvent('ANOMALY_DETECTED', null, { type, ...data });
    // In production, you could also send:
    // - WebSocket alerts to admin dashboard
    // - Slack/Discord notifications
    // - Email to admin team
  }
}

export const anomalyDetector = new AnomalyDetector();
