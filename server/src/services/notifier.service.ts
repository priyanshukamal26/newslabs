/**
 * notifier.service.ts
 * Formats and dispatches news messages to Telegram and Discord.
 * No scheduling logic here — that lives in scheduler.service.ts.
 */

export interface ArticlePayload {
    id: string;
    title: string;
    link: string;
    source: string;
    topic: string;
}

export type NotificationSlot = 'morning' | 'noon' | 'evening' | 'night' | 'instant';

const SLOT_META: Record<NotificationSlot, { emoji: string; label: string; color: number }> = {
    morning: { emoji: '🌅', label: 'Morning Brief — 6:00 AM IST', color: 0xFFB347 }, // sunrise orange
    noon:    { emoji: '☀️',  label: 'Noon Brief — 2:00 PM IST',   color: 0xFFD700 }, // golden yellow
    evening: { emoji: '🌇', label: 'Evening Brief — 6:00 PM IST', color: 0xFF7043 }, // deep orange
    night:   { emoji: '🌙', label: 'Night Brief — 10:00 PM IST',  color: 0x1A237E }, // midnight blue
    instant: { emoji: '⚡',  label: 'Instant Brief',               color: 0x6366F1 },
};

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const DASHBOARD_URL = process.env.FRONTEND_URL || 'https://newslabs.vercel.app';

// ── Telegram ─────────────────────────────────────────────────────────────────

/** Escape text for Telegram HTML */
function escapeHTML(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function formatTelegramMessage(articles: ArticlePayload[], slot: NotificationSlot): string {
    const { emoji, label } = SLOT_META[slot];
    const header = `${emoji} <b>${escapeHTML(label)}</b>\n${'━'.repeat(32)}\n\n`;

    const lines = articles
        .slice(0, 10)
        .map((a, i) => {
            const num = `${i + 1}.`;
            const title = escapeHTML(a.title || 'Untitled');
            const source = escapeHTML(a.source || 'Unknown');
            const url = a.link ? escapeHTML(a.link) : '';
            return `${num} <a href="${url}">${title}</a> — <i>${source}</i>`;
        })
        .join('\n');

    const footer = `\n\n${'━'.repeat(32)}\n📖 <a href="${escapeHTML(DASHBOARD_URL)}/dashboard">Read full analysis on NewsLabs</a>\n<i>Powered by NewsLabs · Top 10 by reliability</i>`;

    return header + lines + footer;
}

export async function sendTelegram(chatId: string, text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

    const url = `${TELEGRAM_API_BASE}${token}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Telegram API error ${response.status}: ${body}`);
    }
}

// ── Discord ──────────────────────────────────────────────────────────────────

export function formatDiscordEmbed(articles: ArticlePayload[], slot: NotificationSlot) {
    const { emoji, label, color } = SLOT_META[slot];

    const description = articles
        .slice(0, 10)
        .map((a, i) => `**${i + 1}.** [${a.title || 'Untitled'}](${a.link || ''}) — ${a.source || 'Unknown'}`)
        .join('\n');

    return {
        username: 'NewsLabs',
        embeds: [
            {
                title: `${emoji} ${label}`,
                description,
                color,
                footer: {
                    text: 'NewsLabs · Personalized news delivered to you',
                },
                timestamp: new Date().toISOString(),
                url: `${DASHBOARD_URL}/dashboard`,
            },
        ],
    };
}

export async function sendDiscord(webhookUrl: string, articles: ArticlePayload[], slot: NotificationSlot): Promise<void> {
    const payload = formatDiscordEmbed(articles, slot);

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Discord webhook error ${response.status}: ${body}`);
    }
}

// ── Validation ────────────────────────────────────────────────────────────────

/** Validates a Discord webhook URL by sending a test message */
export async function validateDiscordWebhook(webhookUrl: string): Promise<{ ok: boolean; message: string }> {
    try {
        const payload = {
            content: '✅ **NewsLabs** connected successfully! You will start receiving news briefs at your scheduled times.',
        };
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const body = await response.text();
            return { ok: false, message: `Webhook rejected: ${body}` };
        }
        return { ok: true, message: 'Webhook validated and a test message was sent to your channel.' };
    } catch (err: any) {
        return { ok: false, message: err.message || 'Failed to reach Discord webhook' };
    }
}

export const SLOT_META_PUBLIC = SLOT_META;
