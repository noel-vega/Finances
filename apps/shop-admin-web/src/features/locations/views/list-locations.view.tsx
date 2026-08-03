import { useQuery } from "@tanstack/react-query";
import { getListLocationsQueryOptions } from "../locations.hooks";
import { DataTable } from "../../../components/data-table";
import { Button } from "ui/button";
import { Link } from "@tanstack/react-router";
import { InputGroup, InputGroupAddon, InputGroupInput } from "ui/input-group";
import { PlusIcon, SearchIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import type { Location } from "admin-sdk";
import { Field, FieldLabel } from "ui/field";
import { format } from "date-fns";

const columns: ColumnDef<Location>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "MM/dd/yyyy hh:mm a"),
  },
];

export function ListLocationsView() {
  const locations = useQuery(getListLocationsQueryOptions());

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end justify-between">
        <Field className="max-w-xs">
          <FieldLabel>Search</FieldLabel>
          <InputGroup>
            <InputGroupInput placeholder="Search locations..." />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Link to="/app/locations/create">
          <Button>
            <PlusIcon /> Location
          </Button>
        </Link>
      </div>
      <DataTable data={locations.data ?? []} columns={columns} />
    </div>
  );
}
