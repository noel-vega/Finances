import type { Client } from "openapi-fetch";
import type { paths } from "../types.gen.js";
import type { DoFn } from "../http.js";

// Paid checkouts whose order the worker couldn't write, and the replay action.
export function createFailedOrdersResource(
  client: Client<paths>,
  doRequest: DoFn,
) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/failed-orders"));
      return data;
    },

    retry: async (id: number) => {
      const path: paths["/failed-orders/{id}/retry"]["post"]["parameters"]["path"] =
        { id };
      const { data } = await doRequest(() =>
        client.POST("/failed-orders/{id}/retry", { params: { path } }),
      );
      return data;
    },
  };
}
