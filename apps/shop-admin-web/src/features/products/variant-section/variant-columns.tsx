import type { ColumnDef } from "@tanstack/react-table";
import type { ProductVariant } from "admin-sdk";
import { formatCents } from "./shared";

export const variantColumns: ColumnDef<ProductVariant>[] = [
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
