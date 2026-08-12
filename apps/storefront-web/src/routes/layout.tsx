import { Link, Outlet, useLoaderData } from "react-router";
import { ShoppingCartIcon, UserIcon } from "lucide-react";
import { storefrontApi } from "../lib/storefront-api-client";

export async function layoutLoader() {
  // a missing cart (no token yet, or an unknown one) just means "empty" —
  // not an error. Same for customer: no session is the common case, not a
  // failure, so this only checks for "are we signed in" — not surfaced as
  // an error anywhere.
  const [cart, customer] = await Promise.all([
    storefrontApi.cart.get(),
    storefrontApi.customer.get(),
  ]);
  return { itemCount: cart?.itemCount ?? 0, signedIn: !!customer };
}

export function Layout() {
  const { itemCount, signedIn } = useLoaderData<typeof layoutLoader>();

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/products" className="text-lg font-medium">
            Shop
          </Link>
          <div className="flex items-center gap-6">
            <Link to={signedIn ? "/account" : "/signin"} className="flex items-center gap-2 text-sm">
              <UserIcon className="size-5" />
              {signedIn ? "Account" : "Sign in"}
            </Link>
            <Link to="/cart" className="flex items-center gap-2 text-sm">
              <ShoppingCartIcon className="size-5" />
              Cart
              {itemCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
