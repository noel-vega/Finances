import createClient, {} from "openapi-fetch";
export class AdminClient {
    accessToken;
    client;
    constructor(baseUrl) {
        this.client = createClient({ baseUrl });
    }
    async signIn(credentials) {
        // credentials: "include" so the backend's refresh_token cookie is stored;
        // without it the browser drops the cross-origin Set-Cookie response
        const { data } = await this.client.POST("/auth/signin", {
            body: credentials,
            credentials: "include",
        });
        this.accessToken = data?.access_token;
        return this.accessToken;
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
        update: async (id, params) => {
            const path = {
                id: String(id),
            };
            const { data } = await this.do(() => this.client.PATCH("/products/{id}", {
                params: { path },
                body: params,
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
        remove: async (id) => {
            const path = {
                id: String(id),
            };
            const { data } = await this.do(() => this.client.DELETE("/products/{id}", {
                params: { path },
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
        variants: {
            list: async (productId) => {
                const path = {
                    id: String(productId),
                };
                const { data } = await this.do(() => this.client.GET("/products/{id}/variants", {
                    params: { path },
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
            create: async (productId, params) => {
                const path = {
                    id: String(productId),
                };
                const { data } = await this.do(() => this.client.POST("/products/{id}/variants", {
                    params: { path },
                    body: params,
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
            update: async (productId, variantId, params) => {
                const path = {
                    id: String(productId),
                    variantId: String(variantId),
                };
                const { data } = await this.do(() => this.client.PATCH("/products/{id}/variants/{variantId}", {
                    params: { path },
                    body: params,
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
        },
        options: {
            list: async (productId) => {
                const path = {
                    id: String(productId),
                };
                const { data } = await this.do(() => this.client.GET("/products/{id}/options", {
                    params: { path },
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
            update: async (productId, optionId, params) => {
                const path = {
                    id: String(productId),
                    optionId: String(optionId),
                };
                const { data } = await this.do(() => this.client.PATCH("/products/{id}/options/{optionId}", {
                    params: { path },
                    body: params,
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
            remove: async (productId, optionId) => {
                const path = {
                    id: String(productId),
                    optionId: String(optionId),
                };
                const { data } = await this.do(() => this.client.DELETE("/products/{id}/options/{optionId}", {
                    params: { path },
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
            values: {
                remove: async (productId, optionId, valueId) => {
                    const path = {
                        id: String(productId),
                        optionId: String(optionId),
                        valueId: String(valueId),
                    };
                    const { data } = await this.do(() => this.client.DELETE("/products/{id}/options/{optionId}/values/{valueId}", {
                        params: { path },
                        credentials: "include",
                        headers: {
                            Authorization: `Bearer ${this.accessToken}`,
                        },
                    }));
                    return data;
                },
            },
        },
    };
    brands = {
        list: async () => {
            const { data } = await this.do(() => this.client.GET("/brands", {
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
        create: async (params) => {
            const { data } = await this.do(() => this.client.POST("/brands", {
                body: params,
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
    };
    categories = {
        list: async () => {
            const { data } = await this.do(() => this.client.GET("/categories", {
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
        create: async (params) => {
            const { data } = await this.do(() => this.client.POST("/categories", {
                body: params,
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
    };
    locations = {
        list: async () => {
            const { data } = await this.do(() => this.client.GET("/locations", {
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
        create: async (params) => {
            const { data } = await this.do(() => this.client.POST("/locations", {
                body: params,
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
    };
    inventory = {
        list: async () => {
            const { data } = await this.do(() => this.client.GET("/inventory", {
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }));
            return data;
        },
        movements: {
            list: async () => {
                const { data } = await this.do(() => this.client.GET("/inventory/movements", {
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
            create: async (params) => {
                const { data } = await this.do(() => this.client.POST("/inventory/movements", {
                    body: params,
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }));
                return data;
            },
        },
    };
}
//# sourceMappingURL=index.js.map