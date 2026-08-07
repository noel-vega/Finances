import type { Client } from "openapi-fetch";
import type { paths } from "../types.gen.js";

export function createProductsResource(client: Client<paths>) {
  return {
    list: async (
      query: paths["/products"]["get"]["parameters"]["query"] = {},
    ) => {
      const { data } = await client.GET("/products", { params: { query } });
      return data;
    },

    getById: async (id: number) => {
      const path: paths["/products/{id}"]["get"]["parameters"]["path"] = {
        id: String(id),
      };
      const { data } = await client.GET("/products/{id}", { params: { path } });
      return data;
    },
  };
}
