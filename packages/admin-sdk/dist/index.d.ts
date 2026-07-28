import { type Client } from "openapi-fetch";
import type { paths, components } from "./types.gen.js";
export type Product = components["schemas"]["Product"];
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
        }[] | undefined>;
        create: (params: components["schemas"]["CreateProductDto"]) => Promise<{
            id: number;
            name: string;
            description: string | null;
            status: "draft" | "active" | "archived";
            createdAt: string;
            updatedAt: string;
        } | undefined>;
        getById: (id: number) => Promise<{
            id: number;
            name: string;
            description: string | null;
            status: "draft" | "active" | "archived";
            createdAt: string;
            updatedAt: string;
        } | undefined>;
    };
}
//# sourceMappingURL=index.d.ts.map