import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/customers/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/customers/"!</div>
}
