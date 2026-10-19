import type {
  KnowledgeSpaceEdge,
  KnowledgeSpaceNode,
  ScienceDomainId,
} from '../types'

export interface NodeInput {
  id: string
  canonicalConceptId?: string
  title: string
  englishTitle: string
  summary: string
  primaryDomain: ScienceDomainId
  domains?: readonly ScienceDomainId[]
  tags: readonly string[]
  level: 0 | 1 | 2 | 3 | 4
  importance?: number
}

export const defineNode = ({ domains, ...node }: NodeInput): KnowledgeSpaceNode => ({
  ...node,
  domains: domains ?? [node.primaryDomain],
})

export type EdgeInput = Omit<KnowledgeSpaceEdge, 'id'> & { id?: string }

export const defineEdge = (input: EdgeInput): KnowledgeSpaceEdge => ({
  ...input,
  id: input.id ?? `${input.source}--${input.type}--${input.target}`,
})

export interface CatalogNodeInput extends NodeInput {
  strict?: readonly string[]
  recommended?: readonly string[]
}

export const buildCatalog = (entries: readonly CatalogNodeInput[]) => {
  const nodes = entries.map(({ strict: _strict, recommended: _recommended, ...node }) => defineNode(node))
  const edges = entries.flatMap((entry) => [
    ...(entry.strict ?? []).map((source) => defineEdge({
      source,
      target: entry.id,
      type: 'prerequisite',
      prerequisiteKind: 'strict',
      strength: 0.88,
    })),
    ...(entry.recommended ?? []).map((source) => defineEdge({
      source,
      target: entry.id,
      type: 'prerequisite',
      prerequisiteKind: 'recommended',
      strength: 0.64,
    })),
  ])
  return { nodes, edges } as const
}
