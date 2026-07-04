import { z } from 'zod';

export const schemas = {
  deposit: z.object({
    amount: z.number().min(200).max(100000),
    method: z.enum(['upi', 'card', 'crypto']),
    upiId: z.string().optional(),
  }),

  withdraw: z.object({
    amount: z.number().min(1000).max(500000),
    method: z.enum(['upi', 'bank', 'crypto']),
    accountDetails: z.object({
      upiId: z.string().optional(),
      bankAccount: z.string().optional(),
      ifsc: z.string().optional(),
      cryptoAddress: z.string().optional(),
    }),
  }),

  gameAction: z.object({
    gameId: z.string().cuid(),
    action: z.enum(['start', 'reveal', 'cashout']),
    betAmount: z.number().min(1),
    data: z.any().optional(),
  }),
};
