import { useQuery } from "@tanstack/react-query";
import { getListProductsQueryOptions } from "../products.hooks";
import { DataTable } from "../../../components/data-table";
import { Button } from "ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { InputGroup, InputGroupAddon, InputGroupInput } from "ui/input-group";
import { PlusIcon, SearchIcon } from "lucide-react";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import type { Product } from "admin-sdk";
import { Field, FieldLabel } from "ui/field";
import { format } from "date-fns";
import { Separator } from "ui/separator";

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({row}) => format(new Date(row.original.createdAt), "MM/dd/yyyy hh:mm a")
  },
];

export function ProductListView() {
  const products = useQuery(getListProductsQueryOptions());
  const navigate = useNavigate()

  const handleRowClick = (row: Row<Product>) => {
    const {id} = row.original
    navigate({to: "/app/products/$id", params: {id}})
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end justify-between">
        <Field className="max-w-xs">
          <FieldLabel>Search</FieldLabel>
          <InputGroup>
            <InputGroupInput placeholder="Search products..." />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Link to="/app/products/create">
          <Button>
            <PlusIcon /> Product
          </Button>
        </Link>
      </div>
      <DataTable onRowClick={handleRowClick} data={products.data ?? []} columns={columns} />
    </div>
  );
}
