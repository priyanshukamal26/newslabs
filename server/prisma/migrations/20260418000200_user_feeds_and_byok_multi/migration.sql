-- CreateTable
CREATE TABLE "UserFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApiCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "baseUrl" TEXT,
    "encryptedApiKey" TEXT NOT NULL,
    "apiKeyMask" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastValidatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAiPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "byokEnabled" BOOLEAN NOT NULL DEFAULT false,
    "activeCredentialId" TEXT,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 30,
    "timeoutDisabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAiPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFeed_userId_url_key" ON "UserFeed"("userId", "url");

-- CreateIndex
CREATE INDEX "UserFeed_userId_isActive_idx" ON "UserFeed"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserApiCredential_userId_isActive_idx" ON "UserApiCredential"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserAiPreference_userId_key" ON "UserAiPreference"("userId");

-- CreateIndex
CREATE INDEX "UserAiPreference_userId_byokEnabled_idx" ON "UserAiPreference"("userId", "byokEnabled");

-- AddForeignKey
ALTER TABLE "UserFeed" ADD CONSTRAINT "UserFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApiCredential" ADD CONSTRAINT "UserApiCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAiPreference" ADD CONSTRAINT "UserAiPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAiPreference" ADD CONSTRAINT "UserAiPreference_activeCredentialId_fkey" FOREIGN KEY ("activeCredentialId") REFERENCES "UserApiCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
