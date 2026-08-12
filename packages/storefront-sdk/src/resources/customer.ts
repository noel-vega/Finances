import type { Client } from "openapi-fetch";
import type { components, paths } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createCustomerResource(client: Client<paths>, doRequest: DoFn) {
  return {
    get: async () => {
      const { data } = await doRequest(() => client.GET("/customer"));
      return data;
    },

    update: async (params: components["schemas"]["UpdateCustomerDto"]) => {
      const { data } = await doRequest(() =>
        client.PATCH("/customer", { body: params }),
      );
      return data;
    },
  };
}
