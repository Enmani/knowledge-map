import type { WidgetId } from '../widgets/catalog'

export type IsoDate = `${number}-${number}-${number}`

export type FrontierStatus =
  | 'established'
  | 'active-research'
  | 'preliminary'
  | 'disputed'
  | 'open-problem'

export type SourceKind = 'textbook' | 'paper' | 'institution' | 'archive'

export type KnowledgeArticleVisualKind =
  | 'calculus-change-and-accumulation'
  | 'matrix-world'

export interface KnowledgeArticleFormula {
  id: string
  expression: string
  explanation?: string
}

export interface KnowledgeArticleVisual {
  id: string
  kind: KnowledgeArticleVisualKind
  title: string
  description: string
  caption: string
}

export interface KnowledgeArticleSection {
  id: string
  title: string
  paragraphs: readonly string[]
  formulas?: readonly KnowledgeArticleFormula[]
  visual?: KnowledgeArticleVisual
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
  sections: readonly KnowledgeArticleSection[]
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
    | 'duplicate-section-id'
    | 'duplicate-formula-id'
    | 'duplicate-source-id'
    | 'duplicate-widget-id'
    | 'empty-section'
    | 'invalid-review-date'
    | 'invalid-review-order'
  message: string
}

export interface ContentValidationResult {
  valid: boolean
  issues: readonly ContentValidationIssue[]
}
