import type { Client } from "openapi-fetch";
import type { components, paths } from "../types.gen.js";
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

    getShippingRates: async (id: number) => {
      const path: paths["/orders/{id}/shipping-rates"]["post"]["parameters"]["path"] =
        { id: String(id) };
      const { data } = await doRequest(() =>
        client.POST("/orders/{id}/shipping-rates", { params: { path } }),
      );
      return data;
    },

    buyShippingLabel: async (
      id: number,
      params: components["schemas"]["BuyShippingLabelDto"],
    ) => {
      const path: paths["/orders/{id}/shipping-label"]["post"]["parameters"]["path"] =
        { id: String(id) };
      const { data } = await doRequest(() =>
        client.POST("/orders/{id}/shipping-label", { params: { path }, body: params }),
      );
      return data;
    },
  };
}
