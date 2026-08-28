import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { posApi } from '@/lib/pos-api';

export default function ScanScreen() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<'scanning' | 'looking-up' | 'miss'>(
    'scanning',
  );
  const lockRef = useRef(false);

  const onBarcode = useCallback(async (value: string) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setStatus('looking-up');
    try {
      const result = await posApi.catalog.scan(value);
      if (result) {
        router.replace({
          pathname: '/product/[id]',
          params: { id: result.product.id, variantId: result.variantId },
        });
        return;
      }
      setStatus('miss');
    } catch {
      setStatus('miss');
    }
    // allow another attempt after a short beat
    setTimeout(() => {
      lockRef.current = false;
      setStatus('scanning');
    }, 1500);
  }, []);

  if (!permission) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Scan' }} />
        <ThemedText style={styles.blurb}>
          Camera access is needed to scan barcodes.
        </ThemedText>
        <Pressable
          onPress={requestPermission}
          style={[styles.button, { backgroundColor: theme.text }]}>
          <ThemedText style={{ color: theme.background }}>
            Grant permission
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Scan' }} />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={
          status === 'scanning'
            ? ({ data }) => {
                void onBarcode(data);
              }
            : undefined
        }
      />
      <SafeAreaView style={styles.overlay} pointerEvents="none">
        <View style={styles.reticle} />
        {status === 'looking-up' ? (
          <ThemedText style={styles.status}>Looking up…</ThemedText>
        ) : status === 'miss' ? (
          <ThemedText style={styles.status}>No match — try again</ThemedText>
        ) : (
          <ThemedText style={styles.status}>Point at a barcode</ThemedText>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  blurb: { textAlign: 'center' },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  reticle: {
    width: 240,
    height: 160,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: Spacing.two,
  },
  status: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
});
