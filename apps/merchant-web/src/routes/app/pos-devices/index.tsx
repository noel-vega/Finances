import { createFileRoute } from "@tanstack/react-router";
import { ListPosDevicesView } from "../../../features/pos-devices/views/list-pos-devices.view";
import { getListPosDevicesQueryOptions } from "../../../features/pos-devices/pos-devices.hooks";
import { getListLocationsQueryOptions } from "../../../features/locations/locations.hooks";
import { queryClient } from "../../../lib/react-query-client";

export const Route = createFileRoute("/app/pos-devices/")({
  staticData: { breadcrumb: "POS Devices" },
  beforeLoad: async () => {
    await Promise.all([
      queryClient.ensureQueryData(getListPosDevicesQueryOptions()),
      // the mint / edit forms need locations for the picker
      queryClient.ensureQueryData(getListLocationsQueryOptions()),
    ]);
  },
  component: ListPosDevicesView,
});
