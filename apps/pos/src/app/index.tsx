import { Image } from 'expo-image';
import { Link, router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarcodeWedge } from '@/components/barcode-wedge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/catalog.queries';
import { useOrder, type OrderLine } from '@/features/order/order-store';
import { useOrderScanner } from '@/features/order/use-order-scanner';
import { useTheme } from '@/hooks/use-theme';
import { formatPriceCents, formatPriceRange } from '@/lib/format';
import type { PosCatalogProduct } from 'pos-sdk';

function priceLabel(product: PosCatalogProduct): string {
  const prices = product.variants.map((v) => v.priceCents);
  if (prices.length === 0) return 'No price';
  return formatPriceRange(Math.min(...prices), Math.max(...prices));
}

export default function OrderScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { lines, subtotalCents, itemCount, addVariant, setQty, removeLine, clear } =
    useOrder();
  const { scan, status } = useOrderScanner();

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const query = useCatalog(search);
  const products = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const ticketWidth = Math.min(Math.max(width * 0.36, 300), 420);
  const columns = Math.max(1, Math.floor((width - ticketWidth - Spacing.three * 2) / 170));

  const onProductPress = (product: PosCatalogProduct) => {
    if (product.variants.length === 1) {
      addVariant(product, product.variants[0].id);
      return;
    }
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* a scanner gun scans straight into the order — no camera. paused while
          the cashier is typing in the search box so it doesn't steal focus */}
      <BarcodeWedge onScan={scan} enabled={!searchFocused} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.split}>
          {/* left — product grid */}
          <View style={styles.catalogPane}>
            <View style={styles.catalogHeader}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search name, SKU, or barcode"
                placeholderTextColor={theme.textSecondary}
                autoCorrect={false}
                style={[
                  styles.search,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
              <Link href="/scan" asChild>
                <Pressable
                  style={StyleSheet.flatten([
                    styles.cameraButton,
                    { backgroundColor: theme.backgroundElement },
                  ])}>
                  <ThemedText>Camera</ThemedText>
                </Pressable>
              </Link>
            </View>

            {query.isLoading ? (
              <ActivityIndicator style={styles.spinner} />
            ) : query.isError ? (
              <ThemedText style={styles.message} themeColor="textSecondary">
                Couldn&apos;t load the catalog. Pull to retry.
              </ThemedText>
            ) : (
              <FlatList
                key={columns}
                style={styles.fill}
                data={products}
                numColumns={columns}
                keyExtractor={(item) => String(item.id)}
                columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
                contentContainerStyle={styles.gridContent}
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
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    single={columns === 1}
                    onPress={() => onProductPress(item)}
                    priceLabel={priceLabel(item)}
                  />
                )}
              />
            )}
          </View>

          {/* right — current order */}
          <View
            style={[
              styles.ticketPane,
              { width: ticketWidth, borderLeftColor: theme.backgroundElement },
            ]}>
            <View style={styles.ticketHeader}>
              <ThemedText type="subtitle">Order</ThemedText>
              {lines.length > 0 && (
                <Pressable onPress={clear} hitSlop={8}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Clear
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {lines.length === 0 ? (
              <View style={styles.ticketEmpty}>
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Scan or tap a product to start the order.
                </ThemedText>
              </View>
            ) : (
              <FlatList
                style={styles.fill}
                data={lines}
                keyExtractor={(l) => String(l.variantId)}
                contentContainerStyle={styles.ticketList}
                renderItem={({ item }) => (
                  <OrderRow
                    line={item}
                    onDec={() => setQty(item.variantId, item.quantity - 1)}
                    onInc={() => setQty(item.variantId, item.quantity + 1)}
                    onRemove={() => removeLine(item.variantId)}
                  />
                )}
              />
            )}

            {lines.length > 0 && (
              <View style={[styles.footer, { borderTopColor: theme.backgroundElement }]}>
                <View style={styles.totalsRow}>
                  <ThemedText themeColor="textSecondary">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </ThemedText>
                  <ThemedText type="subtitle">
                    {formatPriceCents(subtotalCents)}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => router.push('/checkout')}
                  style={[styles.chargeButton, { backgroundColor: theme.text }]}>
                  <ThemedText style={{ color: theme.background }}>
                    Charge {formatPriceCents(subtotalCents)}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {status?.kind === 'miss' && (
          <View style={[styles.toast, { backgroundColor: theme.text }]}>
            <ThemedText style={{ color: theme.background }} numberOfLines={1}>
              No match for that barcode
            </ThemedText>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function ProductCard({
  product,
  single,
  onPress,
  priceLabel,
}: {
  product: PosCatalogProduct;
  single: boolean;
  onPress: () => void;
  priceLabel: string;
}) {
  const theme = useTheme();
  const image = product.images[0]?.url ?? product.variants[0]?.imageUrl ?? null;
  const multiVariant = product.variants.length > 1;
  return (
    <Pressable
      onPress={onPress}
      style={[
        single ? styles.cardRow : styles.card,
        { backgroundColor: theme.backgroundElement },
      ]}>
      {image ? (
        <Image
          source={{ uri: image }}
          style={single ? styles.cardRowThumb : styles.cardImage}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            single ? styles.cardRowThumb : styles.cardImage,
            { backgroundColor: theme.backgroundSelected },
          ]}
        />
      )}
      <View style={single ? styles.cardRowBody : styles.cardBody}>
        <ThemedText type="small" numberOfLines={2}>
          {product.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {priceLabel}
          {multiVariant ? ' · options' : ''}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function OrderRow({
  line,
  onDec,
  onInc,
  onRemove,
}: {
  line: OrderLine;
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.backgroundElement }]}>
      <View style={styles.rowBody}>
        <ThemedText type="small" numberOfLines={1}>
          {line.productName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {line.variantLabel} · {formatPriceCents(line.priceCents)}
        </ThemedText>
        <View style={styles.stepper}>
          <Pressable
            onPress={onDec}
            style={[styles.stepButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText>–</ThemedText>
          </Pressable>
          <ThemedText style={styles.qty}>{line.quantity}</ThemedText>
          <Pressable
            onPress={onInc}
            style={[styles.stepButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText>+</ThemedText>
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={8} style={styles.removeButton}>
            <ThemedText type="small" themeColor="textSecondary">
              Remove
            </ThemedText>
          </Pressable>
        </View>
      </View>
      <ThemedText>{formatPriceCents(line.priceCents * line.quantity)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  split: { flex: 1, flexDirection: 'row' },
  fill: { flex: 1 },

  catalogPane: { flex: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  catalogHeader: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  search: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cameraButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    justifyContent: 'center',
  },
  gridContent: { paddingBottom: Spacing.five, gap: Spacing.two },
  gridRow: { gap: Spacing.two },
  card: {
    flex: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', aspectRatio: 1 },
  cardBody: { padding: Spacing.two, gap: 2 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  cardRowThumb: { width: 48, height: 48, borderRadius: Spacing.one },
  cardRowBody: { flex: 1, gap: 2 },
  spinner: { marginVertical: Spacing.four },
  message: { textAlign: 'center', marginVertical: Spacing.five },

  ticketPane: { borderLeftWidth: StyleSheet.hairlineWidth, padding: Spacing.three },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  ticketEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center' },
  ticketList: { paddingBottom: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1, gap: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { minWidth: 18, textAlign: 'center' },
  removeButton: { marginLeft: Spacing.two },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chargeButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  toast: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
});
