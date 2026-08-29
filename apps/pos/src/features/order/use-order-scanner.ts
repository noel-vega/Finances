import { useCallback, useRef, useState } from 'react';

import { useOrder } from '@/features/order/order-store';
import { posApi } from '@/lib/pos-api';

type ScanStatus =
  | null
  | { kind: 'looking-up' }
  | { kind: 'added'; name: string }
  | { kind: 'miss' };

/**
 * Resolve a scanned code against the catalog and add it to the current order.
 * Used by the Order screen's hidden BarcodeWedge (and could back the camera
 * scanner too). Debounced by a short lock so a double-trigger from the gun
 * doesn't add the same item twice.
 */
export function useOrderScanner() {
  const { addVariant } = useOrder();
  const [status, setStatus] = useState<ScanStatus>(null);
  const lock = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scan = useCallback(
    async (code: string) => {
      if (lock.current) return;
      lock.current = true;
      setStatus({ kind: 'looking-up' });
      try {
        const result = await posApi.catalog.scan(code);
        if (result) {
          addVariant(result.product, result.variantId);
          setStatus({ kind: 'added', name: result.product.name });
        } else {
          setStatus({ kind: 'miss' });
        }
      } catch {
        setStatus({ kind: 'miss' });
      }
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        lock.current = false;
        setStatus(null);
      }, 1400);
    },
    [addVariant],
  );

  return { scan, status };
}
