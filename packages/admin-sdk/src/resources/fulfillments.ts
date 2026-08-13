import type { Client } from "openapi-fetch";
import type { components, paths } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createFulfillmentsResource(client: Client<paths>, doRequest: DoFn) {
  return {
    getRates: async (params: components["schemas"]["GetFulfillmentRatesDto"]) => {
      const { data } = await doRequest(() =>
        client.POST("/fulfillments/rates", { body: params }),
      );
      return data;
    },

    create: async (params: components["schemas"]["CreateFulfillmentDto"]) => {
      const { data } = await doRequest(() => client.POST("/fulfillments", { body: params }));
      return data;
    },
  };
}
