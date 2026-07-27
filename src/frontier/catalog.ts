import type { FrontierCatalog } from './types'
import { assertValidFrontierCatalog } from './validation'

export const frontierCatalog: FrontierCatalog = assertValidFrontierCatalog({
  sources: [
    {
      id: 'imu-fields-medal-program',
      kind: 'official-award',
      title: 'Fields Medal',
      publisher: 'International Mathematical Union',
      url: 'https://www.mathunion.org/imu-awards/fields-medal',
      accessedAt: '2026-07-25',
    },
    {
      id: 'nobel-prize-program',
      kind: 'official-award',
      title: 'All Nobel Prizes',
      publisher: 'Nobel Prize Outreach',
      url: 'https://www.nobelprize.org/prizes/',
      accessedAt: '2026-07-25',
    },
  ],
  entries: [
    {
      id: 'fields-medal-research-entry',
      slug: 'fields-medal-research-entry',
      dedupeKey: 'award-program:fields-medal',
      kind: 'award-overview',
      discipline: 'mathematics',
      title: '菲尔兹奖研究内容入口',
      summary:
        '用于收录经国际数学联盟资料核验的获奖研究主题和相关概念。当前条目不记录具体届次、获奖者或研究结论。',
      tags: ['菲尔兹奖', '数学前沿', '奖项'],
      relatedConceptIds: [],
      sourceIds: ['imu-fields-medal-program'],
      publishedAt: '2026-07-25',
      reviewedAt: '2026-07-25',
      reviewDue: '2027-01-25',
      status: 'published',
      award: { program: 'fields-medal' },
    },
    {
      id: 'nobel-prize-research-entry',
      slug: 'nobel-prize-research-entry',
      dedupeKey: 'award-program:nobel-prize',
      kind: 'award-overview',
      discipline: 'interdisciplinary',
      title: '诺贝尔奖研究内容入口',
      summary:
        '用于收录经诺贝尔奖官方资料核验的物理学、化学和生理学或医学研究主题。当前条目不记录具体届次、获奖者或研究结论。',
      tags: ['诺贝尔奖', '科学前沿', '奖项'],
      relatedConceptIds: [],
      sourceIds: ['nobel-prize-program'],
      publishedAt: '2026-07-25',
      reviewedAt: '2026-07-25',
      reviewDue: '2027-01-25',
      status: 'published',
      award: { program: 'nobel-prize' },
    },
  ],
})
