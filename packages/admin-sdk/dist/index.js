import createClient, {} from "openapi-fetch";
export class AdminClient {
    accessToken;
    client;
    constructor(baseUrl) {
        this.client = createClient({ baseUrl });
    }
    async signIn(credentials) {
        const { data } = await this.client.POST("/auth/signin", {
            body: credentials,
        });
        return data?.access_token;
    }
    async refreshAccessToken() {
        const { data } = await this.client.GET("/auth/token/refresh", {
            credentials: "include",
        });
        this.accessToken = data?.access_token;
        return this.accessToken;
    }
    // request is a thunk so the retry rebuilds headers off the refreshed accessToken, not a stale one
    async do(request) {
        const result = await request();
        if (result.response.status === 401) {
            await this.refreshAccessToken();
            return await request();
        }
        return result;
    }
    products = {
        list: async () => {
            const { data } = await this.do(() => this.client.GET("/products", {
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
        create: async (params) => {
            const { data } = await this.do(() => {
                return this.client.POST("/products", {
                    body: params,
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                });
            });
            return data;
        },
        getById: async (id) => {
            const path = {
                id: String(id),
            };
            const { data } = await this.do(() => this.client.GET("/products/{id}", {
                params: { path },
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
    };
}
//# sourceMappingURL=index.js.map