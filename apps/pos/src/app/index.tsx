import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/catalog.queries';
import { useTheme } from '@/hooks/use-theme';
import { useDeviceAuth } from '@/lib/device-auth';
import { formatPriceRange } from '@/lib/format';
import type { PosCatalogProduct } from 'pos-sdk';

function priceRange(product: PosCatalogProduct): string | null {
  const prices = product.variants.map((v) => v.priceCents);
  if (prices.length === 0) return null;
  return formatPriceRange(Math.min(...prices), Math.max(...prices));
}

function totalStock(product: PosCatalogProduct): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export default function CatalogScreen() {
  const theme = useTheme();
  const { session } = useDeviceAuth();
  const [search, setSearch] = useState('');
  const query = useCatalog(search);

  const products = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title">Catalog</ThemedText>
            {session ? (
              <ThemedText type="small" themeColor="textSecondary">
                {session.accountName} · {session.locationName}
              </ThemedText>
            ) : null}
          </View>
          <Link href="/scan" asChild>
            <Pressable
              style={[styles.scanButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText>Scan</ThemedText>
            </Pressable>
          </Link>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, SKU, or barcode"
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          style={[
            styles.search,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
        />

        {query.isLoading ? (
          <ActivityIndicator style={styles.spinner} />
        ) : query.isError ? (
          <ThemedText style={styles.message}>
            Couldn&apos;t load the catalog. Pull to retry.
          </ThemedText>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) {
                void query.fetchNextPage();
              }
            }}
            ListEmptyComponent={
              <ThemedText style={styles.message} themeColor="textSecondary">
                No products found.
              </ThemedText>
            }
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator style={styles.spinner} />
              ) : null
            }
            renderItem={({ item }) => {
              const stock = totalStock(item);
              return (
                <Link href={{ pathname: '/product/[id]', params: { id: item.id } }} asChild>
                  <Pressable
                    style={[styles.row, { borderBottomColor: theme.backgroundElement }]}>
                    {item.images[0]?.url ? (
                      <Image
                        source={{ uri: item.images[0].url }}
                        style={styles.thumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[styles.thumb, { backgroundColor: theme.backgroundElement }]}
                      />
                    )}
                    <View style={styles.rowBody}>
                      <ThemedText numberOfLines={1}>{item.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {priceRange(item) ?? 'No price'}
                        {'  ·  '}
                        {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                      </ThemedText>
                    </View>
                  </Pressable>
                </Link>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  scanButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  search: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  listContent: { paddingBottom: Spacing.five },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 56, height: 56, borderRadius: Spacing.one },
  rowBody: { flex: 1, gap: 2 },
  spinner: { marginVertical: Spacing.four },
  message: { textAlign: 'center', marginVertical: Spacing.five },
});
