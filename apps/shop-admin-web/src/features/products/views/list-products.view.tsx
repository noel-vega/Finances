import { useQuery } from "@tanstack/react-query";
import { getListProductsQueryOptions } from "../products.hooks";
import { DataTable } from "../../../components/data-table";
import { Button } from "ui/button";
import { Link } from "@tanstack/react-router";
import { InputGroup, InputGroupAddon, InputGroupInput } from "ui/input-group";
import { PlusIcon, SearchIcon } from "lucide-react";

export function InventoryView() {
  const products = useQuery(getListProductsQueryOptions());
  console.log(products.data);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <InputGroup>
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <Link to="/app/products/create">
          <Button><PlusIcon />Add Product</Button>
        </Link>
      </div>
      <DataTable data={products.data ?? []} columns={[]} />
    </div>
  );
}
