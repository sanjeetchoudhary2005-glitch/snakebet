-- Phase 2: live activity, VIP, promotions claims, query indexes

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_lastActiveAt_idx" ON "User"("lastActiveAt");

CREATE INDEX IF NOT EXISTS "Transaction_userId_type_createdAt_idx" ON "Transaction"("userId", "type", "createdAt");

CREATE TABLE IF NOT EXISTS "PromotionClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "amountCredited" DECIMAL(65,30) NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromotionClaim_userId_promotionId_key" ON "PromotionClaim"("userId", "promotionId");
CREATE INDEX IF NOT EXISTS "PromotionClaim_userId_idx" ON "PromotionClaim"("userId");
CREATE INDEX IF NOT EXISTS "PromotionClaim_promotionId_idx" ON "PromotionClaim"("promotionId");
CREATE INDEX IF NOT EXISTS "PromotionClaim_claimedAt_idx" ON "PromotionClaim"("claimedAt");

ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "minDepositRequired" DECIMAL(65,30) NOT NULL DEFAULT 0;

ALTER TABLE "PromotionClaim" ADD CONSTRAINT "PromotionClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionClaim" ADD CONSTRAINT "PromotionClaim_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
