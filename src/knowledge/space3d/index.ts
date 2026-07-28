import { knowledgeSpaceEdges, knowledgeSpaceNodes, scienceDomains } from './data'
import { knowledgeLenses } from './lenses'
import type { KnowledgeSpaceDataset } from './types'

export const publicKnowledgeSpace: KnowledgeSpaceDataset = {
  domains: scienceDomains,
  nodes: knowledgeSpaceNodes,
  edges: knowledgeSpaceEdges,
  lenses: knowledgeLenses,
}

export * from './types'
export * from './data'
export * from './lenses'
export * from './projection'
