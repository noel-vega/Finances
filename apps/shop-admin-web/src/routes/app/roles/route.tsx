import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/roles')({
  staticData: { breadcrumb: 'Roles' },
  component: Outlet,
})