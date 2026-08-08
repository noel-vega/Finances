import { type Client } from "openapi-fetch";
import type { paths, components } from "./types.gen.js";
import { createProductsResource } from "./resources/products.js";
import { createBrandsResource } from "./resources/brands.js";
import { createCategoriesResource } from "./resources/categories.js";
import { createLocationsResource } from "./resources/locations.js";
import { createInventoryResource } from "./resources/inventory.js";
import { createApiKeysResource } from "./resources/api-keys.js";
export type ApiKey = components["schemas"]["ApiKeyDto"];
export type Product = components["schemas"]["Product"];
export type ProductDetail = components["schemas"]["ProductDetail"];
export type ProductVariant = components["schemas"]["ProductVariant"];
export type ProductOption = components["schemas"]["ProductOption"];
export type CreateVariantsDto = components["schemas"]["CreateVariantsDto"];
export type Brand = components["schemas"]["Brand"];
export type Category = components["schemas"]["Category"];
export type Location = components["schemas"]["Location"];
export type InventoryRecord = components["schemas"]["InventoryRecord"];
export type InventoryMovementRecord = components["schemas"]["InventoryMovementRecord"];
export declare class AdminClient {
    accessToken: string | undefined;
    client: Client<paths>;
    products: ReturnType<typeof createProductsResource>;
    brands: ReturnType<typeof createBrandsResource>;
    categories: ReturnType<typeof createCategoriesResource>;
    locations: ReturnType<typeof createLocationsResource>;
    inventory: ReturnType<typeof createInventoryResource>;
    apiKeys: ReturnType<typeof createApiKeysResource>;
    private authMiddleware;
    constructor(baseUrl: string);
    signIn(credentials: components["schemas"]["SignInDto"]): Promise<string | undefined>;
    signUp(signup: components["schemas"]["SignUpDto"]): Promise<string | undefined>;
    refreshAccessToken(): Promise<string | undefined>;
    logout(): Promise<void>;
    private do;
}
//# sourceMappingURL=index.d.ts.map