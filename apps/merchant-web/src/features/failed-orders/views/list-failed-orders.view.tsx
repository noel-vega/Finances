import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { FailedOrder } from "merchant-sdk";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
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
import { DataTable } from "../../../components/data-table";
import { formatCents } from "../../../lib/currency";
import {
  useFailedOrdersQuery,
  useRetryFailedOrderMutation,
} from "../failed-orders.hooks";

function getColumns(
  onRetry: (row: FailedOrder) => void,
): ColumnDef<FailedOrder>[] {
  return [
    {
      id: "session",
      header: "Checkout",
      cell: ({ row }) => (
        <span
          className="font-mono text-xs"
          title={row.original.stripeCheckoutSessionId}
        >
          …{row.original.stripeCheckoutSessionId.slice(-12)}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) =>
        row.original.customerName || row.original.customerEmail ? (
          <div>
            <div>{row.original.customerName ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.customerEmail}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "amountTotalCents",
      header: "Total",
      cell: ({ row }) =>
        row.original.amountTotalCents != null
          ? formatCents(row.original.amountTotalCents)
          : "—",
    },
    {
      accessorKey: "attempts",
      header: "Attempts",
    },
    {
      accessorKey: "errorMessage",
      header: "Error",
      cell: ({ row }) => (
        <span
          className="line-clamp-2 max-w-xs text-xs text-muted-foreground"
          title={row.original.errorMessage}
        >
          {row.original.errorMessage}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Failed At",
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), "MM/dd/yyyy hh:mm a"),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.resolvedAt ? (
          <Badge
            variant="outline"
            title={
              row.original.resolvedBy
                ? `Resolved by ${row.original.resolvedBy}`
                : undefined
            }
          >
            Resolved
          </Badge>
        ) : (
          <Badge variant="destructive">Unresolved</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.resolvedAt ? null : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetry(row.original)}
          >
            Retry
          </Button>
        ),
    },
  ];
}

export function ListFailedOrdersView() {
  const failedOrders = useFailedOrdersQuery();
  const retry = useRetryFailedOrderMutation();
  const [retrying, setRetrying] = useState<FailedOrder | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function handleRetry() {
    if (!retrying) return;
    setRetryError(null);
    try {
      const result = await retry.mutateAsync(retrying.id);
      if (!result) {
        setRetryError("Couldn't retry this order — try again.");
        return;
      }
      setRetrying(null);
    } catch {
      setRetryError("Couldn't retry this order — try again.");
    }
  }

  const items = failedOrders.data?.items ?? [];
  const columns = getColumns((row) => {
    setRetryError(null);
    setRetrying(row);
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Failed Orders</h1>
        <p className="text-sm text-muted-foreground">
          Paid checkouts whose order couldn&apos;t be created. Retry re-runs
          order creation — it&apos;s safe to run more than once.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
          No failed orders — every paid checkout has an order.
        </p>
      ) : (
        <DataTable data={items} columns={columns} />
      )}

      <AlertDialog
        open={retrying !== null}
        onOpenChange={(open) => !open && setRetrying(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This re-runs order creation for checkout{" "}
              <span className="font-mono">
                {retrying?.stripeCheckoutSessionId}
              </span>
              . If the order was already created it&apos;s just marked resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {retryError && (
            <p className="text-sm text-destructive">{retryError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={retry.isPending} onClick={handleRetry}>
              Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
