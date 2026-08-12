import { createBrowserRouter, redirect } from "react-router";
import { Layout, layoutLoader } from "./routes/layout";
import { ProductsPage, productsLoader } from "./routes/products";
import { ProductPage, productLoader, productAction } from "./routes/product";
import { CartPage, cartLoader, cartAction } from "./routes/cart";
import { CheckoutPage, checkoutLoader } from "./routes/checkout";
import { CheckoutReturnPage } from "./routes/checkout-return";
import { SignUpPage, signupAction } from "./routes/signup";
import { SignInPage, signinAction } from "./routes/signin";
import { AccountPage, accountLoader, accountAction } from "./routes/account";
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
      {
        path: "checkout",
        element: <CheckoutPage />,
        loader: checkoutLoader,
        errorElement: <RouteError />,
      },
      {
        path: "checkout/return",
        element: <CheckoutReturnPage />,
        errorElement: <RouteError />,
      },
      {
        path: "signup",
        element: <SignUpPage />,
        action: signupAction,
        errorElement: <RouteError />,
      },
      {
        path: "signin",
        element: <SignInPage />,
        action: signinAction,
        errorElement: <RouteError />,
      },
      {
        path: "account",
        element: <AccountPage />,
        loader: accountLoader,
        action: accountAction,
        errorElement: <RouteError />,
      },
    ],
  },
]);
