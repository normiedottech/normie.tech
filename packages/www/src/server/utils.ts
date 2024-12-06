import crypto from 'crypto';
export function generateAPIKey(size = 32) {
    const buffer = crypto.randomBytes(size);
    return buffer.toString('base64');
}