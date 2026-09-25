import 'server-only'
import { unstable_cache } from 'next/cache'
import { crewProfileRepo, projectRepo } from '@/lib/repo'

export const getFeaturedProjects = unstable_cache(
  () => projectRepo.findMany({ status: 'OPEN', take: 8 }),
  ['featured-projects'],
  { revalidate: 60, tags: ['projects'] },
)

export const getFeaturedCrew = unstable_cache(
  () => crewProfileRepo.findManyWithUser({ userRole: 'CREW', orderBy: 'createdAt', take: 10 }),
  ['featured-crew'],
  { revalidate: 60, tags: ['crew-profiles'] },
)

export const getPublicProjects = unstable_cache(
  () => projectRepo.findMany({ status: 'OPEN' }),
  ['public-projects'],
  { revalidate: 60, tags: ['projects'] },
)

export const getPublicCrew = unstable_cache(
  () => crewProfileRepo.findManyWithUser({ userRole: 'CREW' }),
  ['public-crew'],
  { revalidate: 60, tags: ['crew-profiles'] },
)

export function getPublicProject(param: string) {
  return unstable_cache(async () => {
    let project = await projectRepo.findById(param)
    if (project) return project
    const name = decodeURIComponent(param).replace(/-/g, ' ').trim()
    if (!name) return null
    project = await projectRepo.findFirstByProjectNameExact(name)
    return project ?? projectRepo.findFirstByProjectNameContainsAll(name.split(/\s+/).filter(Boolean))
  }, ['public-project', param], { revalidate: 300, tags: ['projects', `project:${param}`] })()
}

export function getPublicCrewProfile(param: string) {
  return unstable_cache(async () => {
    let crew = await crewProfileRepo.findByIdWithUser(param)
    if (crew) return crew
    const name = decodeURIComponent(param).replace(/-/g, ' ').trim()
    if (!name) return null
    crew = await crewProfileRepo.findFirstByUserNameExact(name)
    return crew ?? crewProfileRepo.findFirstByUserNameContainsAll(name.split(/\s+/).filter(Boolean))
  }, ['public-crew-profile', param], { revalidate: 300, tags: ['crew-profiles', `crew:${param}`] })()
}
