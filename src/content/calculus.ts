import { DERIVATIVE_TANGENT_WIDGET_ID } from '../widgets/catalog'
import type { KnowledgeCardContent } from './types'

export const calculusContent = {
  id: 'content:calculus',
  conceptId: 'calculus',
  summary: '微积分研究连续变化与累积。导数描述某一时刻的局部变化率，积分汇总连续的小量，微积分基本定理把这两种运算连接起来。',
  storyParagraphs: [
    {
      id: 'calculus-story-change',
      text: '十七世纪的天文学、力学和几何问题持续提出同一种需求：如何描述瞬时速度、曲线切线和不断累积的量。牛顿与莱布尼茨分别形成了系统方法，后来的数学家继续完善极限与严格性。',
    },
    {
      id: 'calculus-story-local',
      text: '从割线看切线是一条可操作的路径。先取曲线上相邻的两点计算平均斜率，再让两点靠近。当斜率趋向稳定值时，这个极限给出基准点处的导数。',
    },
  ],
  sources: [
    {
      id: 'source:spivak-calculus-4e',
      kind: 'textbook',
      title: 'Calculus, Fourth Edition',
      creators: ['Michael Spivak'],
      publisher: 'Publish or Perish',
      publishedYear: 2008,
      locator: 'Chapters 9–14',
    },
    {
      id: 'source:apostol-calculus-v1-2e',
      kind: 'textbook',
      title: 'Calculus, Volume 1, Second Edition',
      creators: ['Tom M. Apostol'],
      publisher: 'Wiley',
      publishedYear: 1967,
      locator: 'Chapters 4–5',
    },
  ],
  frontierStatus: 'established',
  reviewedAt: '2026-07-25',
  reviewDue: '2027-07-25',
  widgetIds: [DERIVATIVE_TANGENT_WIDGET_ID],
} satisfies KnowledgeCardContent
