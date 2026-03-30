import { createFileRoute } from '@tanstack/react-router'
import Login from '@/auth/sigin-in/page'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Login /></div>
}
