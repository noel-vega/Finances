import { type Client } from "openapi-fetch";
import type { paths, components } from "./types.gen.js";
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
        }[] | undefined>;
    };
}
//# sourceMappingURL=index.d.ts.map