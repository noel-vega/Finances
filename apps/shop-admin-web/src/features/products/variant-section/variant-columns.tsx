import type { ColumnDef } from "@tanstack/react-table";
import type { ProductVariant } from "admin-sdk";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { MoreVerticalIcon, PackageIcon, PencilIcon } from "lucide-react";
import { formatCents } from "./shared";

const LOW_STOCK_THRESHOLD = 0;

export function getVariantColumns(handlers: {
  onAdjustStock: (variant: ProductVariant) => void;
  onEdit: (variant: ProductVariant) => void;
}): ColumnDef<ProductVariant>[] {
  return [
    {
      id: "options",
      header: "Variant",
      cell: ({ row }) =>
        row.original.optionValues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.optionValues.map((ov) => (
              <Badge key={`${ov.optionName}:${ov.value}`} variant="outline">
                {ov.optionName}: {ov.value}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">Default</span>
        ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => row.original.sku ?? "—",
    },
    {
      accessorKey: "priceCents",
      header: "Price",
      cell: ({ row }) => formatCents(row.original.priceCents),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) =>
        row.original.stock <= LOW_STOCK_THRESHOLD ? (
          <Badge variant="destructive">{row.original.stock}</Badge>
        ) : (
          row.original.stock
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Variant actions"
              />
            }
          >
            <MoreVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handlers.onEdit(row.original)}>
              <PencilIcon /> Edit variant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlers.onAdjustStock(row.original)}>
              <PackageIcon /> Adjust stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
