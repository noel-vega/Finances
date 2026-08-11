import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrderDetail, ShippingRate } from "admin-sdk";
import { ArrowLeftIcon, LoaderCircleIcon, TruckIcon } from "lucide-react";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import { cn } from "ui/utils";
import { DataTable } from "../../../components/data-table";
import {
  useBuyShippingLabelMutation,
  useGetShippingRatesMutation,
  useOrderQuery,
} from "../orders.hooks";
import { formatCents } from "../../../lib/currency";

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

function ShippingLabelSection({ order }: { order: OrderDetail }) {
  const getShippingRates = useGetShippingRatesMutation();
  const buyShippingLabel = useBuyShippingLabelMutation(order.id);
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  if (order.labelUrl) {
    return (
      <div>
        <h2 className="font-medium mb-1">Shipping label</h2>
        <p className="text-sm">
          {order.shippingCarrier} {order.shippingServiceLevel}
        </p>
        {order.trackingNumber && (
          <p className="text-sm text-muted-foreground">
            Tracking:{" "}
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                {order.trackingNumber}
              </a>
            ) : (
              order.trackingNumber
            )}
          </p>
        )}
        <a href={order.labelUrl} target="_blank" rel="noreferrer">
          <Button type="button" variant="outline" size="sm" className="mt-2">
            Download label
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-medium mb-1">Shipping label</h2>

      {!rates && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={getShippingRates.isPending}
          onClick={() =>
            getShippingRates.mutate(order.id, {
              onSuccess: (data) => setRates(data ?? []),
            })
          }
        >
          {getShippingRates.isPending ? (
            <>
              <LoaderCircleIcon className="animate-spin" /> Getting rates...
            </>
          ) : (
            <>
              <TruckIcon /> Get shipping rates
            </>
          )}
        </Button>
      )}

      {getShippingRates.isError && (
        <p className="text-sm text-destructive mt-1">
          Couldn't get shipping rates for this order.
        </p>
      )}

      {rates && rates.length === 0 && (
        <p className="text-sm text-muted-foreground">No rates available.</p>
      )}

      {rates && rates.length > 0 && (
        <div className="space-y-2 max-w-sm">
          {rates.map((rate) => (
            <button
              key={rate.objectId}
              type="button"
              onClick={() => setSelectedRate(rate)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm",
                selectedRate?.objectId === rate.objectId
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted",
              )}
            >
              <span>
                {rate.provider} {rate.servicelevel}
                {rate.estimatedDays && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {rate.estimatedDays}d
                  </span>
                )}
              </span>
              <span className="font-medium">{formatCents(rate.amountCents)}</span>
            </button>
          ))}

          <Button
            type="button"
            disabled={!selectedRate || buyShippingLabel.isPending}
            onClick={() =>
              selectedRate &&
              buyShippingLabel.mutate({
                rateObjectId: selectedRate.objectId,
                provider: selectedRate.provider,
                servicelevel: selectedRate.servicelevel,
                amountCents: selectedRate.amountCents,
              })
            }
          >
            {buyShippingLabel.isPending ? (
              <>
                <LoaderCircleIcon className="animate-spin" /> Buying label...
              </>
            ) : (
              "Buy label"
            )}
          </Button>

          {buyShippingLabel.isError && (
            <p className="text-sm text-destructive">
              Couldn't purchase a label for that rate.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

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
        <span className="text-muted-foreground">Shipping: {formatCents(data.shippingCents)}</span>
        <span className="font-medium">Total: {formatCents(data.amountTotalCents)}</span>
      </div>

      <Separator className="my-4" />

      <ShippingLabelSection order={data} />
    </div>
  );
}
