import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createOrdersResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async (params?: { limit?: number; offset?: number }) => {
      const query: paths["/orders"]["get"]["parameters"]["query"] = {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      };
      const { data } = await doRequest(() =>
        client.GET("/orders", { params: { query } }),
      );
      return data;
    },

    getById: async (id: number) => {
      const path: paths["/orders/{id}"]["get"]["parameters"]["path"] = {
        id: String(id),
      };
      const { data } = await doRequest(() =>
        client.GET("/orders/{id}", { params: { path } }),
      );
      return data;
    },

    transitionStatus: async (
      id: number,
      body: components["schemas"]["UpdateOrderStatusDto"],
    ) => {
      const { data } = await doRequest(() =>
        client.PATCH("/orders/{id}/status", { params: { path: { id } }, body }),
      );
      return data;
    },
  };
}
