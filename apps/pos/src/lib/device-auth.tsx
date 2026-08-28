import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { PairingResult, PosSession } from 'pos-sdk';

import { posApi, setPosToken } from './pos-api';

const TOKEN_KEY = 'pos_device_token';
const SESSION_KEY = 'pos_device_session';

type StoredSession = Pick<
  PairingResult,
  'accountId' | 'accountName' | 'locationId' | 'locationName' | 'deviceName'
>;

type DeviceAuthState =
  | { status: 'loading'; session: null }
  | { status: 'unpaired'; session: null }
  | { status: 'paired'; session: StoredSession };

type DeviceAuthContextValue = DeviceAuthState & {
  pair: (pairingCode: string) => Promise<void>;
  unpair: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const DeviceAuthContext = createContext<DeviceAuthContextValue | null>(null);

export function DeviceAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DeviceAuthState>({
    status: 'loading',
    session: null,
  });

  // restore a previously paired device on cold start
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, sessionJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(SESSION_KEY),
      ]);
      if (cancelled) return;
      if (token && sessionJson) {
        setPosToken(token);
        setState({
          status: 'paired',
          session: JSON.parse(sessionJson) as StoredSession,
        });
      } else {
        setState({ status: 'unpaired', session: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (token: string, session: StoredSession) => {
    setPosToken(token);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session)),
    ]);
    setState({ status: 'paired', session });
  }, []);

  const pair = useCallback(
    async (pairingCode: string) => {
      const result: PairingResult | undefined = await posApi.pair(
        pairingCode.trim(),
      );
      if (!result?.token) {
        throw new Error('That pairing code was not accepted.');
      }
      const { token, ...session } = result;
      await persist(token, session);
    },
    [persist],
  );

  const unpair = useCallback(async () => {
    setPosToken(undefined);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(SESSION_KEY),
    ]);
    setState({ status: 'unpaired', session: null });
  }, []);

  const refreshSession = useCallback(async () => {
    const fresh: PosSession | undefined = await posApi.session();
    if (!fresh) return;
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(fresh));
    setState({ status: 'paired', session: fresh });
  }, []);

  const value = useMemo<DeviceAuthContextValue>(
    () => ({ ...state, pair, unpair, refreshSession }),
    [state, pair, unpair, refreshSession],
  );

  return <DeviceAuthContext value={value}>{children}</DeviceAuthContext>;
}

export function useDeviceAuth(): DeviceAuthContextValue {
  const ctx = use(DeviceAuthContext);
  if (!ctx) {
    throw new Error('useDeviceAuth must be used within a DeviceAuthProvider');
  }
  return ctx;
}
