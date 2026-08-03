import { type Client } from "openapi-fetch";
import type { paths, components } from "./types.gen.js";
export type Product = components["schemas"]["Product"];
export type ProductVariant = components["schemas"]["ProductVariant"];
export type ProductOption = components["schemas"]["ProductOption"];
export type CreateVariantsDto = components["schemas"]["CreateVariantsDto"];
export type Brand = components["schemas"]["Brand"];
export type Category = components["schemas"]["Category"];
export declare class AdminClient {
    accessToken: string | undefined;
    client: Client<paths>;
    constructor(baseUrl: string);
    signIn(credentials: components["schemas"]["SignInDto"]): Promise<string | undefined>;
    refreshAccessToken(): Promise<string | undefined>;
    private do;
    products: {
        list: () => Promise<{
            id: number;
            name: string;
            description: string | null;
            status: "draft" | "active" | "archived";
            createdAt: string;
            updatedAt: string;
            brandId: number | null;
        }[] | undefined>;
        create: (params: components["schemas"]["CreateProductDto"]) => Promise<{
            id: number;
            name: string;
            description: string | null;
            status: "draft" | "active" | "archived";
            createdAt: string;
            updatedAt: string;
            brandId: number | null;
        } | undefined>;
        getById: (id: number) => Promise<{
            id: number;
            name: string;
            description: string | null;
            status: "draft" | "active" | "archived";
            createdAt: string;
            updatedAt: string;
            brandId: number | null;
        } | undefined>;
        update: (id: number, params: components["schemas"]["UpdateProductDto"]) => Promise<{
            id: number;
            name: string;
            description: string | null;
            status: "draft" | "active" | "archived";
            createdAt: string;
            updatedAt: string;
            brandId: number | null;
        } | undefined>;
        remove: (id: number) => Promise<{
            id: number;
            name: string;
            description: string | null;
            status: "draft" | "active" | "archived";
            createdAt: string;
            updatedAt: string;
            brandId: number | null;
        } | undefined>;
        variants: {
            list: (productId: number) => Promise<{
                id: number;
                productId: number;
                priceCents: number;
                sku: string | null;
                createdAt: string;
                updatedAt: string;
                stock: number;
                optionValues: {
                    optionName: string;
                    value: string;
                }[];
            }[] | undefined>;
            create: (productId: number, params: components["schemas"]["CreateVariantsDto"]) => Promise<{
                id: number;
                productId: number;
                priceCents: number;
                sku: string | null;
                createdAt: string;
                updatedAt: string;
                stock: number;
                optionValues: {
                    optionName: string;
                    value: string;
                }[];
            }[] | undefined>;
        };
        options: {
            list: (productId: number) => Promise<{
                id: number;
                productId: number;
                name: string;
                values: {
                    id: number;
                    value: string;
                }[];
            }[] | undefined>;
            update: (productId: number, optionId: number, params: components["schemas"]["UpdateProductOptionDto"]) => Promise<{
                id: number;
                productId: number;
                name: string;
                values: {
                    id: number;
                    value: string;
                }[];
            } | undefined>;
            remove: (productId: number, optionId: number) => Promise<{
                id: number;
                productId: number;
                name: string;
                values: {
                    id: number;
                    value: string;
                }[];
            } | undefined>;
            values: {
                remove: (productId: number, optionId: number, valueId: number) => Promise<{
                    id: number;
                    productId: number;
                    name: string;
                    values: {
                        id: number;
                        value: string;
                    }[];
                } | undefined>;
            };
        };
    };
    brands: {
        list: () => Promise<{
            id: number;
            name: string;
            createdAt: string;
            updatedAt: string;
        }[] | undefined>;
        create: (params: components["schemas"]["CreateBrandDto"]) => Promise<{
            id: number;
            name: string;
            createdAt: string;
            updatedAt: string;
        } | undefined>;
    };
    categories: {
        list: () => Promise<{
            id: number;
            name: string;
            createdAt: string;
            updatedAt: string;
        }[] | undefined>;
        create: (params: components["schemas"]["CreateCategoryDto"]) => Promise<{
            id: number;
            name: string;
            createdAt: string;
            updatedAt: string;
        } | undefined>;
    };
}
//# sourceMappingURL=index.d.ts.map