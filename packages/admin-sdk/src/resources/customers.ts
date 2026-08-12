import type { Client } from "openapi-fetch";
import type { paths } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createCustomersResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/customers"));
      return data;
    },
  };
}
