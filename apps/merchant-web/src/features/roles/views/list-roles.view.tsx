import { useQuery } from "@tanstack/react-query";
import { getListRolesQueryOptions } from "../roles.hooks";
import { DataTable } from "../../../components/data-table";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import type { RoleDetail } from "merchant-sdk";
import { PlusIcon } from "lucide-react";
import { format } from "date-fns";

const columns: ColumnDef<RoleDetail>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        {row.original.name}
        {row.original.isSystem && <Badge variant="secondary">System</Badge>}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description ?? "—",
  },
  {
    id: "permissionCount",
    header: "Permissions",
    cell: ({ row }) => row.original.permissions.length,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => format(new Date(row.original.createdAt), "MM/dd/yyyy hh:mm a"),
  },
];

export function ListRolesView() {
  const roles = useQuery(getListRolesQueryOptions());
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-end">
        <Link to="/app/roles/create">
          <Button>
            <PlusIcon /> Role
          </Button>
        </Link>
      </div>
      <DataTable
        data={roles.data ?? []}
        columns={columns}
        onRowClick={(row) => navigate({to: "/app/roles/$id", params: {id: row.original.id}})}
      />
    </div>
  );
}
