import { RouteNotFound } from '@/components/route/RouteNotFound'

export default function NotFound() {
  return <RouteNotFound resource="Project" href="/find-work" linkLabel="Browse projects" />
}
