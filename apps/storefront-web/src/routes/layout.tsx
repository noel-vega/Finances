import { Link, Outlet, useLoaderData } from "react-router";
import { ShoppingCartIcon } from "lucide-react";
import { storefrontApi } from "../lib/storefront-api-client";

export async function layoutLoader() {
  // a missing cart (no token yet, or an unknown one) just means "empty" —
  // not an error
  const cart = await storefrontApi.cart.get();
  return { itemCount: cart?.itemCount ?? 0 };
}

export function Layout() {
  const { itemCount } = useLoaderData<typeof layoutLoader>();

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/products" className="text-lg font-medium">
            Shop
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
      </header>
      <Outlet />
    </div>
  );
}
