import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createInventoryResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/inventory"));
      return data;
    },

    movements: {
      list: async () => {
        const { data } = await doRequest(() =>
          client.GET("/inventory/movements"),
        );
        return data;
      },

      create: async (
        params: components["schemas"]["CreateInventoryMovementDto"],
      ) => {
        const { data } = await doRequest(() =>
          client.POST("/inventory/movements", { body: params }),
        );
        return data;
      },
    },
  };
}
