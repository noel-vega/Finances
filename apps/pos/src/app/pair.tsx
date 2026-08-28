import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDeviceAuth } from '@/lib/device-auth';

export default function PairScreen() {
  const theme = useTheme();
  const { pair } = useDeviceAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = code.trim().length >= 6 && !busy;

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      await pair(code);
      // on success the root navigator swaps this screen out
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pairing failed');
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Pair this device</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.blurb}>
          Enter the pairing code from your shop dashboard (Settings → POS
          devices).
        </ThemedText>

        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="XXXXXXXX"
          placeholderTextColor={theme.textSecondary}
          maxLength={12}
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
        />

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={[
            styles.button,
            { backgroundColor: theme.text, opacity: canSubmit ? 1 : 0.4 },
          ]}>
          {busy ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText style={[styles.buttonLabel, { color: theme.background }]}>
              Pair
            </ThemedText>
          )}
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    justifyContent: 'center',
  },
  blurb: { marginBottom: Spacing.two },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
  },
  error: { color: '#e5484d' },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
});
