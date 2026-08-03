import type { ColumnDef } from "@tanstack/react-table";
import type { ProductVariant } from "admin-sdk";
import { Badge } from "ui/badge";
import { formatCents } from "./shared";

export const variantColumns: ColumnDef<ProductVariant>[] = [
  {
    id: "options",
    header: "Variant",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.optionValues.map((ov) => (
          <Badge key={`${ov.optionName}:${ov.value}`} variant="outline">
            {ov.optionName}: {ov.value}
          </Badge>
        ))}
      </div>
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
  },
];
