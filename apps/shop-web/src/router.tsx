import { createBrowserRouter, redirect } from "react-router";
import { ProductsPage, productsLoader } from "./routes/products";
import { ProductPage, productLoader } from "./routes/product";
import { RouteError } from "./routes/route-error";

export const router = createBrowserRouter([
  {
    index: true,
    loader: () => redirect("/products"),
  },
  {
    path: "/products",
    element: <ProductsPage />,
    loader: productsLoader,
    errorElement: <RouteError />,
  },
  {
    path: "/products/:id",
    element: <ProductPage />,
    loader: productLoader,
    errorElement: <RouteError />,
  },
]);
