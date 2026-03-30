import Dashboard from '@/app/dashboard/dashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {

  return <div><Dashboard /></div>
}
