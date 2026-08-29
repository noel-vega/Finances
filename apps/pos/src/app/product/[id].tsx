import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProduct } from '@/features/catalog/catalog.queries';
import { useOrder } from '@/features/order/order-store';
import { useTheme } from '@/hooks/use-theme';
import { formatPriceCents } from '@/lib/format';
import { variantLabel } from '@/lib/variant';

export default function ProductScreen() {
  const theme = useTheme();
  const { addVariant } = useOrder();
  const params = useLocalSearchParams<{ id: string; variantId?: string }>();
  const productId = Number(params.id);

  const query = useProduct(productId);
  const product = query.data;

  const [selectedId, setSelectedId] = useState<number | null>(
    params.variantId ? Number(params.variantId) : null,
  );

  if (query.isLoading && !product) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary">Product not found.</ThemedText>
      </ThemedView>
    );
  }

  const selected =
    product.variants.find((v) => v.id === selectedId) ?? product.variants[0];
  const heroUrl = selected?.imageUrl ?? product.images[0]?.url ?? null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        {heroUrl ? (
          <Image source={{ uri: heroUrl }} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, { backgroundColor: theme.backgroundElement }]} />
        )}

        <ThemedText type="title">{product.name}</ThemedText>
        {product.description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {product.description}
          </ThemedText>
        ) : null}

        {selected ? (
          <ThemedText type="subtitle">
            {formatPriceCents(selected.priceCents)}
            {'  ·  '}
            {selected.stock > 0 ? `${selected.stock} in stock` : 'Out of stock'}
          </ThemedText>
        ) : null}

        <View style={styles.variantList}>
          {product.variants.map((variant) => {
            const active = variant.id === selected?.id;
            return (
              <Pressable
                key={variant.id}
                onPress={() => setSelectedId(variant.id)}
                style={[
                  styles.variantChip,
                  {
                    backgroundColor: active
                      ? theme.backgroundSelected
                      : theme.backgroundElement,
                  },
                ]}>
                <ThemedText type="small">{variantLabel(variant)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatPriceCents(variant.priceCents)} · {variant.stock}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {selected ? (
          <Pressable
            onPress={() => {
              addVariant(product, selected.id);
              router.back();
            }}
            style={[styles.addButton, { backgroundColor: theme.text }]}>
            <ThemedText style={{ color: theme.background }}>
              Add to order · {formatPriceCents(selected.priceCents)}
            </ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three },
  hero: { width: '100%', aspectRatio: 1, borderRadius: Spacing.two },
  variantList: { gap: Spacing.two },
  addButton: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  variantChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
});
