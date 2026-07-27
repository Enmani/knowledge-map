import type {
  ContentValidationIssue,
  ContentValidationResult,
  IsoDate,
  KnowledgeCardContent,
} from './types'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value: string): value is IsoDate {
  if (!isoDatePattern.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

function findDuplicate(values: readonly string[]): string | undefined {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) return value
    seen.add(value)
  }
  return undefined
}

export function validateKnowledgeContent(content: KnowledgeCardContent): ContentValidationResult {
  const issues: ContentValidationIssue[] = []

  if (!content.id.trim() || !content.conceptId.trim()) {
    issues.push({ code: 'empty-id', message: '内容 ID 和概念 ID 均不能为空。' })
  }
  if (!content.summary.trim()) {
    issues.push({ code: 'empty-summary', message: `内容“${content.id}”缺少摘要。` })
  }

  const duplicateStoryId = findDuplicate(content.storyParagraphs.map((paragraph) => paragraph.id))
  if (duplicateStoryId) {
    issues.push({ code: 'duplicate-story-id', message: `故事段落 ID“${duplicateStoryId}”重复。` })
  }
  const duplicateSourceId = findDuplicate(content.sources.map((source) => source.id))
  if (duplicateSourceId) {
    issues.push({ code: 'duplicate-source-id', message: `来源 ID“${duplicateSourceId}”重复。` })
  }
  const duplicateWidgetId = findDuplicate(content.widgetIds)
  if (duplicateWidgetId) {
    issues.push({ code: 'duplicate-widget-id', message: `互动组件 ID“${duplicateWidgetId}”重复。` })
  }

  const reviewedAtValid = isValidIsoDate(content.reviewedAt)
  const reviewDueValid = isValidIsoDate(content.reviewDue)
  if (!reviewedAtValid || !reviewDueValid) {
    issues.push({ code: 'invalid-review-date', message: `内容“${content.id}”的复核日期格式无效。` })
  } else if (content.reviewDue < content.reviewedAt) {
    issues.push({ code: 'invalid-review-order', message: `内容“${content.id}”的下次复核日期早于最近复核日期。` })
  }

  return { valid: issues.length === 0, issues }
}

export function validateContentCatalog(
  contents: readonly KnowledgeCardContent[],
): ContentValidationResult {
  const issues = contents.flatMap((content) => validateKnowledgeContent(content).issues)
  const duplicateContentId = findDuplicate(contents.map((content) => content.id))
  if (duplicateContentId) {
    issues.push({ code: 'duplicate-content-id', message: `内容 ID“${duplicateContentId}”重复。` })
  }
  const duplicateConceptId = findDuplicate(contents.map((content) => content.conceptId))
  if (duplicateConceptId) {
    issues.push({ code: 'duplicate-concept-id', message: `概念 ID“${duplicateConceptId}”关联了多份卡片内容。` })
  }
  return { valid: issues.length === 0, issues }
}
