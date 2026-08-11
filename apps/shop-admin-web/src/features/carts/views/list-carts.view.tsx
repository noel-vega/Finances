import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { format } from "date-fns";
import type { CartListItem } from "admin-sdk";
import { getListCartsQueryOptions } from "../carts.hooks";
import { formatCents } from "../../../lib/currency";
import { DataTable } from "../../../components/data-table";

const columns: ColumnDef<CartListItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "itemCount",
    header: "Items",
  },
  {
    accessorKey: "subtotalCents",
    header: "Subtotal",
    cell: ({ row }) => formatCents(row.original.subtotalCents),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) =>
      format(new Date(row.original.updatedAt), "MM/dd/yyyy hh:mm a"),
  },
];

export function ListCartsView() {
  const carts = useQuery(getListCartsQueryOptions());
  const navigate = useNavigate();

  const handleRowClick = (row: Row<CartListItem>) => {
    navigate({ to: "/app/carts/$id", params: { id: row.original.id } });
  };

  return (
    <div className="space-y-4">
      <DataTable
        onRowClick={handleRowClick}
        data={carts.data?.items ?? []}
        columns={columns}
      />
    </div>
  );
}
