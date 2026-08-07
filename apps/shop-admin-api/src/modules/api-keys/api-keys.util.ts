import { randomBytes } from 'crypto';

export function generateApiKey(): string {
  return `sfk_${randomBytes(24).toString('base64url')}`;
}
