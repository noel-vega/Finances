import { randomBytes } from 'crypto';

export function generateToken(byteLength: number): string {
  return randomBytes(byteLength).toString('base64url');
}
