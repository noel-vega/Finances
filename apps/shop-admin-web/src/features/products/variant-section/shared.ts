import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  useCreateVariantsMutation,
  useDeleteProductOptionMutation,
  useDeleteProductOptionValueMutation,
  useProductOptionsQuery,
  useProductVariantsQuery,
  useUpdateProductOptionMutation,
} from "../products.hooks";
import type { ProductVariant } from "admin-sdk";

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

export const VariantOptionFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Required"),
  valuesText: z.string().min(1, "Add at least one value"),
});

export const CreateVariantsFormSchema = z.object({
  options: VariantOptionFormSchema.array().min(1, "Add at least one option"),
});

export type CreateVariantsForm = z.infer<typeof CreateVariantsFormSchema>;

export function parseValuesText(valuesText: string) {
  return valuesText
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Shared business logic for the product options + variants section. All
 * design variants render this same state/handlers differently so the 5
 * tabs stay directly comparable (no logic drift between them).
 */
export function useVariantOptionsManager(productId: number) {
  const { data: variants } = useProductVariantsQuery(productId);
  const { data: productOptions } = useProductOptionsQuery(productId);
  const createVariants = useCreateVariantsMutation(productId);
  const deleteOption = useDeleteProductOptionMutation(productId);
  const updateOption = useUpdateProductOptionMutation(productId);
  const deleteOptionValue = useDeleteProductOptionValueMutation(productId);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [pendingDeletedOptionIds, setPendingDeletedOptionIds] = useState<
    number[]
  >([]);

  const form = useForm<CreateVariantsForm>({
    resolver: zodResolver(CreateVariantsFormSchema),
    defaultValues: { options: [] },
  });
  const optionFields = useFieldArray({
    control: form.control,
    name: "options",
  });

  useEffect(() => {
    if (!productOptions) return;
    // don't clobber in-progress local edits with a background refetch
    if (form.formState.isDirty) return;
    form.reset({
      options: productOptions.map((option) => ({
        id: option.id,
        name: option.name,
        valuesText: option.values.map((value) => value.value).join(", "),
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productOptions]);

  const handleAddOption = () => {
    setEditingIndex(null);
    setIsAddingOption(true);
  };

  const handleSaveNewOption = (values: {
    name: string;
    valuesText: string;
  }) => {
    optionFields.append(values);
    form.setValue("options", form.getValues("options"), {
      shouldDirty: true,
    });
    setIsAddingOption(false);
  };

  const handleCancelNewOption = () => {
    setIsAddingOption(false);
  };

  const handleSaveOption = (
    index: number,
    values: { name: string; valuesText: string },
  ) => {
    form.setValue(`options.${index}.name`, values.name, {
      shouldDirty: true,
    });
    form.setValue(`options.${index}.valuesText`, values.valuesText, {
      shouldDirty: true,
    });
    setEditingIndex(null);
  };

  const handleDeleteOption = (index: number) => {
    const optionId = form.getValues(`options.${index}.id`);
    if (optionId !== undefined) {
      setPendingDeletedOptionIds((prev) => [...prev, optionId]);
    }
    optionFields.remove(index);
    form.setValue("options", form.getValues("options"), {
      shouldDirty: true,
    });
    setEditingIndex(null);
  };

  const handleResetChanges = () => {
    form.reset();
    setPendingDeletedOptionIds([]);
    setEditingIndex(null);
  };

  const handleGenerateVariants = form.handleSubmit(async (data) => {
    // push renames and value removals for options that already exist on the
    // backend before regenerating variants, so the additive create call below
    // sees the up-to-date name/value set
    const originalOptionsById = new Map(
      (productOptions ?? []).map((option) => [option.id, option]),
    );

    for (const option of data.options) {
      if (option.id === undefined) continue;
      const original = originalOptionsById.get(option.id);
      if (!original) continue;

      const trimmedName = option.name.trim();
      if (trimmedName !== original.name) {
        await updateOption.mutateAsync({
          optionId: option.id,
          name: trimmedName,
        });
      }

      const newValues = new Set(parseValuesText(option.valuesText));
      for (const originalValue of original.values) {
        if (!newValues.has(originalValue.value)) {
          await deleteOptionValue.mutateAsync({
            optionId: option.id,
            valueId: originalValue.id,
          });
        }
      }
    }

    await Promise.all(
      pendingDeletedOptionIds.map((optionId) =>
        deleteOption.mutateAsync(optionId),
      ),
    );
    await createVariants.mutateAsync({
      options: data.options.map((option) => ({
        name: option.name.trim(),
        values: parseValuesText(option.valuesText),
      })),
      // price/stock are set per-variant later; new variants start at 0
      priceCents: 0,
      stock: 0,
    });
    // re-baseline on the just-submitted values so the form is clean (not empty) and the footer hides
    form.reset(form.getValues());
    setPendingDeletedOptionIds([]);
    setEditingIndex(null);
  });

  const isSavingChanges =
    createVariants.isPending ||
    deleteOption.isPending ||
    updateOption.isPending ||
    deleteOptionValue.isPending;

  return {
    variants: variants ?? [],
    productOptions: productOptions ?? [],
    form,
    optionFields,
    editingIndex,
    setEditingIndex,
    isAddingOption,
    setIsAddingOption,
    handleAddOption,
    handleSaveNewOption,
    handleCancelNewOption,
    handleSaveOption,
    handleDeleteOption,
    handleResetChanges,
    handleGenerateVariants,
    isDirty: form.formState.isDirty,
    isSavingChanges,
    errors: form.formState.errors,
  };
}
