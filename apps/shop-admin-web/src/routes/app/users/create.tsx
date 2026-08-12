import { createFileRoute } from '@tanstack/react-router'
import { CreateUserView } from '../../../features/users/views/create-user.view'

export const Route = createFileRoute('/app/users/create')({
  staticData: { breadcrumb: 'Add staff' },
  component: CreateUserView,
})
