import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Separator } from "ui/separator";
import {
  useDeleteProductMutation,
  useProductQuery,
  useProductVariantsQuery,
} from "../products.hooks";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
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
import { SettingsIcon, Trash2Icon } from "lucide-react";
import { formatPriceRange } from "../variant-section/shared";
import { VariantSection } from "../variant-section";

const LOW_STOCK_THRESHOLD = 0;

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
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Product settings"
              />
            }
          >
            <SettingsIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{data.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product and all of its variants.
              This action cannot be undone.
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
        <MetricCard
          title="Price Range"
          value={formatPriceRange(variants ?? [])}
        />
        <MetricCard title="Needs Attention" value={needsAttentionCount} />
      </section>
      <Separator className="my-8" />

      <section className="space-y-4">
        <h2 className="font-semibold">Variants</h2>
        <VariantSection productId={id} />
      </section>
    </div>
  );
}
