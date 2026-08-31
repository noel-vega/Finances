import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { InventoryRecord } from "merchant-sdk";
import { DataTable } from "../../../components/data-table";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { AdjustStockSheet } from "../../inventory/components/adjust-stock-sheet";

const LOW_STOCK_THRESHOLD = 0;

const columns: ColumnDef<InventoryRecord>[] = [
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
];

export function ProductInventoryTab(props: { records: InventoryRecord[] }) {
  const [adjustingRecord, setAdjustingRecord] = useState<InventoryRecord | null>(
    null,
  );

  const actionColumn: ColumnDef<InventoryRecord> = {
    id: "actions",
    cell: ({ row }) => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setAdjustingRecord(row.original)}
      >
        Adjust
      </Button>
    ),
  };

  return (
    <div className="space-y-4">
      <DataTable columns={[...columns, actionColumn]} data={props.records} />

      <AdjustStockSheet
        record={adjustingRecord}
        open={adjustingRecord !== null}
        onOpenChange={(open) => !open && setAdjustingRecord(null)}
      />
    </div>
  );
}
