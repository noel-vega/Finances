import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { CartDetail } from "admin-sdk";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import { DataTable } from "../../../components/data-table";
import { useCartQuery } from "../carts.hooks";
import { formatCents } from "../../../lib/currency";

type CartItem = CartDetail["items"][number];

const columns: ColumnDef<CartItem>[] = [
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => {
      const item = row.original;
      const options = item.optionValues
        .map((ov) => `${ov.optionName}: ${ov.value}`)
        .join(", ");
      return (
        <div>
          <div>{item.productName}</div>
          {options && (
            <div className="text-xs text-muted-foreground">{options}</div>
          )}
        </div>
      );
    },
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
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "stock",
    header: "Current Stock",
  },
  {
    id: "lineTotal",
    header: "Total",
    cell: ({ row }) =>
      formatCents(row.original.priceCents * row.original.quantity),
  },
];

export function CartView({ id }: { id: number }) {
  const { data } = useCartQuery(id);

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <Link to="/app/carts">
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Back to carts">
              <ArrowLeftIcon />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Cart #{data.id}</h1>
            <p className="text-sm text-muted-foreground">
              Last updated{" "}
              {formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </header>

      <DataTable columns={columns} data={data.items} />

      <Separator className="my-4" />

      <div className="flex justify-end gap-8 text-sm">
        <span className="text-muted-foreground">{data.itemCount} items</span>
        <span className="font-medium">
          Subtotal: {formatCents(data.subtotalCents)}
        </span>
      </div>
    </div>
  );
}
