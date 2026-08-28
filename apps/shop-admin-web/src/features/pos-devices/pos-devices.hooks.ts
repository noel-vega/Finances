import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { adminApi } from "../../lib/admin-api-client";
import { queryClient } from "../../lib/react-query-client";

export function getListPosDevicesQueryOptions() {
  return queryOptions({
    queryKey: ["pos-devices"],
    queryFn: adminApi.posDevices.list,
  });
}

export function useListPosDevicesQuery() {
  return useQuery(getListPosDevicesQueryOptions());
}

function invalidatePosDevices() {
  queryClient.invalidateQueries(getListPosDevicesQueryOptions());
}

export function useCreatePosDeviceMutation() {
  return useMutation({
    mutationFn: adminApi.posDevices.create,
    onSuccess: invalidatePosDevices,
  });
}

export function useUpdatePosDeviceMutation() {
  return useMutation({
    mutationFn: ({
      id,
      ...params
    }: { id: number } & Parameters<typeof adminApi.posDevices.update>[1]) =>
      adminApi.posDevices.update(id, params),
    onSuccess: invalidatePosDevices,
  });
}

export function useRevokePosDeviceMutation() {
  return useMutation({
    mutationFn: adminApi.posDevices.revoke,
    onSuccess: invalidatePosDevices,
  });
}

export function useRotatePairingMutation() {
  return useMutation({
    mutationFn: adminApi.posDevices.rotatePairing,
    onSuccess: invalidatePosDevices,
  });
}
