import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "ui/tabs";

export const Route = createFileRoute("/app/products")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <ProductsTabs />
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
}

const PRODUCTS_TABS = [
  { value: "categories", to: "/app/products/categories" },
  { value: "brands", to: "/app/products/brands" },
  { value: "products", to: "/app/products" },
] as const;

function ProductsTabs() {
  const loc = useLocation();
  const value =
    PRODUCTS_TABS.find((tab) => loc.pathname.startsWith(tab.to))?.value ??
    "products";
  return (
    <Tabs className="border-b py-2 px-4" value={value}>
      <TabsList variant="line" className="gap-3">
        <Link to="/app/products">
          <TabsTrigger className="p-2" value="products">
            Products
          </TabsTrigger>
        </Link>

        <Link to="/app/products/categories">
          <TabsTrigger className="p-2" value="categories">
            Categories
          </TabsTrigger>
        </Link>

        <Link to="/app/products/brands">
          <TabsTrigger className="p-2" value="brands">
            Brands
          </TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  );
}
