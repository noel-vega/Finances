import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrderDetail } from "admin-sdk";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import { DataTable } from "../../../components/data-table";
import { useOrderQuery } from "../orders.hooks";
import { formatCents } from "../orders.utils";

type OrderItem = OrderDetail["items"][number];

const columns: ColumnDef<OrderItem>[] = [
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div>
          <div>{item.productName}</div>
          {item.optionsLabel && (
            <div className="text-xs text-muted-foreground">{item.optionsLabel}</div>
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
    id: "lineTotal",
    header: "Total",
    cell: ({ row }) =>
      formatCents(row.original.priceCents * row.original.quantity),
  },
];

export function OrderView({ id }: { id: number }) {
  const { data } = useOrderQuery(id);

  if (!data) {
    return null;
  }

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <Link to="/app/orders">
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Back to orders">
              <ArrowLeftIcon />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Order #{data.id}</h1>
            <p className="text-sm text-muted-foreground">
              Placed {format(new Date(data.createdAt), "MM/dd/yyyy hh:mm a")}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div>
          <h2 className="font-medium mb-1">Customer</h2>
          <p>{data.customerName}</p>
          <p className="text-muted-foreground">{data.customerEmail}</p>
        </div>
        <div>
          <h2 className="font-medium mb-1">Shipping address</h2>
          <p>{data.shippingLine1}</p>
          {data.shippingLine2 && <p>{data.shippingLine2}</p>}
          <p>
            {data.shippingCity}
            {data.shippingState ? `, ${data.shippingState}` : ""} {data.shippingPostalCode}
          </p>
          <p>{data.shippingCountry}</p>
        </div>
      </div>

      <DataTable columns={columns} data={data.items} />

      <Separator className="my-4" />

      <div className="flex justify-end gap-8 text-sm">
        <span className="text-muted-foreground">Subtotal: {formatCents(data.subtotalCents)}</span>
        <span className="font-medium">Total: {formatCents(data.amountTotalCents)}</span>
      </div>
    </div>
  );
}
