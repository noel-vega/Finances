import { useState } from "react";
import { useWatch, type Control } from "react-hook-form";
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
import { DataTable } from "../../../components/data-table";
import {
  useVariantOptionsManager,
  parseValuesText,
  type CreateVariantsForm,
} from "./shared";
import { VariantOptionForm } from "./variant-option-form";
import { UnsavedChangesBar } from "./unsaved-changes-bar";
import { variantColumns } from "./variant-columns";

export function VariantSection({ productId }: { productId: number }) {
  const m = useVariantOptionsManager(productId);
  // 'new' opens the drawer in create mode, a number opens it on that option's index
  const [openSheet, setOpenSheet] = useState<number | "new" | null>(null);

  return (
    <form onSubmit={m.handleGenerateVariants}>
      <section className="space-y-4">
        <ul>
          {m.optionFields.fields.map((field, index) => (
            <VariantOptionItem
              key={field.id}
              control={m.form.control}
              index={index}
              onClick={() => setOpenSheet(index)}
            />
          ))}
          <div
            className="flex hover:bg-muted rounded-b-lg border border-t-none text-sm items-center gap-2 p-2 cursor-pointer"
            onClick={() => setOpenSheet("new")}
          >
            <PlusCircleIcon size="14" />
            Add option
          </div>
        </ul>
        {m.errors.options?.message && (
          <p className="text-sm text-destructive">{m.errors.options.message}</p>
        )}

        <DataTable columns={variantColumns} data={m.variants} />
      </section>

      <Sheet
        open={openSheet !== null}
        onOpenChange={(open) => !open && setOpenSheet(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {openSheet === "new" ? "Add option" : "Edit option"}
            </SheetTitle>
            <SheetDescription>
              Define the option name and its possible values.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            {openSheet !== null && (
              <SheetOptionForm
                m={m}
                target={openSheet}
                onDone={() => setOpenSheet(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <UnsavedChangesBar
        isDirty={m.isDirty}
        isSaving={m.isSavingChanges}
        onReset={m.handleResetChanges}
      />
    </form>
  );
}

function SheetOptionForm({
  m,
  target,
  onDone,
}: {
  m: ReturnType<typeof useVariantOptionsManager>;
  target: number | "new";
  onDone: () => void;
}) {
  const existing =
    target !== "new" ? m.form.getValues(`options.${target}`) : undefined;

  return (
    <VariantOptionForm
      name={existing?.name ?? ""}
      valuesText={existing?.valuesText ?? ""}
      deleteLabel={target === "new" ? "Cancel" : "Delete"}
      onSave={(values) => {
        if (target === "new") {
          m.handleSaveNewOption(values);
        } else {
          m.handleSaveOption(target, values);
        }
        onDone();
      }}
      onDelete={() => {
        if (target === "new") {
          m.handleCancelNewOption();
        } else {
          m.handleDeleteOption(target);
        }
        onDone();
      }}
    />
  );
}

function VariantOptionItem(props: {
  control: Control<CreateVariantsForm>;
  index: number;
  onClick: () => void;
}) {
  const name = useWatch({
    control: props.control,
    name: `options.${props.index}.name`,
  });
  const valuesText = useWatch({
    control: props.control,
    name: `options.${props.index}.valuesText`,
  });
  const values = valuesText ? parseValuesText(valuesText) : [];

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
        <ItemTitle>{name || "Untitled option"}</ItemTitle>
        <ItemDescription>
          <ul className="flex gap-2">
            {values.map((x) => (
              <li key={x}>
                <Badge variant="secondary">{x}</Badge>
              </li>
            ))}
          </ul>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
