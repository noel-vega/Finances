import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createBrandsResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/brands"));
      return data;
    },

    create: async (params: components["schemas"]["CreateBrandDto"]) => {
      const { data } = await doRequest(() =>
        client.POST("/brands", { body: params }),
      );
      return data;
    },
  };
}
