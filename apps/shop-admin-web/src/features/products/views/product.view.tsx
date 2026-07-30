import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Separator } from "ui/separator";
import {
  useDeleteProductMutation,
  useProductQuery,
  useProductVariantsQuery,
} from "../products.hooks";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { DataTable } from "../../../components/data-table";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "ui/alert-dialog";
import { PlusIcon, SettingsIcon, TrashIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ProductVariant } from "admin-sdk";

const LOW_STOCK_THRESHOLD = 0;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCents(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function formatPriceRange(variants: ProductVariant[]) {
  if (variants.length === 0) return "—";
  const prices = variants.map((variant) => variant.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? formatCents(min)
    : `${formatCents(min)} - ${formatCents(max)}`;
}

const variantColumns: ColumnDef<ProductVariant>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "priceCents",
    header: "Price",
    cell: ({ row }) => formatCents(row.original.priceCents),
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
];

export function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{value}</CardContent>
    </Card>
  );
}

export function ProductView({ id }: { id: number }) {
  const navigate = useNavigate();
  const { data } = useProductQuery(id);
  const { data: variants } = useProductVariantsQuery(id);
  const deleteProduct = useDeleteProductMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!data) {
    return null;
  }

  const totalStock = (variants ?? []).reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );
  const needsAttentionCount = (variants ?? []).filter(
    (variant) => variant.stock <= LOW_STOCK_THRESHOLD,
  ).length;

  const handleDelete = () => {
    deleteProduct.mutate(id, {
      onSuccess: () => {
        navigate({ to: "/app/products" });
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      <header className="flex gap-4 mb-4 items-start">
        <div className="size-20 bg-secondary rounded-lg" />
        <h1 className="text-lg font-semibold flex-1">{data.name}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Product settings" />
            }
          >
            <SettingsIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{data.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product and all of its
              variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteProduct.isPending}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="flex gap-4">
        <MetricCard title="Variants" value={variants?.length ?? 0} />
        <MetricCard title="Total Stock" value={totalStock} />
        <MetricCard title="Price Range" value={formatPriceRange(variants ?? [])} />
        <MetricCard title="Needs Attention" value={needsAttentionCount} />
      </section>
      <Separator className="my-8" />

      <section className="space-y-4">
        <div className="flex justify-between">
          <h2 className="font-semibold">Variants</h2>
          <Button><PlusIcon /> Variant</Button>
        </div>
        <DataTable columns={variantColumns} data={variants ?? []} />
      </section>
    </div>
  );
}
