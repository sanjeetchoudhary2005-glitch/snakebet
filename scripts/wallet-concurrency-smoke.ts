import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { placeBet } from '../lib/wallet';

async function main() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      email: `wallet-smoke-${suffix}@example.test`,
      username: `wallet_smoke_${suffix}`.slice(0, 32),
      password: 'not-used',
      referralCode: `smoke_${suffix}`.slice(0, 32),
      isVerified: true,
      balance: new Prisma.Decimal(50),
    },
  });

  try {
    const attempts = Array.from({ length: 10 }, (_, index) =>
      placeBet({
        userId: user.id,
        gameId: 'dice',
        roundId: `smoke-${suffix}-${index}`,
        amount: 10,
      })
    );

    const results = await Promise.allSettled(attempts);
    const successfulBets = results.filter((result) => result.status === 'fulfilled').length;
    const failedBets = results.filter((result) => result.status === 'rejected').length;
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { balance: true },
    });
    const finalBalance = Number(updatedUser.balance);

    if (successfulBets !== 5 || failedBets !== 5 || finalBalance !== 0) {
      throw new Error(
        `Expected 5 successes, 5 rejections, and balance 0. Got ${successfulBets} successes, ${failedBets} rejections, balance ${finalBalance}.`
      );
    }

    console.log('wallet concurrency smoke passed');
  } finally {
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
