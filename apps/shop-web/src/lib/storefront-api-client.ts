import { StorefrontClient } from "storefront-sdk";

export const storefrontApi = new StorefrontClient(
  import.meta.env.VITE_STOREFRONT_API_BASE_URL,
  import.meta.env.VITE_STOREFRONT_APP_KEY,
);
