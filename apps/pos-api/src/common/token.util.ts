import { randomBytes } from 'node:crypto';

// long-lived device credential — sent on every request as x-pos-device-token,
// stored plaintext and looked up by exact match (it identifies a device, not
// a person)
export function generateDeviceToken(): string {
  return `pos_${randomBytes(24).toString('base64url')}`;
}
