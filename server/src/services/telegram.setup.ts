/**
 * telegram.setup.ts
 * Handles the Telegram bot /start token flow so users can connect
 * their chat ID to their NewsLabs account without pasting it manually.
 *
 * Flow:
 *  1. User clicks "Connect Telegram" in the dashboard.
 *  2. Backend generates a short-lived token (UUID), stores userId → token in-memory.
 *  3. Returns a deep link: https://t.me/<BotUsername>?start=<token>
 *  4. User taps the link → Telegram opens the bot → bot receives /start <token>
 *  5. Telegram sends an update to our webhook endpoint.
 *  6. We match the token → find userId → save chatId → mark as connected.
 */

import { v4 as uuidv4 } from 'uuid';

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface PendingToken {
    userId: string;
    expiresAt: number;
}

// In-memory store: token → { userId, expiresAt }
const pendingTokens = new Map<string, PendingToken>();

// Periodic cleanup of expired tokens (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [token, entry] of pendingTokens.entries()) {
        if (entry.expiresAt < now) pendingTokens.delete(token);
    }
}, 5 * 60 * 1000);

export function generateConnectToken(userId: string): string {
    // Revoke any existing token for this user
    for (const [token, entry] of pendingTokens.entries()) {
        if (entry.userId === userId) pendingTokens.delete(token);
    }

    const token = uuidv4().replace(/-/g, '').slice(0, 20); // 20-char alphanumeric
    pendingTokens.set(token, { userId, expiresAt: Date.now() + TOKEN_TTL_MS });
    return token;
}

export function resolveToken(token: string): string | null {
    const entry = pendingTokens.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
        pendingTokens.delete(token);
        return null;
    }
    pendingTokens.delete(token); // one-time use
    return entry.userId;
}

export function getBotUsername(): string {
    // Derive from token if bot username env var is set, otherwise generic
    return process.env.TELEGRAM_BOT_USERNAME || 'NewsLabsBot';
}
