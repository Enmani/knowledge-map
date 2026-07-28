import type { KnowledgeSpaceEdge, KnowledgeSpaceNode, ScienceDomainDefinition } from './types'
import { biologyEdges, biologyNodes } from './catalog/biology'
import { chemistryEdges, chemistryNodes } from './catalog/chemistry'
import { computerScienceEdges, computerScienceNodes } from './catalog/computerScience'
import { crossDomainEdges } from './catalog/bridges'
import { earthEnvironmentalEdges, earthEnvironmentalNodes } from './catalog/earthEnvironmental'
import { mathematicsEdges, mathematicsNodes } from './catalog/mathematics'
import { physicsEdges, physicsNodes } from './catalog/physics'

export const scienceDomains: readonly ScienceDomainDefinition[] = [
  {
    id: 'mathematics', label: '数学', englishLabel: 'Mathematics', shortLabel: '数',
    color: '#496f9a', fieldColor: '#8fb8d7',
  },
  {
    id: 'physics', label: '物理', englishLabel: 'Physics', shortLabel: '理',
    color: '#8c5b8d', fieldColor: '#c6a8c7',
  },
  {
    id: 'chemistry', label: '化学', englishLabel: 'Chemistry', shortLabel: '化',
    color: '#a66c48', fieldColor: '#d7aa83',
  },
  {
    id: 'biology', label: '生物', englishLabel: 'Biology', shortLabel: '生',
    color: '#507d6b', fieldColor: '#91b9a5',
  },
  {
    id: 'computer-science', label: '计算机科学', englishLabel: 'Computer Science', shortLabel: '计',
    color: '#3f7184', fieldColor: '#82b2c0',
  },
  {
    id: 'earth-environmental', label: '地球与环境科学', englishLabel: 'Earth & Environmental Science', shortLabel: '地',
    color: '#7c7047', fieldColor: '#b9ae7c',
  },
] as const

export const knowledgeSpaceNodes: readonly KnowledgeSpaceNode[] = [
  ...mathematicsNodes,
  ...physicsNodes,
  ...chemistryNodes,
  ...biologyNodes,
  ...computerScienceNodes,
  ...earthEnvironmentalNodes,
]

export const knowledgeSpaceEdges: readonly KnowledgeSpaceEdge[] = [
  ...mathematicsEdges,
  ...physicsEdges,
  ...chemistryEdges,
  ...biologyEdges,
  ...computerScienceEdges,
  ...earthEnvironmentalEdges,
  ...crossDomainEdges,
]
