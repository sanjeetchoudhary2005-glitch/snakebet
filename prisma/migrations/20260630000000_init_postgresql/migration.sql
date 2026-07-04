-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDeposited" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalWon" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "upiId" TEXT,
    "bankAccount" TEXT,
    "cryptoWallet" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyReward" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "day" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDailyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceBefore" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "gameId" TEXT,
    "roundId" TEXT,
    "method" TEXT,
    "reference" TEXT,
    "reason" TEXT,
    "adminUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashRound" (
    "id" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "crashPoint" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrashRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinesRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "mineCount" INTEGER NOT NULL,
    "minePositions" TEXT NOT NULL,
    "revealedTiles" TEXT NOT NULL DEFAULT '[]',
    "currentMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MinesRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiceRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "target" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "roll" DOUBLE PRECISION NOT NULL,
    "won" BOOLEAN NOT NULL,
    "payout" DECIMAL(65,30) NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiceRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prizePool" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceEntry" (
    "id" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rank" INTEGER,

    CONSTRAINT "RaceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VipProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xpEarned" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentTier" INTEGER NOT NULL DEFAULT 0,
    "unclaimedRakeback" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastRakebackClaimAt" TIMESTAMP(3),

    CONSTRAINT "VipProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLogin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastClaimDate" TIMESTAMP(3) NOT NULL,
    "streakCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DailyLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibleGamingSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "depositLimit" DECIMAL(65,30),
    "sessionLimitMinutes" INTEGER,
    "selfExcludedUntil" TIMESTAMP(3),

    CONSTRAINT "ResponsibleGamingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfExclusion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "until" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelfExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkoRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "rows" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "bucketIndex" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlinkoRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimboRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "targetMultiplier" DOUBLE PRECISION NOT NULL,
    "resultMultiplier" DOUBLE PRECISION NOT NULL,
    "won" BOOLEAN NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimboRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WheelRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "segmentIndex" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WheelRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KenoRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "pickedNumbers" TEXT NOT NULL,
    "drawnNumbers" TEXT NOT NULL,
    "matchCount" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KenoRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiLoRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "deck" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "currentMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiLoRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DragonTowerRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "difficulty" TEXT NOT NULL,
    "levelLayout" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "currentMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DragonTowerRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinFlipRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "choice" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL,
    "payout" DECIMAL(65,30) NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinFlipRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouletteRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "bets" TEXT NOT NULL,
    "result" INTEGER NOT NULL,
    "payout" DECIMAL(65,30) NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouletteRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlackjackRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "deck" TEXT NOT NULL,
    "playerHand" TEXT NOT NULL,
    "dealerHand" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "payout" DECIMAL(65,30) NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackjackRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotsRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "totalWin" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tumbleCount" INTEGER NOT NULL DEFAULT 0,
    "finalMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotsRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AndarBaharRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "side" TEXT NOT NULL,
    "jokerCard" TEXT NOT NULL,
    "dealtCards" TEXT NOT NULL,
    "winningSide" TEXT NOT NULL,
    "matchIndex" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AndarBaharRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaccaratRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "betType" TEXT NOT NULL,
    "playerCards" TEXT NOT NULL,
    "bankerCards" TEXT NOT NULL,
    "playerTotal" INTEGER NOT NULL,
    "bankerTotal" INTEGER NOT NULL,
    "winner" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaccaratRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeenPattiRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "cards" TEXT NOT NULL,
    "handRank" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeenPattiRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "accountDetails" TEXT,
    "status" TEXT NOT NULL,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "betAmount" DOUBLE PRECISION NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "result" TEXT NOT NULL,
    "winAmount" DOUBLE PRECISION NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoMatch" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "betAmount" DECIMAL(65,30) NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 2,
    "winnerId" TEXT,
    "serverSeed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LudoMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LudoPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoMove" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diceValue" INTEGER NOT NULL,
    "fromPos" INTEGER,
    "toPos" INTEGER,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LudoMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "minAmount" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "maxAmount" DECIMAL(65,30) NOT NULL DEFAULT 100000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentAccountId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" TEXT NOT NULL,
    "transactionId" TEXT,
    "screenshotUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSetting" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "houseEdge" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "minBet" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "maxBet" DECIMAL(65,30) NOT NULL DEFAULT 50000,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "matchPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "maxBonus" DECIMAL(65,30) NOT NULL DEFAULT 1000,
    "wageringMultiplier" INTEGER NOT NULL DEFAULT 30,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DragonTigerRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(65,30) NOT NULL,
    "betType" TEXT NOT NULL,
    "dragonCard" TEXT NOT NULL,
    "tigerCard" TEXT NOT NULL,
    "winner" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DragonTigerRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousePool" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "totalLiquidity" DECIMAL(65,30) NOT NULL DEFAULT 1000000.0,
    "baselineLiquidity" DECIMAL(65,30) NOT NULL DEFAULT 1000000.0,
    "currentExposure" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "platformPaused" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RazorpayWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- CreateIndex
CREATE INDEX "User_lastLogin_idx" ON "User"("lastLogin");

-- CreateIndex
CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");

-- CreateIndex
CREATE INDEX "Otp_userId_idx" ON "Otp"("userId");

-- CreateIndex
CREATE INDEX "Otp_otp_idx" ON "Otp"("otp");

-- CreateIndex
CREATE INDEX "Otp_used_idx" ON "Otp"("used");

-- CreateIndex
CREATE INDEX "UserDailyReward_userId_idx" ON "UserDailyReward"("userId");

-- CreateIndex
CREATE INDEX "UserDailyReward_claimedAt_idx" ON "UserDailyReward"("claimedAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_createdAt_idx" ON "Transaction"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_gameId_createdAt_idx" ON "Transaction"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_roundId_idx" ON "Transaction"("roundId");

-- CreateIndex
CREATE INDEX "Transaction_adminUserId_idx" ON "Transaction"("adminUserId");

-- CreateIndex
CREATE INDEX "CrashRound_status_idx" ON "CrashRound"("status");

-- CreateIndex
CREATE INDEX "CrashRound_createdAt_idx" ON "CrashRound"("createdAt");

-- CreateIndex
CREATE INDEX "MinesRound_userId_idx" ON "MinesRound"("userId");

-- CreateIndex
CREATE INDEX "MinesRound_status_idx" ON "MinesRound"("status");

-- CreateIndex
CREATE INDEX "MinesRound_createdAt_idx" ON "MinesRound"("createdAt");

-- CreateIndex
CREATE INDEX "DiceRound_userId_idx" ON "DiceRound"("userId");

-- CreateIndex
CREATE INDEX "DiceRound_createdAt_idx" ON "DiceRound"("createdAt");

-- CreateIndex
CREATE INDEX "Race_startAt_idx" ON "Race"("startAt");

-- CreateIndex
CREATE INDEX "Race_endAt_idx" ON "Race"("endAt");

-- CreateIndex
CREATE INDEX "Race_status_idx" ON "Race"("status");

-- CreateIndex
CREATE INDEX "RaceEntry_userId_idx" ON "RaceEntry"("userId");

-- CreateIndex
CREATE INDEX "RaceEntry_score_idx" ON "RaceEntry"("score");

-- CreateIndex
CREATE UNIQUE INDEX "RaceEntry_raceId_userId_key" ON "RaceEntry"("raceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VipProgress_userId_key" ON "VipProgress"("userId");

-- CreateIndex
CREATE INDEX "VipProgress_currentTier_idx" ON "VipProgress"("currentTier");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLogin_userId_key" ON "DailyLogin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibleGamingSettings_userId_key" ON "ResponsibleGamingSettings"("userId");

-- CreateIndex
CREATE INDEX "SelfExclusion_userId_idx" ON "SelfExclusion"("userId");

-- CreateIndex
CREATE INDEX "SelfExclusion_until_idx" ON "SelfExclusion"("until");

-- CreateIndex
CREATE INDEX "SelfExclusion_createdAt_idx" ON "SelfExclusion"("createdAt");

-- CreateIndex
CREATE INDEX "PlinkoRound_userId_idx" ON "PlinkoRound"("userId");

-- CreateIndex
CREATE INDEX "PlinkoRound_createdAt_idx" ON "PlinkoRound"("createdAt");

-- CreateIndex
CREATE INDEX "LimboRound_userId_idx" ON "LimboRound"("userId");

-- CreateIndex
CREATE INDEX "LimboRound_createdAt_idx" ON "LimboRound"("createdAt");

-- CreateIndex
CREATE INDEX "WheelRound_userId_idx" ON "WheelRound"("userId");

-- CreateIndex
CREATE INDEX "WheelRound_createdAt_idx" ON "WheelRound"("createdAt");

-- CreateIndex
CREATE INDEX "KenoRound_userId_idx" ON "KenoRound"("userId");

-- CreateIndex
CREATE INDEX "KenoRound_createdAt_idx" ON "KenoRound"("createdAt");

-- CreateIndex
CREATE INDEX "HiLoRound_userId_idx" ON "HiLoRound"("userId");

-- CreateIndex
CREATE INDEX "HiLoRound_status_idx" ON "HiLoRound"("status");

-- CreateIndex
CREATE INDEX "HiLoRound_createdAt_idx" ON "HiLoRound"("createdAt");

-- CreateIndex
CREATE INDEX "DragonTowerRound_userId_idx" ON "DragonTowerRound"("userId");

-- CreateIndex
CREATE INDEX "DragonTowerRound_status_idx" ON "DragonTowerRound"("status");

-- CreateIndex
CREATE INDEX "DragonTowerRound_createdAt_idx" ON "DragonTowerRound"("createdAt");

-- CreateIndex
CREATE INDEX "CoinFlipRound_userId_idx" ON "CoinFlipRound"("userId");

-- CreateIndex
CREATE INDEX "CoinFlipRound_createdAt_idx" ON "CoinFlipRound"("createdAt");

-- CreateIndex
CREATE INDEX "RouletteRound_userId_idx" ON "RouletteRound"("userId");

-- CreateIndex
CREATE INDEX "RouletteRound_createdAt_idx" ON "RouletteRound"("createdAt");

-- CreateIndex
CREATE INDEX "BlackjackRound_userId_idx" ON "BlackjackRound"("userId");

-- CreateIndex
CREATE INDEX "BlackjackRound_status_idx" ON "BlackjackRound"("status");

-- CreateIndex
CREATE INDEX "BlackjackRound_createdAt_idx" ON "BlackjackRound"("createdAt");

-- CreateIndex
CREATE INDEX "SlotsRound_userId_idx" ON "SlotsRound"("userId");

-- CreateIndex
CREATE INDEX "SlotsRound_createdAt_idx" ON "SlotsRound"("createdAt");

-- CreateIndex
CREATE INDEX "AndarBaharRound_userId_idx" ON "AndarBaharRound"("userId");

-- CreateIndex
CREATE INDEX "AndarBaharRound_createdAt_idx" ON "AndarBaharRound"("createdAt");

-- CreateIndex
CREATE INDEX "BaccaratRound_userId_idx" ON "BaccaratRound"("userId");

-- CreateIndex
CREATE INDEX "BaccaratRound_createdAt_idx" ON "BaccaratRound"("createdAt");

-- CreateIndex
CREATE INDEX "TeenPattiRound_userId_idx" ON "TeenPattiRound"("userId");

-- CreateIndex
CREATE INDEX "TeenPattiRound_createdAt_idx" ON "TeenPattiRound"("createdAt");

-- CreateIndex
CREATE INDEX "WithdrawRequest_userId_idx" ON "WithdrawRequest"("userId");

-- CreateIndex
CREATE INDEX "WithdrawRequest_status_idx" ON "WithdrawRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawRequest_createdAt_idx" ON "WithdrawRequest"("createdAt");

-- CreateIndex
CREATE INDEX "WithdrawRequest_userId_status_idx" ON "WithdrawRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "Game_userId_idx" ON "Game"("userId");

-- CreateIndex
CREATE INDEX "Game_createdAt_idx" ON "Game"("createdAt");

-- CreateIndex
CREATE INDEX "Game_userId_createdAt_idx" ON "Game"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Game_type_createdAt_idx" ON "Game"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Game_result_createdAt_idx" ON "Game"("result", "createdAt");

-- CreateIndex
CREATE INDEX "LudoMatch_status_idx" ON "LudoMatch"("status");

-- CreateIndex
CREATE INDEX "LudoMatch_createdAt_idx" ON "LudoMatch"("createdAt");

-- CreateIndex
CREATE INDEX "LudoMatch_winnerId_idx" ON "LudoMatch"("winnerId");

-- CreateIndex
CREATE INDEX "LudoPlayer_matchId_idx" ON "LudoPlayer"("matchId");

-- CreateIndex
CREATE INDEX "LudoPlayer_userId_idx" ON "LudoPlayer"("userId");

-- CreateIndex
CREATE INDEX "LudoMove_matchId_idx" ON "LudoMove"("matchId");

-- CreateIndex
CREATE INDEX "LudoMove_userId_idx" ON "LudoMove"("userId");

-- CreateIndex
CREATE INDEX "LudoMove_createdAt_idx" ON "LudoMove"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_event_idx" ON "SecurityLog"("event");

-- CreateIndex
CREATE INDEX "AdminLog_adminId_idx" ON "AdminLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");

-- CreateIndex
CREATE INDEX "AdminLog_targetId_idx" ON "AdminLog"("targetId");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentAccount_type_idx" ON "PaymentAccount"("type");

-- CreateIndex
CREATE INDEX "PaymentAccount_isActive_idx" ON "PaymentAccount"("isActive");

-- CreateIndex
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");

-- CreateIndex
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");

-- CreateIndex
CREATE INDEX "DepositRequest_createdAt_idx" ON "DepositRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameSetting_game_key" ON "GameSetting"("game");

-- CreateIndex
CREATE INDEX "DragonTigerRound_userId_idx" ON "DragonTigerRound"("userId");

-- CreateIndex
CREATE INDEX "DragonTigerRound_createdAt_idx" ON "DragonTigerRound"("createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RazorpayWebhookEvent_eventId_key" ON "RazorpayWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "RazorpayWebhookEvent_eventType_idx" ON "RazorpayWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "RazorpayWebhookEvent_status_idx" ON "RazorpayWebhookEvent"("status");

-- CreateIndex
CREATE INDEX "RazorpayWebhookEvent_processedAt_idx" ON "RazorpayWebhookEvent"("processedAt");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyReward" ADD CONSTRAINT "UserDailyReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceEntry" ADD CONSTRAINT "RaceEntry_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceEntry" ADD CONSTRAINT "RaceEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipProgress" ADD CONSTRAINT "VipProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLogin" ADD CONSTRAINT "DailyLogin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibleGamingSettings" ADD CONSTRAINT "ResponsibleGamingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfExclusion" ADD CONSTRAINT "SelfExclusion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LudoPlayer" ADD CONSTRAINT "LudoPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "LudoMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LudoPlayer" ADD CONSTRAINT "LudoPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LudoMove" ADD CONSTRAINT "LudoMove_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "LudoMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LudoMove" ADD CONSTRAINT "LudoMove_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
