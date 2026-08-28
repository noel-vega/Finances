import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProduct } from '@/features/catalog/catalog.queries';
import { useTheme } from '@/hooks/use-theme';
import { formatPriceCents } from '@/lib/format';
import type { PosCatalogVariant } from 'pos-sdk';

function variantLabel(variant: PosCatalogVariant): string {
  if (variant.optionValues.length === 0) return variant.sku ?? 'Default';
  return variant.optionValues.map((ov) => ov.value).join(' / ');
}

export default function ProductScreen() {
  const theme = useTheme();
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
  variantChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
});
