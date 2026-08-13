import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '../../../lib/react-query-client';
import { getPermissionsCatalogQueryOptions } from '../../../features/roles/roles.hooks';

export const Route = createFileRoute('/app/roles')({
  staticData: { breadcrumb: 'Roles' },

  beforeLoad: async () => {
    await Promise.all([
      queryClient.ensureQueryData(getPermissionsCatalogQueryOptions()),
    ]);
  },
  component: Outlet,
})