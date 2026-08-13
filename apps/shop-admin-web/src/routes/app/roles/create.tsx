import { createFileRoute } from '@tanstack/react-router'
import { CreateRoleView } from '../../../features/roles/views/create-role.view'

export const Route = createFileRoute('/app/roles/create')({
  staticData: { breadcrumb: 'Create' },
  component: CreateRoleView,
})
