import { frontierCatalog } from './catalog'
import {
  deduplicateFrontierEntries,
  getFrontierEntriesDueForReview,
  getFrontierSourcesForEntry,
  queryFrontierEntries,
} from './query'
import { validateFrontierCatalog } from './validation'

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const validation = validateFrontierCatalog(frontierCatalog)
expect(validation.valid, validation.issues.map((issue) => issue.message).join('\n'))

const fieldsEntries = queryFrontierEntries(frontierCatalog, {
  awardPrograms: ['fields-medal'],
})
expect(fieldsEntries.length === 1, '菲尔兹奖类型查询应返回一个目录入口。')

const nobelEntries = queryFrontierEntries(frontierCatalog, { text: '诺贝尔奖' })
expect(nobelEntries.length === 1, '全文查询应返回诺贝尔奖目录入口。')

const publishedCopy = { ...fieldsEntries[0], id: 'published-copy', status: 'published' as const }
const draftCopy = {
  ...fieldsEntries[0],
  id: 'draft-copy',
  status: 'draft' as const,
  reviewedAt: '2026-07-26' as const,
}
const deduplicated = deduplicateFrontierEntries([draftCopy, publishedCopy])
expect(deduplicated[0]?.id === 'published-copy', '去重应优先保留已发布条目。')

expect(
  getFrontierSourcesForEntry(frontierCatalog, fieldsEntries[0]).length === 1,
  '条目应能查询到关联来源。',
)
expect(
  getFrontierEntriesDueForReview(frontierCatalog, '2027-01-25').length === 2,
  '复核日期查询应包含到期当天的条目。',
)

console.log(`Frontier smoke test passed: ${frontierCatalog.entries.length} entries checked.`)
