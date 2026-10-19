import type {
  FrontierCatalog,
  FrontierEntry,
  FrontierEntryStatus,
  FrontierIsoDate,
  FrontierQuery,
  FrontierSource,
} from './types'

const statusRank: Record<FrontierEntryStatus, number> = {
  published: 4,
  reviewed: 3,
  draft: 2,
  archived: 1,
}

export function isPublicFrontierEntry(entry: FrontierEntry): boolean {
  return entry.status === 'published' || entry.status === 'reviewed'
}

export function isDefaultFrontierEntry(entry: FrontierEntry): boolean {
  return isPublicFrontierEntry(entry) && entry.kind !== 'historical-milestone'
}

function compareCandidatePriority(left: FrontierEntry, right: FrontierEntry): number {
  return (
    statusRank[right.status] - statusRank[left.status] ||
    right.reviewedAt.localeCompare(left.reviewedAt) ||
    right.publishedAt.localeCompare(left.publishedAt) ||
    left.id.localeCompare(right.id, 'en')
  )
}

export function compareFrontierEntries(left: FrontierEntry, right: FrontierEntry): number {
  return (
    right.publishedAt.localeCompare(left.publishedAt) ||
    right.reviewedAt.localeCompare(left.reviewedAt) ||
    statusRank[right.status] - statusRank[left.status] ||
    left.title.localeCompare(right.title, 'zh-CN') ||
    left.id.localeCompare(right.id, 'en')
  )
}

export function deduplicateFrontierEntries(
  entries: readonly FrontierEntry[],
): FrontierEntry[] {
  const byKey = new Map<string, FrontierEntry>()
  for (const entry of entries) {
    const key = entry.dedupeKey.trim().toLocaleLowerCase('en')
    const current = byKey.get(key)
    if (!current || compareCandidatePriority(entry, current) < 0) {
      byKey.set(key, entry)
    }
  }
  return [...byKey.values()]
}

export function sortFrontierEntries(entries: readonly FrontierEntry[]): FrontierEntry[] {
  return [...entries].sort(compareFrontierEntries)
}

export function prepareFrontierEntries(entries: readonly FrontierEntry[]): FrontierEntry[] {
  return sortFrontierEntries(deduplicateFrontierEntries(entries))
}

export function getLatestBreakthroughEntries(
  entries: readonly FrontierEntry[],
): FrontierEntry[] {
  const latestByTrack = new Map<string, FrontierEntry>()
  const candidates = prepareFrontierEntries(entries.filter((entry) => (
    isPublicFrontierEntry(entry) &&
    entry.kind === 'historical-milestone' &&
    Boolean(entry.breakthroughTrack?.trim())
  )))

  for (const entry of candidates) {
    const track = entry.breakthroughTrack!.trim().toLocaleLowerCase('zh-CN')
    if (!latestByTrack.has(track)) latestByTrack.set(track, entry)
  }

  return [...latestByTrack.values()]
}

function normalizedSet(values: readonly string[] | undefined): Set<string> | undefined {
  if (!values?.length) return undefined
  return new Set(values.map((value) => value.trim().toLocaleLowerCase('zh-CN')))
}

function includesAny(haystack: readonly string[], needles: Set<string> | undefined): boolean {
  if (!needles) return true
  return haystack.some((value) => needles.has(value.toLocaleLowerCase('zh-CN')))
}

function isWithinDateRange(
  value: FrontierIsoDate,
  from: FrontierIsoDate | undefined,
  to: FrontierIsoDate | undefined,
): boolean {
  return (!from || value >= from) && (!to || value <= to)
}

export function queryFrontierEntries(
  catalog: Pick<FrontierCatalog, 'entries'>,
  query: FrontierQuery = {},
): FrontierEntry[] {
  const kinds = normalizedSet(query.kinds)
  const disciplines = normalizedSet(query.disciplines)
  const statuses = normalizedSet(query.statuses)
  const awardPrograms = normalizedSet(query.awardPrograms)
  const tags = normalizedSet(query.tags)
  const conceptIds = normalizedSet(query.conceptIds)
  const text = query.text?.trim().toLocaleLowerCase('zh-CN')

  const matches = catalog.entries.filter((entry) => {
    if (kinds && !kinds.has(entry.kind)) return false
    if (disciplines && !disciplines.has(entry.discipline)) return false
    if (statuses && !statuses.has(entry.status)) return false
    if (awardPrograms && (!entry.award || !awardPrograms.has(entry.award.program))) return false
    if (!includesAny(entry.tags, tags)) return false
    if (!includesAny(entry.relatedConceptIds, conceptIds)) return false
    if (!isWithinDateRange(entry.publishedAt, query.publishedFrom, query.publishedTo)) return false
    if (query.reviewDueOnOrBefore && entry.reviewDue > query.reviewDueOnOrBefore) return false
    if (text) {
      const searchable = [
        entry.title,
        entry.summary,
        entry.breakthroughTrack ?? '',
        entry.award?.program ?? '',
        ...entry.tags,
        ...entry.relatedConceptIds,
      ]
        .join('\n')
        .toLocaleLowerCase('zh-CN')
      if (!searchable.includes(text)) return false
    }
    return true
  })

  const prepared = prepareFrontierEntries(matches)
  if (query.limit === undefined) return prepared
  const safeLimit = Math.max(0, Math.floor(query.limit))
  return prepared.slice(0, safeLimit)
}

export function getFrontierEntryById(
  catalog: Pick<FrontierCatalog, 'entries'>,
  id: string,
): FrontierEntry | undefined {
  return catalog.entries.find((entry) => entry.id === id)
}

export function getFrontierEntryBySlug(
  catalog: Pick<FrontierCatalog, 'entries'>,
  slug: string,
): FrontierEntry | undefined {
  return catalog.entries.find((entry) => entry.slug === slug)
}

export function getFrontierSourceById(
  catalog: Pick<FrontierCatalog, 'sources'>,
  id: string,
): FrontierSource | undefined {
  return catalog.sources.find((source) => source.id === id)
}

export function getFrontierSourcesForEntry(
  catalog: FrontierCatalog,
  entryOrId: FrontierEntry | string,
): FrontierSource[] {
  const entry =
    typeof entryOrId === 'string' ? getFrontierEntryById(catalog, entryOrId) : entryOrId
  if (!entry) return []
  const sourceIds = new Set(entry.sourceIds)
  return catalog.sources.filter((source) => sourceIds.has(source.id))
}

export function getFrontierEntriesDueForReview(
  catalog: Pick<FrontierCatalog, 'entries'>,
  asOf: FrontierIsoDate,
): FrontierEntry[] {
  return prepareFrontierEntries(
    catalog.entries.filter((entry) => entry.status !== 'archived' && entry.reviewDue <= asOf),
  )
}
