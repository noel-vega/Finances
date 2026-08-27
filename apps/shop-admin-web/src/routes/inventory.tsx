import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory')({
  beforeLoad: () => {
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/inventory"!</div>
}
