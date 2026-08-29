import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

// digits accumulate from the right as cents: "1" -> $0.01, "125" -> $1.25
export function digitsToCents(digits: string): number {
  return digits === '' ? 0 : parseInt(digits, 10);
}

export function Numpad({ onKey }: { onKey: (key: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => onKey(key)}
          style={[styles.key, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="subtitle">
            {key === 'back' ? '⌫' : key === 'clear' ? 'C' : key}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  key: {
    width: '31%',
    flexGrow: 1,
    aspectRatio: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
});
