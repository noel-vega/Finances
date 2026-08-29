import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { DeviceAuthProvider, useDeviceAuth } from '@/lib/device-auth';
import { OrderProvider } from '@/features/order/order-store';
import { asyncStoragePersister, queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useDeviceAuth();

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  const paired = status === 'paired';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={paired}>
        <Stack.Screen name="index" />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen
          name="scan"
          options={{ presentation: 'modal', headerShown: true, title: 'Scan' }}
        />
        <Stack.Screen
          name="checkout"
          options={{ presentation: 'modal', headerShown: true, title: 'Checkout' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!paired}>
        <Stack.Screen name="pair" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}>
      <DeviceAuthProvider>
        <OrderProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
          </ThemeProvider>
        </OrderProvider>
      </DeviceAuthProvider>
    </PersistQueryClientProvider>
  );
}
