import type { KnowledgeSpaceEdge, KnowledgeSpaceNode, ScienceDomainDefinition } from './types'
import { biologyEdges, biologyNodes } from './catalog/biology'
import { chemistryEdges, chemistryNodes } from './catalog/chemistry'
import { crossDomainEdges } from './catalog/bridges'
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
] as const

export const knowledgeSpaceNodes: readonly KnowledgeSpaceNode[] = [
  ...mathematicsNodes,
  ...physicsNodes,
  ...chemistryNodes,
  ...biologyNodes,
]

export const knowledgeSpaceEdges: readonly KnowledgeSpaceEdge[] = [
  ...mathematicsEdges,
  ...physicsEdges,
  ...chemistryEdges,
  ...biologyEdges,
  ...crossDomainEdges,
]
