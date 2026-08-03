import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import type { Product } from "admin-sdk";
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
import { Textarea } from "ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Button } from "ui/button";
import { LoaderCircleIcon } from "lucide-react";
import { BrandCombobox } from "../../brands/components/brand-combobox";
import { useUpdateProductMutation } from "../products.hooks";

const EditProductFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  status: z.union([
    z.literal("draft"),
    z.literal("active"),
    z.literal("archived"),
  ]),
  brandId: z.number().nullable(),
});

type EditProductForm = z.infer<typeof EditProductFormSchema>;

export function EditProductSheet(props: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit product</SheetTitle>
          <SheetDescription>Update the product's details.</SheetDescription>
        </SheetHeader>
        {props.open && (
          <EditProductForm
            product={props.product}
            onDone={() => props.onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// mounted only while the sheet is open, so defaultValues are always a fresh
// snapshot of the product — no separate reset-on-open effect needed
function EditProductForm(props: { product: Product; onDone: () => void }) {
  const updateProduct = useUpdateProductMutation(props.product.id);
  const form = useForm<EditProductForm>({
    resolver: zodResolver(EditProductFormSchema),
    defaultValues: {
      name: props.product.name,
      description: props.product.description ?? "",
      status: props.product.status,
      brandId: props.product.brandId,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateProduct.mutateAsync(data);
    props.onDone();
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 px-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Name</FieldLabel>
              <Input autoFocus {...field} />
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
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...field} />
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
          name="brandId"
          render={({ field }) => (
            <Field>
              <FieldLabel>Brand</FieldLabel>
              <BrandCombobox value={field.value} onValueChange={field.onChange} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="archived">archived</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>

      <SheetFooter className="flex-row justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={updateProduct.isPending}
          onClick={props.onDone}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateProduct.isPending}>
          {updateProduct.isPending ? (
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
