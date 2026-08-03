import { createFileRoute } from '@tanstack/react-router'
import { CreateLocationView } from '../../../features/locations/views/create-location.view'

export const Route = createFileRoute('/app/locations/create')({
  component: CreateLocationView,
})
