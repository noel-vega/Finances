import { useState } from "react";
import { Badge } from "ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "ui/item";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "ui/sheet";
import { GripVerticalIcon, PlusCircleIcon } from "lucide-react";
import type { ProductOption } from "admin-sdk";
import { DataTable } from "../../../components/data-table";
import { useVariantOptions } from "./shared";
import { VariantOptionForm } from "./variant-option-form";
import { variantColumns } from "./variant-columns";

export function VariantSection({ productId }: { productId: number }) {
  const { variants, productOptions, saveOption, removeOption, isSaving } =
    useVariantOptions(productId);
  // 'new' opens the drawer in create mode, an option id opens it for that option
  const [openTarget, setOpenTarget] = useState<number | "new" | null>(null);

  return (
    <section className="space-y-4">
      <ul>
        {productOptions.map((option) => (
          <VariantOptionItem
            key={option.id}
            option={option}
            onClick={() => setOpenTarget(option.id)}
          />
        ))}
        <div
          className="flex hover:bg-muted rounded-b-lg border border-t-none text-sm items-center gap-2 p-2 cursor-pointer"
          onClick={() => setOpenTarget("new")}
        >
          <PlusCircleIcon size="14" />
          Add option
        </div>
      </ul>

      <DataTable columns={variantColumns} data={variants} />

      <Sheet
        open={openTarget !== null}
        onOpenChange={(open) => !open && setOpenTarget(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {openTarget === "new" ? "Add option" : "Edit option"}
            </SheetTitle>
            <SheetDescription>
              Define the option name and its possible values.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            {openTarget !== null && (
              <SheetOptionForm
                productOptions={productOptions}
                target={openTarget}
                isSaving={isSaving}
                onSave={async (values) => {
                  await saveOption(openTarget, values);
                  setOpenTarget(null);
                }}
                onDelete={async () => {
                  await removeOption(openTarget);
                  setOpenTarget(null);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function SheetOptionForm({
  productOptions,
  target,
  isSaving,
  onSave,
  onDelete,
}: {
  productOptions: ProductOption[];
  target: number | "new";
  isSaving: boolean;
  onSave: (values: { name: string; valuesText: string }) => void;
  onDelete: () => void;
}) {
  const existing =
    target !== "new"
      ? productOptions.find((option) => option.id === target)
      : undefined;

  return (
    <VariantOptionForm
      name={existing?.name ?? ""}
      valuesText={existing?.values.map((v) => v.value).join(", ") ?? ""}
      deleteLabel={target === "new" ? "Cancel" : "Delete"}
      isSaving={isSaving}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

function VariantOptionItem(props: { option: ProductOption; onClick: () => void }) {
  return (
    <Item
      variant="outline"
      className="not-last:rounded-b-none not-first:rounded-t-none p-5 hover:bg-muted hover:cursor-pointer"
      onClick={props.onClick}
    >
      <ItemMedia variant="icon">
        <GripVerticalIcon />
      </ItemMedia>
      <ItemContent className="gap-2">
        <ItemTitle>{props.option.name || "Untitled option"}</ItemTitle>
        <ItemDescription>
          <ul className="flex gap-2">
            {props.option.values.map((v) => (
              <li key={v.id}>
                <Badge variant="secondary">{v.value}</Badge>
              </li>
            ))}
          </ul>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
