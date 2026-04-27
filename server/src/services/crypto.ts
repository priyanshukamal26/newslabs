import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getSecretKey(): Buffer {
    const secret = process.env.ENCRYPTION_SECRET || '';
    if (!secret) {
        throw new Error('ENCRYPTION_SECRET is required for API key encryption.');
    }
    return crypto.createHash('sha256').update(secret).digest();
}

export function encryptText(plainText: string): string {
    const key = getSecretKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, key, iv);

    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptText(cipherText: string): string {
    const key = getSecretKey();
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted payload format.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

export function maskKey(value: string): string {
    if (!value) return '';
    const suffix = value.slice(-4);
    const prefix = value.slice(0, 3);
    return `${prefix}...${suffix}`;
}
