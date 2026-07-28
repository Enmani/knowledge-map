import { frontierCatalog } from './catalog'
import {
  deduplicateFrontierEntries,
  getFrontierEntriesDueForReview,
  getFrontierSourcesForEntry,
  isDefaultFrontierEntry,
  queryFrontierEntries,
} from './query'
import { validateFrontierCatalog } from './validation'

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const validation = validateFrontierCatalog(frontierCatalog)
expect(validation.valid, validation.issues.map((issue) => issue.message).join('\n'))

const fieldsEntries = queryFrontierEntries(frontierCatalog, { tags: ['菲尔兹奖'] })
expect(fieldsEntries.length === 1, '菲尔兹奖标签查询应返回关联研究条目。')
expect(fieldsEntries[0]?.kind === 'historical-milestone', '已解决的挂谷条目应进入历史分类。')

const openProblems = queryFrontierEntries(frontierCatalog, { kinds: ['open-problem'] })
expect(openProblems.length === 10, '开放问题查询应返回各学科的十条前沿问题。')
expect(
  openProblems.some((entry) => entry.tags.includes('希尔伯特问题')),
  '开放问题中应保留关联希尔伯特问题的黎曼猜想。',
)
expect(
  queryFrontierEntries(frontierCatalog, { disciplines: ['physics'], kinds: ['open-problem'] })
    .length === 2,
  '物理学科筛选应返回暗能量与夸克结构问题。',
)
expect(
  queryFrontierEntries(frontierCatalog, { disciplines: ['chemistry'], kinds: ['open-problem'] })
    .length === 2,
  '化学学科筛选应返回催化与空气捕碳问题。',
)
expect(
  queryFrontierEntries(frontierCatalog, { disciplines: ['biology'], kinds: ['open-problem'] })
    .length === 2,
  '生物学科筛选应返回人体细胞图谱与脑回路问题。',
)
expect(
  frontierCatalog.entries.filter(isDefaultFrontierEntry).every(
    (entry) => entry.kind !== 'historical-milestone',
  ),
  '默认前沿集合不应包含历史已解决问题。',
)

const fermatEntries = queryFrontierEntries(frontierCatalog, { text: '费马大定理' })
expect(fermatEntries.length === 1, '全文查询应返回费马大定理历史里程碑。')

expect(
  queryFrontierEntries(frontierCatalog, { kinds: ['award-overview', 'award-research'] })
    .length === 0,
  '奖项只作为研究标签时，不应生成独立奖项条目。',
)

const publishedCopy = { ...fieldsEntries[0], id: 'published-copy', status: 'published' as const }
const draftCopy = {
  ...fieldsEntries[0],
  id: 'draft-copy',
  status: 'draft' as const,
  reviewedAt: '2026-07-29' as const,
}
const deduplicated = deduplicateFrontierEntries([draftCopy, publishedCopy])
expect(deduplicated[0]?.id === 'published-copy', '去重应优先保留已发布条目。')

expect(
  getFrontierSourcesForEntry(frontierCatalog, fieldsEntries[0]).length === 2,
  '挂谷条目应同时关联原始论文与 IMU 官方来源。',
)
expect(
  getFrontierEntriesDueForReview(frontierCatalog, '2026-10-28').length === 2,
  '短期复核查询应包含两条挂谷预印本进展。',
)

console.log(`Frontier smoke test passed: ${frontierCatalog.entries.length} entries checked.`)
