import type { WidgetId } from '../widgets/catalog'

export type IsoDate = `${number}-${number}-${number}`

export type FrontierStatus =
  | 'established'
  | 'active-research'
  | 'preliminary'
  | 'disputed'
  | 'open-problem'

export type SourceKind = 'textbook' | 'paper' | 'institution' | 'archive'

export interface StoryParagraph {
  id: string
  text: string
}

export interface ContentSource {
  id: string
  kind: SourceKind
  title: string
  creators: readonly string[]
  publisher?: string
  publishedYear?: number
  locator?: string
  url?: string
  accessedAt?: IsoDate
  license?: string
}

export interface KnowledgeCardContent {
  id: string
  conceptId: string
  summary: string
  storyParagraphs: readonly StoryParagraph[]
  sources: readonly ContentSource[]
  frontierStatus: FrontierStatus
  reviewedAt: IsoDate
  reviewDue: IsoDate
  widgetIds: readonly WidgetId[]
}

export interface ContentValidationIssue {
  code:
    | 'empty-id'
    | 'empty-summary'
    | 'duplicate-content-id'
    | 'duplicate-concept-id'
    | 'duplicate-story-id'
    | 'duplicate-source-id'
    | 'duplicate-widget-id'
    | 'invalid-review-date'
    | 'invalid-review-order'
  message: string
}

export interface ContentValidationResult {
  valid: boolean
  issues: readonly ContentValidationIssue[]
}
