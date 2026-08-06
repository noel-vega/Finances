import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createProductsResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/products"));
      return data;
    },

    create: async (params: components["schemas"]["CreateProductDto"]) => {
      const { data } = await doRequest(() =>
        client.POST("/products", { body: params }),
      );
      return data;
    },

    getById: async (id: number) => {
      const path: paths["/products/{id}"]["get"]["parameters"]["path"] = {
        id: String(id),
      };
      const { data } = await doRequest(() =>
        client.GET("/products/{id}", { params: { path } }),
      );
      return data;
    },

    update: async (
      id: number,
      params: components["schemas"]["UpdateProductDto"],
    ) => {
      const path: paths["/products/{id}"]["patch"]["parameters"]["path"] = {
        id: String(id),
      };
      const { data } = await doRequest(() =>
        client.PATCH("/products/{id}", { params: { path }, body: params }),
      );
      return data;
    },

    remove: async (id: number) => {
      const path: paths["/products/{id}"]["delete"]["parameters"]["path"] = {
        id: String(id),
      };
      const { data } = await doRequest(() =>
        client.DELETE("/products/{id}", { params: { path } }),
      );
      return data;
    },

    variants: {
      list: async (productId: number) => {
        const path: paths["/products/{id}/variants"]["get"]["parameters"]["path"] =
          {
            id: String(productId),
          };
        const { data } = await doRequest(() =>
          client.GET("/products/{id}/variants", { params: { path } }),
        );
        return data;
      },

      create: async (
        productId: number,
        params: components["schemas"]["CreateVariantsDto"],
      ) => {
        const path: paths["/products/{id}/variants"]["post"]["parameters"]["path"] =
          {
            id: String(productId),
          };
        const { data } = await doRequest(() =>
          client.POST("/products/{id}/variants", {
            params: { path },
            body: params,
          }),
        );
        return data;
      },

      update: async (
        productId: number,
        variantId: number,
        params: components["schemas"]["UpdateVariantDto"],
      ) => {
        const path: paths["/products/{id}/variants/{variantId}"]["patch"]["parameters"]["path"] =
          {
            id: String(productId),
            variantId: String(variantId),
          };
        const { data } = await doRequest(() =>
          client.PATCH("/products/{id}/variants/{variantId}", {
            params: { path },
            body: params,
          }),
        );
        return data;
      },
    },

    options: {
      list: async (productId: number) => {
        const path: paths["/products/{id}/options"]["get"]["parameters"]["path"] =
          {
            id: String(productId),
          };
        const { data } = await doRequest(() =>
          client.GET("/products/{id}/options", { params: { path } }),
        );
        return data;
      },

      update: async (
        productId: number,
        optionId: number,
        params: components["schemas"]["UpdateProductOptionDto"],
      ) => {
        const path: paths["/products/{id}/options/{optionId}"]["patch"]["parameters"]["path"] =
          {
            id: String(productId),
            optionId: String(optionId),
          };
        const { data } = await doRequest(() =>
          client.PATCH("/products/{id}/options/{optionId}", {
            params: { path },
            body: params,
          }),
        );
        return data;
      },

      remove: async (productId: number, optionId: number) => {
        const path: paths["/products/{id}/options/{optionId}"]["delete"]["parameters"]["path"] =
          {
            id: String(productId),
            optionId: String(optionId),
          };
        const { data } = await doRequest(() =>
          client.DELETE("/products/{id}/options/{optionId}", {
            params: { path },
          }),
        );
        return data;
      },

      values: {
        remove: async (productId: number, optionId: number, valueId: number) => {
          const path: paths["/products/{id}/options/{optionId}/values/{valueId}"]["delete"]["parameters"]["path"] =
            {
              id: String(productId),
              optionId: String(optionId),
              valueId: String(valueId),
            };
          const { data } = await doRequest(() =>
            client.DELETE(
              "/products/{id}/options/{optionId}/values/{valueId}",
              { params: { path } },
            ),
          );
          return data;
        },
      },
    },
  };
}
