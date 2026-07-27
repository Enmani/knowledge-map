export type FrontierIsoDate = `${number}-${number}-${number}`

export type FrontierDiscipline =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'interdisciplinary'

export type FrontierEntryKind = 'research-update' | 'award-overview' | 'award-research'

export type FrontierEntryStatus = 'draft' | 'reviewed' | 'published' | 'archived'

export type FrontierSourceKind =
  | 'official-award'
  | 'institution'
  | 'journal'
  | 'preprint'
  | 'dataset'

export type AwardProgram = 'fields-medal' | 'nobel-prize'

export interface FrontierSource {
  id: string
  kind: FrontierSourceKind
  title: string
  publisher: string
  url: string
  publishedAt?: FrontierIsoDate
  accessedAt: FrontierIsoDate
}

export interface FrontierAwardMetadata {
  program: AwardProgram
  cycleYear?: number
  category?: string
}

export interface FrontierEntry {
  id: string
  slug: string
  dedupeKey: string
  kind: FrontierEntryKind
  discipline: FrontierDiscipline
  title: string
  summary: string
  tags: readonly string[]
  relatedConceptIds: readonly string[]
  sourceIds: readonly string[]
  publishedAt: FrontierIsoDate
  reviewedAt: FrontierIsoDate
  reviewDue: FrontierIsoDate
  status: FrontierEntryStatus
  award?: FrontierAwardMetadata
}

export interface FrontierCatalog {
  entries: readonly FrontierEntry[]
  sources: readonly FrontierSource[]
}

export type FrontierValidationSeverity = 'error' | 'warning'

export type FrontierValidationCode =
  | 'empty-field'
  | 'invalid-date'
  | 'invalid-date-order'
  | 'invalid-url'
  | 'duplicate-entry-id'
  | 'duplicate-entry-slug'
  | 'duplicate-source-id'
  | 'duplicate-list-value'
  | 'duplicate-dedupe-key'
  | 'missing-source'
  | 'source-required'
  | 'award-metadata-required'
  | 'award-cycle-required'
  | 'invalid-award-cycle'

export interface FrontierValidationIssue {
  code: FrontierValidationCode
  severity: FrontierValidationSeverity
  message: string
  entryId?: string
  sourceId?: string
}

export interface FrontierValidationResult {
  valid: boolean
  issues: readonly FrontierValidationIssue[]
}

export interface FrontierQuery {
  text?: string
  kinds?: readonly FrontierEntryKind[]
  disciplines?: readonly FrontierDiscipline[]
  statuses?: readonly FrontierEntryStatus[]
  awardPrograms?: readonly AwardProgram[]
  tags?: readonly string[]
  conceptIds?: readonly string[]
  publishedFrom?: FrontierIsoDate
  publishedTo?: FrontierIsoDate
  reviewDueOnOrBefore?: FrontierIsoDate
  limit?: number
}
