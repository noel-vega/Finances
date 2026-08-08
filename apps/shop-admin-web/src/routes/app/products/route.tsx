import {
  createFileRoute,
  Outlet,
} from "@tanstack/react-router";

export const Route = createFileRoute("/app/products")({
  staticData: { breadcrumb: "Products" },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  );
}