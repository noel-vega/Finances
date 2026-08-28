import { PosClient } from 'pos-sdk';

// EXPO_PUBLIC_ vars are inlined at build time. 10.0.2.2 is the Android
// emulator's alias for the host machine's localhost.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:3004';

// the device token lives in expo-secure-store; device-auth.tsx keeps this
// mirror in sync so the client's per-request header read stays synchronous
let currentToken: string | undefined;

export function setPosToken(token: string | undefined) {
  currentToken = token;
}

export const posApi = new PosClient(BASE_URL, () => currentToken);
