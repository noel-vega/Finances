import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createLocationsResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/locations"));
      return data;
    },

    create: async (params: components["schemas"]["CreateLocationDto"]) => {
      const { data } = await doRequest(() =>
        client.POST("/locations", { body: params }),
      );
      return data;
    },
  };
}
