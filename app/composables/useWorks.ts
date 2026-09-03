import { PROJECT_CATEGORIES } from '~/lib/constants'

export type WorkKind = 'project' | 'playground'

export type Work = {
  id: string
  /** Internal route for projects; playgrounds have no detail page. */
  path?: string
  kind: WorkKind
  title: string
  description?: string
  cover: string
  media: 'image' | 'video'
  /** Intrinsic ratio when the source knows it, otherwise a 16:9 stand-in. */
  width: number
  height: number
  year?: number
  category?: string
  tags?: string[]
}

const FALLBACK_RATIO = { width: 16, height: 9 }

/**
 * One flat stream of work. Projects keep their editorial weight ordering and
 * lead; playgrounds follow, newest first. Everything the grid needs is
 * normalised here so the drafts only differ in how they render it.
 */
export function useWorks() {
  const { data: projects, pending: projectsPending, error: projectsError } = useAsyncData(
    'works-projects',
    () => queryCollection('projects').order('weight', 'ASC').all(),
  )

  const { data: playgrounds, pending: playgroundsPending, error: playgroundsError } = useAsyncData(
    'works-playgrounds',
    () => queryCollection('playgrounds').order('year', 'DESC').all(),
  )

  const pending = computed(() => projectsPending.value || playgroundsPending.value)
  const error = computed(() => projectsError.value || playgroundsError.value)

  const works = computed<Work[]>(() => [
    ...(projects.value ?? []).map((p: any) => ({
      id: p.id,
      path: p.path,
      kind: 'project' as const,
      title: p.title,
      description: p.description,
      cover: p.cover,
      media: p.type === 'video' ? ('video' as const) : ('image' as const),
      width: p.width ?? FALLBACK_RATIO.width,
      height: p.height ?? FALLBACK_RATIO.height,
      year: p.year,
      category: p.category,
      tags: p.tags,
    })),
    ...(playgrounds.value ?? []).map((p: any) => ({
      id: p.id,
      kind: 'playground' as const,
      title: p.title,
      description: p.description,
      cover: p.cover,
      media: 'image' as const,
      width: p.width ?? FALLBACK_RATIO.width,
      height: p.height ?? FALLBACK_RATIO.height,
      year: p.year,
      category: p.category,
      tags: p.tags,
    })),
  ])

  /** null = everything. Shared across pages so the choice survives navigation. */
  const category = useState<string | null>('work-category', () => null)

  const filtered = computed(() =>
    category.value === null
      ? works.value
      : works.value.filter(w => w.category === category.value),
  )

  const counts = computed(() => {
    const map: Record<string, number> = {}
    for (const c of PROJECT_CATEGORIES) {
      map[c] = works.value.filter(w => w.category === c).length
    }
    return map
  })

  function selectCategory(next: string | null) {
    category.value = category.value === next ? null : next
  }

  return {
    works,
    filtered,
    category,
    counts,
    categories: PROJECT_CATEGORIES,
    selectCategory,
    pending,
    error,
  }
}
