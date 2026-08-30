import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import type { ProductVariant } from "admin-sdk";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "ui/sheet";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Button } from "ui/button";
import { Barcode, LoaderCircleIcon, X } from "lucide-react";
import { useUpdateVariantMutation } from "../products.hooks";
import { centsToDollars, dollarsToCents } from "../../../lib/currency";
import { ImageManager } from "../components/image-manager";
import { Separator } from "ui/separator";

const EditVariantFormSchema = z.object({
  sku: z.string().nullable(),
  priceCents: z.number().int().min(0, "Must be at least 0"),
  weightOz: z.number().int().min(0, "Must be at least 0").nullable(),
  // useFieldArray needs an object per row (RHF doesn't support arrays of
  // primitives); flattened back to string[] before hitting the API.
  barcodes: z.object({ value: z.string() }).array(),
});

type EditVariantForm = z.infer<typeof EditVariantFormSchema>;

export function EditVariantSheet(props: {
  productId: number;
  variant: ProductVariant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit variant</SheetTitle>
          <SheetDescription>
            Update this variant's SKU, price, and barcodes.
          </SheetDescription>
        </SheetHeader>
        {props.open && props.variant && (
          <EditVariantForm
            productId={props.productId}
            variant={props.variant}
            onDone={() => props.onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// mounted only while the sheet is open, so defaultValues are always a fresh
// snapshot of the variant
function EditVariantForm(props: {
  productId: number;
  variant: ProductVariant;
  onDone: () => void;
}) {
  const updateVariant = useUpdateVariantMutation(props.productId);
  const form = useForm<EditVariantForm>({
    resolver: zodResolver(EditVariantFormSchema),
    defaultValues: {
      sku: props.variant.sku,
      priceCents: props.variant.priceCents,
      weightOz: props.variant.weightOz,
      barcodes: props.variant.barcodes.map((value) => ({ value })),
    },
  });

  const barcodeFields = useFieldArray({ control: form.control, name: "barcodes" });
  const [barcodeInput, setBarcodeInput] = useState("");

  // hardware barcode scanners type the digits then send Enter
  const handleBarcodeInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const code = barcodeInput.trim();
    if (code) barcodeFields.append({ value: code });
    setBarcodeInput("");
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateVariant.mutateAsync({
      variantId: props.variant.id,
      sku: data.sku?.trim() || null,
      priceCents: data.priceCents,
      weightOz: data.weightOz,
      barcodes: data.barcodes.map((b) => b.value),
    });
    props.onDone();
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 px-4">
        <Controller
          control={form.control}
          name="sku"
          render={({ field }) => (
            <Field>
              <FieldLabel>SKU</FieldLabel>
              <Input
                placeholder="e.g. SHOE-BLK-42"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.currentTarget.value)}
              />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="priceCents"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Price</FieldLabel>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={centsToDollars(field.value)}
                onChange={(e) =>
                  field.onChange(dollarsToCents(e.currentTarget.valueAsNumber || 0))
                }
              />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="weightOz"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Weight (oz)</FieldLabel>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 16"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.currentTarget.value === ""
                      ? null
                      : e.currentTarget.valueAsNumber,
                  )
                }
              />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        <Field>
          <FieldLabel>Barcodes</FieldLabel>
          <Input
            placeholder="Click here, then scan a barcode"
            value={barcodeInput}
            onChange={(event) => setBarcodeInput(event.currentTarget.value)}
            onKeyDown={handleBarcodeInputKeyDown}
          />
          {barcodeFields.fields.length > 0 && (
            <ul className="space-y-1">
              {barcodeFields.fields.map((field, index) => (
                <li
                  key={field.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Barcode className="text-muted-foreground" />
                    {form.watch(`barcodes.${index}.value`)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove barcode"
                    onClick={() => barcodeFields.remove(index)}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <Separator />

        <Field>
          <FieldLabel>Images</FieldLabel>
          <p className="text-sm text-muted-foreground">
            Optional — overrides the product's default images for this variant only.
          </p>
          <ImageManager
            productId={props.productId}
            variantId={props.variant.id}
            images={props.variant.images}
          />
        </Field>
      </div>

      <SheetFooter className="flex-row justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={updateVariant.isPending}
          onClick={props.onDone}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateVariant.isPending}>
          {updateVariant.isPending ? (
            <>
              <LoaderCircleIcon className="animate-spin" /> Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </SheetFooter>
    </form>
  );
}
