import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryQueryOptions } from "../dashboard.hooks";
import { DataTable } from "../../../components/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "ui/card";
import { type ColumnDef } from "@tanstack/react-table";
import type { OrderListItem, Customer } from "merchant-sdk";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { formatCents } from "../../../lib/currency";

function MetricCard(props: { title: string; value: string | number }) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{props.value}</CardContent>
    </Card>
  );
}

const orderColumns: ColumnDef<OrderListItem>[] = [
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <Link to="/app/orders/$id" params={{ id: row.original.id }} className="hover:underline">
        {row.original.customerName}
      </Link>
    ),
  },
  {
    accessorKey: "amountTotalCents",
    header: "Total",
    cell: ({ row }) => formatCents(row.original.amountTotalCents),
  },
  {
    accessorKey: "createdAt",
    header: "Placed",
    cell: ({ row }) => format(new Date(row.original.createdAt), "MM/dd/yyyy hh:mm a"),
  },
];

const customerColumns: ColumnDef<Customer>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => format(new Date(row.original.createdAt), "MM/dd/yyyy hh:mm a"),
  },
];

export function DashboardView() {
  const dashboard = useQuery(getDashboardSummaryQueryOptions());
  const summary = dashboard.data;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <MetricCard title="Orders" value={summary?.orderCount ?? 0} />
        <MetricCard title="Revenue" value={formatCents(summary?.revenueCents ?? 0)} />
        <MetricCard title="Out of Stock" value={summary?.outOfStockCount ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Orders</h2>
          <DataTable data={summary?.recentOrders ?? []} columns={orderColumns} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Customers</h2>
          <DataTable data={summary?.recentCustomers ?? []} columns={customerColumns} />
        </div>
      </div>
    </div>
  );
}
