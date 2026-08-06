import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createCategoriesResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/categories"));
      return data;
    },

    create: async (params: components["schemas"]["CreateCategoryDto"]) => {
      const { data } = await doRequest(() =>
        client.POST("/categories", { body: params }),
      );
      return data;
    },
  };
}
