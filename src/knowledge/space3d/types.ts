export type ScienceDomainId = 'mathematics' | 'physics' | 'chemistry' | 'biology'

export type KnowledgeLensId =
  | 'world'
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'bridges'

export type KnowledgeRelationType =
  | 'prerequisite'
  | 'application'
  | 'analogy'
  | 'historical'
  | 'shared-model'

export type SpaceVector3 = readonly [x: number, y: number, z: number]

export interface ScienceDomainDefinition {
  id: ScienceDomainId
  label: string
  englishLabel: string
  shortLabel: string
  color: string
  fieldColor: string
}

/** Stable public knowledge record. Lenses and user state may project it, but never mutate it. */
export interface KnowledgeSpaceNode {
  id: string
  title: string
  englishTitle: string
  summary: string
  primaryDomain: ScienceDomainId
  domains: readonly ScienceDomainId[]
  tags: readonly string[]
  level: 0 | 1 | 2 | 3 | 4
  importance?: number
}

export interface KnowledgeSpaceEdge {
  id: string
  source: string
  target: string
  type: KnowledgeRelationType
  /** Prerequisite edges default to strict. Recommended edges do not affect knowledge depth. */
  prerequisiteKind?: 'strict' | 'recommended'
  strength: number
  label?: string
}

export interface KnowledgeLensDefinition {
  id: KnowledgeLensId
  label: string
  description: string
  focusDomains: readonly ScienceDomainId[]
  domainWeights: Readonly<Record<ScienceDomainId, number>>
  relationWeights: Readonly<Record<KnowledgeRelationType, number>>
  cameraPosition: SpaceVector3
  cameraTarget: SpaceVector3
}

export interface ProjectedKnowledgeNode {
  node: KnowledgeSpaceNode
  position: SpaceVector3
  opacity: number
  scale: number
  emphasis: number
  /** Longest strict-prerequisite depth, calibrated by the canonical level. */
  knowledgeDepth: number
  /** Stable semantic distance from the center of the public knowledge sphere. */
  radius: number
  /** Hidden filtered nodes remain in the projection only to preserve renderer identity. */
  visible: boolean
  /** A filtered-out node must never take part in pointer hit testing. */
  interactive: boolean
  visibility: 'matched' | 'prerequisite' | 'bridge' | 'context' | 'hidden'
}

export interface ProjectedKnowledgeEdge {
  edge: KnowledgeSpaceEdge
  opacity: number
  emphasis: number
}

export interface ProjectedFieldLobe {
  nodeId: string
  center: SpaceVector3
  radius: number
  opacity: number
}

export interface ProjectedKnowledgeField {
  id: string
  kind: 'domain' | 'tag'
  label: string
  color: string
  domain?: ScienceDomainDefinition
  tag?: string
  center: SpaceVector3
  radius: number
  opacity: number
  lobes: readonly ProjectedFieldLobe[]
}

export interface KnowledgeSpaceProjection {
  lens: KnowledgeLensDefinition
  sphere: KnowledgeSphereParameters
  nodes: readonly ProjectedKnowledgeNode[]
  edges: readonly ProjectedKnowledgeEdge[]
  fields: readonly ProjectedKnowledgeField[]
}

export interface KnowledgeSpaceDataset {
  domains: readonly ScienceDomainDefinition[]
  nodes: readonly KnowledgeSpaceNode[]
  edges: readonly KnowledgeSpaceEdge[]
  lenses: readonly KnowledgeLensDefinition[]
}

export interface ProjectionOptions {
  collisionPadding?: number
  relaxationIterations?: number
  sphere?: Partial<KnowledgeSphereParameters>
  domainFilter?: ScienceDomainId | null
  filterMode?: 'none' | 'temporary' | 'focus'
  focus?: KnowledgeSpaceFocus
}

export interface KnowledgeSphereParameters {
  coreRadius: number
  outerRadius: number
  radialGamma: number
  radialJitter: number
  globalAnchorWeight: number
}

export interface KnowledgeSpaceFocus {
  /** At least one selector is required. Multiple selectors use intersection semantics. */
  domain?: ScienceDomainId
  tags?: readonly string[]
  nodeIds?: readonly string[]
  includePrerequisites?: boolean
  includeBridges?: boolean
  /** Contribution of the public angular position to the focused position. */
  globalAnchorWeight?: number
}
