import { useListInventoryQuery } from "../inventory.hooks";
import { DataTable } from "../../../components/data-table";
import { InputGroup, InputGroupAddon, InputGroupInput } from "ui/input-group";
import { SearchIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import type { InventoryRecord } from "admin-sdk";
import { Field, FieldLabel } from "ui/field";
import { Badge } from "ui/badge";
import { format } from "date-fns";

const LOW_STOCK_THRESHOLD = 0;

const columns: ColumnDef<InventoryRecord>[] = [
  {
    accessorKey: "productName",
    header: "Product",
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => row.original.sku ?? "—",
  },
  {
    accessorKey: "locationName",
    header: "Location",
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
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) =>
      format(new Date(row.original.updatedAt), "MM/dd/yyyy hh:mm a"),
  },
];

export function ListInventoryView() {
  const inventory = useListInventoryQuery();

  return (
    <div className="space-y-4">
      <Field className="max-w-xs">
        <FieldLabel>Search</FieldLabel>
        <InputGroup>
          <InputGroupInput placeholder="Search inventory..." />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <DataTable data={inventory.data ?? []} columns={columns} />
    </div>
  );
}
