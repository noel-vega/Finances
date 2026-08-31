import type { Client } from "openapi-fetch";
import type { paths, components } from "../types.gen.js";
import type { DoFn } from "../http.js";

export function createPosDevicesResource(client: Client<paths>, doRequest: DoFn) {
  return {
    list: async () => {
      const { data } = await doRequest(() => client.GET("/pos-devices"));
      return data;
    },

    create: async (params: components["schemas"]["CreatePosDeviceDto"]) => {
      const { data } = await doRequest(() =>
        client.POST("/pos-devices", { body: params }),
      );
      return data;
    },

    update: async (
      id: number,
      params: components["schemas"]["UpdatePosDeviceDto"],
    ) => {
      const path: paths["/pos-devices/{id}"]["patch"]["parameters"]["path"] = {
        id: String(id),
      };
      const { data } = await doRequest(() =>
        client.PATCH("/pos-devices/{id}", { params: { path }, body: params }),
      );
      return data;
    },

    revoke: async (id: number) => {
      const path: paths["/pos-devices/{id}/revoke"]["post"]["parameters"]["path"] =
        { id: String(id) };
      const { data } = await doRequest(() =>
        client.POST("/pos-devices/{id}/revoke", { params: { path } }),
      );
      return data;
    },

    // fails server-side if the device is already paired or revoked
    rotatePairing: async (id: number) => {
      const path: paths["/pos-devices/{id}/rotate-pairing"]["post"]["parameters"]["path"] =
        { id: String(id) };
      const { data } = await doRequest(() =>
        client.POST("/pos-devices/{id}/rotate-pairing", { params: { path } }),
      );
      return data;
    },
  };
}
