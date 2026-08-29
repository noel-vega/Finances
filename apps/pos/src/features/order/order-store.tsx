import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PosCatalogProduct } from 'pos-sdk';

import { useDeviceAuth } from '@/lib/device-auth';
import { variantLabel } from '@/lib/variant';

const STORAGE_KEY = 'pos_active_order';

export type OrderLine = {
  variantId: number;
  productId: number;
  productName: string;
  variantLabel: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
};

type OrderContextValue = {
  lines: OrderLine[];
  itemCount: number;
  subtotalCents: number;
  addVariant: (product: PosCatalogProduct, variantId: number) => void;
  setQty: (variantId: number, qty: number) => void;
  removeLine: (variantId: number) => void;
  clear: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { status } = useDeviceAuth();
  const [lines, setLines] = useState<OrderLine[]>([]);
  // don't write back to storage until the initial read has finished, or the
  // first (empty) render would clobber a persisted order
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLines(JSON.parse(raw) as OrderLine[]);
      } catch {
        // ignore — start from an empty order
      }
      hydrated.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines)).catch(() => {});
  }, [lines]);

  // a device that's been unpaired (or paired to a different account) must not
  // carry its old ticket forward
  useEffect(() => {
    if (status === 'unpaired') {
      setLines([]);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, [status]);

  const addVariant = useCallback(
    (product: PosCatalogProduct, variantId: number) => {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) return;
      setLines((prev) => {
        const existing = prev.find((l) => l.variantId === variantId);
        if (existing) {
          return prev.map((l) =>
            l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l,
          );
        }
        return [
          ...prev,
          {
            variantId,
            productId: product.id,
            productName: product.name,
            variantLabel: variantLabel(variant),
            priceCents: variant.priceCents,
            imageUrl: variant.imageUrl ?? product.images[0]?.url ?? null,
            quantity: 1,
          },
        ];
      });
    },
    [],
  );

  const setQty = useCallback((variantId: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: qty } : l)),
    );
  }, []);

  const removeLine = useCallback((variantId: number) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<OrderContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotalCents = lines.reduce(
      (sum, l) => sum + l.priceCents * l.quantity,
      0,
    );
    return {
      lines,
      itemCount,
      subtotalCents,
      addVariant,
      setQty,
      removeLine,
      clear,
    };
  }, [lines, addVariant, setQty, removeLine, clear]);

  return <OrderContext value={value}>{children}</OrderContext>;
}

export function useOrder(): OrderContextValue {
  const ctx = use(OrderContext);
  if (!ctx) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return ctx;
}
