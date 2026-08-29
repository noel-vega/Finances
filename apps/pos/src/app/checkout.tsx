import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Numpad, digitsToCents } from '@/components/numpad';
import { Spacing } from '@/constants/theme';
import { useOrder } from '@/features/order/order-store';
import { useCreateOrder } from '@/features/order/order.queries';
import { useTheme } from '@/hooks/use-theme';
import { formatPriceCents } from '@/lib/format';

type Method = 'cash' | 'card';

export default function CheckoutScreen() {
  const theme = useTheme();
  const { lines, subtotalCents, clear } = useOrder();
  const createOrder = useCreateOrder();

  const [method, setMethod] = useState<Method | null>(null);
  const [digits, setDigits] = useState('');
  const [done, setDone] = useState<{ changeCents: number | null } | null>(null);

  const total = subtotalCents;
  const tendered = digitsToCents(digits);
  const change = tendered - total;

  const onKey = (key: string) => {
    setDigits((prev) => {
      if (key === 'back') return prev.slice(0, -1);
      if (key === 'clear') return '';
      if (prev.length >= 7) return prev;
      return (prev + key).replace(/^0+/, '');
    });
  };

  const complete = async () => {
    try {
      const order = await createOrder.mutateAsync({
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        payment:
          method === 'cash'
            ? { method: 'cash', amountTenderedCents: tendered }
            : { method: 'card' },
      });
      clear();
      setDone({ changeCents: order.changeCents });
    } catch (err) {
      // the order is untouched so they can retry
      Alert.alert(
        'Sale not completed',
        err instanceof Error ? err.message : 'Please try again',
      );
    }
  };

  if (done) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Checkout', headerBackVisible: false }} />
        <SafeAreaView style={styles.done} edges={['bottom']}>
          <ThemedText type="title">Sale complete</ThemedText>
          {done.changeCents != null && done.changeCents > 0 && (
            <ThemedText type="subtitle">
              Change {formatPriceCents(done.changeCents)}
            </ThemedText>
          )}
          <Pressable
            onPress={() => router.dismissAll()}
            style={[styles.primary, { backgroundColor: theme.text }]}>
            <ThemedText style={{ color: theme.background }}>New sale</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (lines.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.done} edges={['bottom']}>
          <ThemedText themeColor="textSecondary">This order is empty.</ThemedText>
          <Pressable
            onPress={() => router.dismissAll()}
            style={[styles.primary, { backgroundColor: theme.text }]}>
            <ThemedText style={{ color: theme.background }}>Back</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const busy = createOrder.isPending;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.body} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.totalBlock}>
            <ThemedText themeColor="textSecondary">Total due</ThemedText>
            <ThemedText type="title">{formatPriceCents(total)}</ThemedText>
          </View>

          {method === null && (
            <View style={styles.methodRow}>
              <Pressable
                onPress={() => setMethod('cash')}
                style={[styles.methodButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="subtitle">Cash</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setMethod('card')}
                style={[styles.methodButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="subtitle">Card</ThemedText>
              </Pressable>
            </View>
          )}

          {method === 'cash' && (
            <View style={styles.cash}>
              <View style={styles.cashRow}>
                <ThemedText themeColor="textSecondary">Received</ThemedText>
                <ThemedText type="subtitle">{formatPriceCents(tendered)}</ThemedText>
              </View>
              <View style={styles.cashRow}>
                <ThemedText themeColor="textSecondary">Change</ThemedText>
                <ThemedText type="subtitle">
                  {change >= 0 ? formatPriceCents(change) : '—'}
                </ThemedText>
              </View>
              <Numpad onKey={onKey} />
            </View>
          )}

          {method === 'card' && (
            <ThemedText themeColor="textSecondary" style={styles.cardNote}>
              Take payment on the card terminal, then complete the sale.
            </ThemedText>
          )}
        </ScrollView>

        {method !== null && (
          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                setMethod(null);
                setDigits('');
              }}
              disabled={busy}
              style={[styles.secondary, { borderColor: theme.backgroundElement }]}>
              <ThemedText themeColor="textSecondary">Back</ThemedText>
            </Pressable>
            <Pressable
              onPress={complete}
              disabled={busy || (method === 'cash' && change < 0)}
              style={[
                styles.primary,
                {
                  backgroundColor:
                    busy || (method === 'cash' && change < 0)
                      ? theme.backgroundSelected
                      : theme.text,
                },
              ]}>
              {busy ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <ThemedText style={{ color: theme.background }}>Complete sale</ThemedText>
              )}
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: Spacing.three },
  scroll: { gap: Spacing.four, paddingVertical: Spacing.four },
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  totalBlock: { alignItems: 'center', gap: Spacing.one },
  methodRow: { flexDirection: 'row', gap: Spacing.three },
  methodButton: {
    flex: 1,
    paddingVertical: Spacing.five,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  cash: { gap: Spacing.three },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNote: { textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  secondary: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  primary: {
    flex: 1,
    minWidth: 160,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
