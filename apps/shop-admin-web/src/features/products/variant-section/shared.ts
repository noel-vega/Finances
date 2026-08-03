import {
  useCreateVariantsMutation,
  useDeleteProductOptionMutation,
  useDeleteProductOptionValueMutation,
  useProductOptionsQuery,
  useProductVariantsQuery,
  useUpdateProductOptionMutation,
} from "../products.hooks";
import type { ProductOption, ProductVariant } from "admin-sdk";

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function formatPriceRange(variants: ProductVariant[]) {
  if (variants.length === 0) return "—";
  const prices = variants.map((variant) => variant.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? formatCents(min)
    : `${formatCents(min)} - ${formatCents(max)}`;
}

export function parseValuesText(valuesText: string) {
  return valuesText
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

// createVariants only creates/updates the options it's given and treats that
// set as the *complete* option list for the product (it deletes variants
// that don't have a value for every option in the payload) — so any single
// option edit has to be sent alongside the rest of the product's options,
// unchanged, or it looks like they were removed
function buildOptionsPayload(
  productOptions: ProductOption[],
  edited: { optionId?: number; name: string; values: string[] },
) {
  const others = productOptions
    .filter((option) => option.id !== edited.optionId)
    .map((option) => ({
      name: option.name,
      values: option.values.map((v) => v.value),
    }));
  return [...others, { name: edited.name, values: edited.values }];
}

/**
 * Options + variants data and mutations for the product variant section.
 * Every option create/update/delete here is a discrete, immediately-applied
 * action — there's no page-level draft/save step.
 */
export function useVariantOptions(productId: number) {
  const { data: variants } = useProductVariantsQuery(productId);
  const { data: productOptions } = useProductOptionsQuery(productId);
  const createVariants = useCreateVariantsMutation(productId);
  const deleteOption = useDeleteProductOptionMutation(productId);
  const updateOption = useUpdateProductOptionMutation(productId);
  const deleteOptionValue = useDeleteProductOptionValueMutation(productId);

  const options = productOptions ?? [];

  // target is the option's id, or "new" when creating one
  const saveOption = async (
    target: number | "new",
    values: { name: string; valuesText: string },
  ) => {
    const trimmedName = values.name.trim();
    const newValues = parseValuesText(values.valuesText);

    if (target === "new") {
      await createVariants.mutateAsync({
        options: buildOptionsPayload(options, {
          name: trimmedName,
          values: newValues,
        }),
        // price/stock are set per-variant later; new variants start at 0
        priceCents: 0,
        stock: 0,
      });
      return;
    }

    const original = options.find((o) => o.id === target);
    if (!original) return;

    if (trimmedName !== original.name) {
      await updateOption.mutateAsync({ optionId: target, name: trimmedName });
    }

    const newValueSet = new Set(newValues);
    const removedValues = original.values.filter(
      (v) => !newValueSet.has(v.value),
    );
    for (const removed of removedValues) {
      await deleteOptionValue.mutateAsync({
        optionId: target,
        valueId: removed.id,
      });
    }

    const existingValueSet = new Set(original.values.map((v) => v.value));
    const hasNewValues = newValues.some((v) => !existingValueSet.has(v));
    if (hasNewValues) {
      await createVariants.mutateAsync({
        options: buildOptionsPayload(options, {
          optionId: target,
          name: trimmedName,
          values: newValues,
        }),
        priceCents: 0,
        stock: 0,
      });
    }
  };

  const removeOption = async (target: number | "new") => {
    if (target === "new") return;
    await deleteOption.mutateAsync(target);
  };

  const isSaving =
    createVariants.isPending ||
    deleteOption.isPending ||
    updateOption.isPending ||
    deleteOptionValue.isPending;

  return {
    variants: variants ?? [],
    productOptions: options,
    saveOption,
    removeOption,
    isSaving,
  };
}
