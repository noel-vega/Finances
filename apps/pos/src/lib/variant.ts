import type { PosCatalogVariant } from 'pos-sdk';

export function variantLabel(variant: PosCatalogVariant): string {
  if (variant.optionValues.length === 0) return variant.sku ?? 'Default';
  return variant.optionValues.map((ov) => ov.value).join(' / ');
}
