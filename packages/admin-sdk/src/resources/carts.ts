import type { Client } from "openapi-fetch";
import type { paths } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createCartsResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async (params?: { limit?: number; offset?: number }) => {
      const query: paths["/carts"]["get"]["parameters"]["query"] = {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      };
      const { data } = await doRequest(() =>
        client.GET("/carts", { params: { query } }),
      );
      return data;
    },

    getById: async (id: number) => {
      const path: paths["/carts/{id}"]["get"]["parameters"]["path"] = {
        id: String(id),
      };
      const { data } = await doRequest(() =>
        client.GET("/carts/{id}", { params: { path } }),
      );
      return data;
    },
  };
}
