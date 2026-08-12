import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createUsersResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/users"));
      return data;
    },

    create: async (params: components["schemas"]["CreateUserDto"]) => {
      const { data } = await doRequest(() =>
        client.POST("/users", { body: params }),
      );
      return data;
    },
  };
}
