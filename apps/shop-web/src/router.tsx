import { createBrowserRouter, redirect } from "react-router";
import { Layout, layoutLoader } from "./routes/layout";
import { ProductsPage, productsLoader } from "./routes/products";
import { ProductPage, productLoader, productAction } from "./routes/product";
import { CartPage, cartLoader, cartAction } from "./routes/cart";
import { RouteError } from "./routes/route-error";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    loader: layoutLoader,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        loader: () => redirect("/products"),
      },
      {
        path: "products",
        element: <ProductsPage />,
        loader: productsLoader,
        errorElement: <RouteError />,
      },
      {
        path: "products/:id",
        element: <ProductPage />,
        loader: productLoader,
        action: productAction,
        errorElement: <RouteError />,
      },
      {
        path: "cart",
        element: <CartPage />,
        loader: cartLoader,
        action: cartAction,
        errorElement: <RouteError />,
      },
    ],
  },
]);
