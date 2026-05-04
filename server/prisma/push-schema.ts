/**
 * Manual schema push script — bypasses Prisma's migration engine
 * which hangs on PgBouncer transaction pooler connections.
 * 
 * This creates all tables defined in schema.prisma using raw SQL
 * executed through PrismaClient (which works fine on the pooler).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔌 Connecting to database...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection verified.\n');

    // Check which tables already exist
    const existingTables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    const existing = new Set(existingTables.map(t => t.tablename));
    console.log('📋 Existing tables:', [...existing].join(', ') || '(none)');

    // ─── User ────────────────────────────────────────────
    if (!existing.has('User')) {
        console.log('\n🆕 Creating table: User');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "User" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "email" TEXT NOT NULL,
                "password" TEXT NOT NULL,
                "name" TEXT,
                "phone" TEXT,
                "avatarUrl" TEXT,
                "darkMode" BOOLEAN NOT NULL DEFAULT true,
                "aiProvider" TEXT NOT NULL DEFAULT 'hybrid',
                "summaryMode" TEXT NOT NULL DEFAULT 'balanced',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "topics" TEXT NOT NULL DEFAULT '[]',
                "totalReads" INTEGER NOT NULL DEFAULT 0,
                "totalReadTime" INTEGER NOT NULL DEFAULT 0,
                "loginDays" INTEGER NOT NULL DEFAULT 0,
                "lastLoginDate" TEXT NOT NULL DEFAULT '',
                "currentStreak" INTEGER NOT NULL DEFAULT 0,
                "longestStreak" INTEGER NOT NULL DEFAULT 0,
                "lastStreakDate" TEXT NOT NULL DEFAULT '',
                CONSTRAINT "User_pkey" PRIMARY KEY ("id")
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`);
        console.log('   ✅ User table created');
    } else {
        console.log('\n⏭️  User table already exists');
    }

    // ─── Feed ────────────────────────────────────────────
    if (!existing.has('Feed')) {
        console.log('\n🆕 Creating table: Feed');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "Feed" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "url" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "lastFetched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                CONSTRAINT "Feed_pkey" PRIMARY KEY ("id")
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Feed_url_key" ON "Feed"("url")`);
        console.log('   ✅ Feed table created');
    } else {
        console.log('\n⏭️  Feed table already exists');
    }

    // ─── UserFeed ────────────────────────────────────────
    if (!existing.has('UserFeed')) {
        console.log('\n🆕 Creating table: UserFeed');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "UserFeed" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "userId" TEXT NOT NULL,
                "url" TEXT NOT NULL,
                "displayName" TEXT NOT NULL,
                "category" TEXT,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UserFeed_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "UserFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "UserFeed_userId_url_key" ON "UserFeed"("userId", "url")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX "UserFeed_userId_isActive_idx" ON "UserFeed"("userId", "isActive")`);
        console.log('   ✅ UserFeed table created');
    } else {
        console.log('\n⏭️  UserFeed table already exists');
    }

    // ─── UserApiCredential ───────────────────────────────
    if (!existing.has('UserApiCredential')) {
        console.log('\n🆕 Creating table: UserApiCredential');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "UserApiCredential" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
                CONSTRAINT "UserApiCredential_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "UserApiCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE INDEX "UserApiCredential_userId_isActive_idx" ON "UserApiCredential"("userId", "isActive")`);
        console.log('   ✅ UserApiCredential table created');
    } else {
        console.log('\n⏭️  UserApiCredential table already exists');
    }

    // ─── UserAiPreference ────────────────────────────────
    if (!existing.has('UserAiPreference')) {
        console.log('\n🆕 Creating table: UserAiPreference');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "UserAiPreference" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "userId" TEXT NOT NULL,
                "byokEnabled" BOOLEAN NOT NULL DEFAULT false,
                "activeCredentialId" TEXT,
                "timeoutSeconds" INTEGER NOT NULL DEFAULT 30,
                "timeoutDisabled" BOOLEAN NOT NULL DEFAULT false,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "UserAiPreference_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "UserAiPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "UserAiPreference_activeCredentialId_fkey" FOREIGN KEY ("activeCredentialId") REFERENCES "UserApiCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "UserAiPreference_userId_key" ON "UserAiPreference"("userId")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX "UserAiPreference_userId_byokEnabled_idx" ON "UserAiPreference"("userId", "byokEnabled")`);
        console.log('   ✅ UserAiPreference table created');
    } else {
        console.log('\n⏭️  UserAiPreference table already exists');
    }

    // ─── SavedArticle ────────────────────────────────────
    if (!existing.has('SavedArticle')) {
        console.log('\n🆕 Creating table: SavedArticle');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "SavedArticle" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "userId" TEXT NOT NULL,
                "articleId" TEXT NOT NULL,
                "title" TEXT NOT NULL DEFAULT '',
                "source" TEXT NOT NULL DEFAULT '',
                "topic" TEXT NOT NULL DEFAULT '',
                "link" TEXT NOT NULL DEFAULT '',
                "summary" TEXT NOT NULL DEFAULT '',
                "timeToRead" TEXT NOT NULL DEFAULT '',
                "pubDate" TEXT NOT NULL DEFAULT '',
                "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "SavedArticle_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "SavedArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "SavedArticle_userId_articleId_key" ON "SavedArticle"("userId", "articleId")`);
        console.log('   ✅ SavedArticle table created');
    } else {
        console.log('\n⏭️  SavedArticle table already exists');
    }

    // ─── LikedArticle ────────────────────────────────────
    if (!existing.has('LikedArticle')) {
        console.log('\n🆕 Creating table: LikedArticle');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "LikedArticle" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "userId" TEXT NOT NULL,
                "articleId" TEXT NOT NULL,
                "title" TEXT NOT NULL DEFAULT '',
                "source" TEXT NOT NULL DEFAULT '',
                "topic" TEXT NOT NULL DEFAULT '',
                "link" TEXT NOT NULL DEFAULT '',
                "summary" TEXT NOT NULL DEFAULT '',
                "timeToRead" TEXT NOT NULL DEFAULT '',
                "pubDate" TEXT NOT NULL DEFAULT '',
                "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "LikedArticle_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "LikedArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "LikedArticle_userId_articleId_key" ON "LikedArticle"("userId", "articleId")`);
        console.log('   ✅ LikedArticle table created');
    } else {
        console.log('\n⏭️  LikedArticle table already exists');
    }

    // ─── ReadHistory ─────────────────────────────────────
    if (!existing.has('ReadHistory')) {
        console.log('\n🆕 Creating table: ReadHistory');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "ReadHistory" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "userId" TEXT NOT NULL,
                "articleId" TEXT NOT NULL,
                "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "timeSpent" INTEGER NOT NULL DEFAULT 0,
                "estimatedReadSecs" INTEGER NOT NULL DEFAULT 0,
                "sentiment" TEXT NOT NULL DEFAULT '',
                "source" TEXT NOT NULL DEFAULT '',
                "topic" TEXT NOT NULL DEFAULT '',
                "title" TEXT NOT NULL DEFAULT '',
                "link" TEXT NOT NULL DEFAULT '',
                CONSTRAINT "ReadHistory_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "ReadHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "ReadHistory_userId_articleId_key" ON "ReadHistory"("userId", "articleId")`);
        console.log('   ✅ ReadHistory table created');
    } else {
        console.log('\n⏭️  ReadHistory table already exists');
    }

    // ─── Notification ────────────────────────────────────
    if (!existing.has('Notification')) {
        console.log('\n🆕 Creating table: Notification');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "Notification" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "userId" TEXT NOT NULL,
                "title" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "read" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `);
        console.log('   ✅ Notification table created');
    } else {
        console.log('\n⏭️  Notification table already exists');
    }

    // ─── UserNotificationSettings ────────────────────────
    if (!existing.has('UserNotificationSettings')) {
        console.log('\n🆕 Creating table: UserNotificationSettings');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "UserNotificationSettings" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "userId" TEXT NOT NULL,
                "telegramChatId" TEXT,
                "telegramUserId" TEXT,
                "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
                "telegramConnectToken" TEXT,
                "telegramConnectExpiresAt" TIMESTAMP(3),
                "discordWebhookUrl" TEXT,
                "discordEnabled" BOOLEAN NOT NULL DEFAULT false,
                "activeSlots" TEXT NOT NULL DEFAULT '[]',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "UserNotificationSettings_userId_key" ON "UserNotificationSettings"("userId")`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "UserNotificationSettings_telegramConnectToken_key" ON "UserNotificationSettings"("telegramConnectToken")`);
        console.log('   ✅ UserNotificationSettings table created');
    } else {
        console.log('\n⏭️  UserNotificationSettings table already exists');
    }

    // ─── NotificationLog ─────────────────────────────────
    if (!existing.has('NotificationLog')) {
        console.log('\n🆕 Creating table: NotificationLog');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "NotificationLog" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "settingsId" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "platform" TEXT NOT NULL,
                "slot" TEXT NOT NULL,
                "slotLabel" TEXT NOT NULL,
                "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "articleIds" TEXT NOT NULL,
                "articleTitles" TEXT NOT NULL,
                "articleLinks" TEXT NOT NULL,
                "articleSources" TEXT NOT NULL,
                "articleTopics" TEXT NOT NULL,
                "selectionReason" TEXT NOT NULL,
                "success" BOOLEAN NOT NULL,
                "errorMessage" TEXT,
                CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "NotificationLog_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserNotificationSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);
        console.log('   ✅ NotificationLog table created');
    } else {
        console.log('\n⏭️  NotificationLog table already exists');
    }

    // ─── Trend ───────────────────────────────────────────
    if (!existing.has('Trend')) {
        console.log('\n🆕 Creating table: Trend');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "Trend" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
                "topic" TEXT NOT NULL,
                "score" DOUBLE PRECISION NOT NULL,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
            )
        `);
        console.log('   ✅ Trend table created');
    } else {
        console.log('\n⏭️  Trend table already exists');
    }

    // Final verification
    console.log('\n─── Final Verification ───');
    const finalTables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    console.log('📋 All tables:', finalTables.map(t => t.tablename).join(', '));
    console.log('\n🎉 Schema push complete!');
}

main()
    .catch(e => {
        console.error('❌ Schema push failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
