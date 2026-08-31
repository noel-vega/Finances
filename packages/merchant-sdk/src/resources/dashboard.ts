import type { Client } from "openapi-fetch";
import type { paths } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createDashboardResource(client: Client<paths>, doRequest: DoFn) {
  return {
    get: async () => {
      const { data } = await doRequest(() => client.GET("/dashboard"));
      return data;
    },
  };
}
