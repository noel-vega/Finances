import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useOrder } from '@/features/order/order-store';
import { useTheme } from '@/hooks/use-theme';
import { posApi } from '@/lib/pos-api';

type ScanStatus =
  | { kind: 'scanning' }
  | { kind: 'looking-up' }
  | { kind: 'added'; name: string }
  | { kind: 'miss' };

export default function ScanScreen() {
  const theme = useTheme();
  const { addVariant } = useOrder();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>({ kind: 'scanning' });
  const lockRef = useRef(false);
  // USB/Bluetooth scanner guns act as a keyboard: they type the code and send
  // Enter. This hidden, always-focused input captures that as a submit.
  const wedgeRef = useRef<TextInput>(null);
  const [wedge, setWedge] = useState('');

  const onBarcode = useCallback(
    async (value: string) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setStatus({ kind: 'looking-up' });
      try {
        const result = await posApi.catalog.scan(value);
        if (result) {
          addVariant(result.product, result.variantId);
          setStatus({ kind: 'added', name: result.product.name });
        } else {
          setStatus({ kind: 'miss' });
        }
      } catch {
        setStatus({ kind: 'miss' });
      }
      // re-arm for the next scan
      setTimeout(() => {
        lockRef.current = false;
        setStatus({ kind: 'scanning' });
      }, 1200);
    },
    [addVariant],
  );

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
    <Pressable style={styles.container} onPress={() => wedgeRef.current?.focus()}>
      <Stack.Screen options={{ title: 'Scan' }} />
      <TextInput
        ref={wedgeRef}
        style={styles.wedge}
        autoFocus
        submitBehavior="submit"
        caretHidden
        contextMenuHidden
        showSoftInputOnFocus={false}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        value={wedge}
        onChangeText={setWedge}
        onSubmitEditing={({ nativeEvent }) => {
          const code = nativeEvent.text.trim();
          setWedge('');
          if (code) void onBarcode(code);
        }}
      />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={
          status.kind === 'scanning'
            ? ({ data }) => {
                void onBarcode(data);
              }
            : undefined
        }
      />
      <SafeAreaView style={styles.overlay} pointerEvents="none">
        <View style={styles.reticle} />
        {status.kind === 'looking-up' ? (
          <ThemedText style={styles.status}>Looking up…</ThemedText>
        ) : status.kind === 'added' ? (
          <ThemedText style={styles.status}>Added · {status.name}</ThemedText>
        ) : status.kind === 'miss' ? (
          <ThemedText style={styles.status}>No match — try again</ThemedText>
        ) : (
          <ThemedText style={styles.status}>
            Point at a barcode or use a USB scanner
          </ThemedText>
        )}
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  // off-screen: focusable (captures scanner-gun keystrokes) but not visible
  wedge: { position: 'absolute', width: 1, height: 1, opacity: 0 },
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
