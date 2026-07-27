export type ConceptId = string
export type SpaceId = string
export type PlacementId = string
export type RelationId = string

export type PlacementRole = 'canonical' | 'alias'

export type RelationType =
  | 'required'
  | 'recommended'
  | 'related'
  | 'analogy'
  | 'application'
  | 'historical'

export type ProgressLevel = 'unknown' | 'sensed' | 'discovered' | 'mastered'

export interface UnlockRule {
  allOf?: readonly ConceptId[]
  anyOf?: readonly ConceptId[]
  minimumLevel?: Exclude<ProgressLevel, 'unknown'>
}

export interface Concept {
  id: ConceptId
  title: string
  tags: readonly string[]
  summary?: string
  contentRef?: string
  unlockRule?: UnlockRule
  metadata?: Readonly<Record<string, unknown>>
}

export interface KnowledgeSpace {
  id: SpaceId
  title?: string
  ownerConceptId?: ConceptId
  width: number
  height: number
  layoutVersion: number
}

export interface Placement {
  id: PlacementId
  spaceId: SpaceId
  conceptId: ConceptId
  role: PlacementRole
  x: number
  y: number
  width: number
  height: number
  childSpaceId?: SpaceId
  aliasOfPlacementId?: PlacementId
  importance?: number
}

export interface Relation {
  id: RelationId
  from: ConceptId
  to: ConceptId
  type: RelationType
  label?: string
  weight?: number
  metadata?: Readonly<Record<string, unknown>>
}

export interface ProgressState {
  conceptId: ConceptId
  level: ProgressLevel
  completedInteractionIds?: readonly string[]
  updatedAt?: string
}

export interface KnowledgeAtlas {
  concepts: readonly Concept[]
  spaces: readonly KnowledgeSpace[]
  placements: readonly Placement[]
  relations: readonly Relation[]
}

export interface KnowledgeIndex {
  concepts: ReadonlyMap<ConceptId, Concept>
  spaces: ReadonlyMap<SpaceId, KnowledgeSpace>
  placements: ReadonlyMap<PlacementId, Placement>
  relations: ReadonlyMap<RelationId, Relation>
  placementsBySpace: ReadonlyMap<SpaceId, readonly Placement[]>
}

/** Build once per atlas revision and share with projection and rendering code. */
export function createKnowledgeIndex(atlas: KnowledgeAtlas): KnowledgeIndex {
  const placementsBySpace = new Map<SpaceId, Placement[]>()

  for (const placement of atlas.placements) {
    const placements = placementsBySpace.get(placement.spaceId)
    if (placements) {
      placements.push(placement)
    } else {
      placementsBySpace.set(placement.spaceId, [placement])
    }
  }

  return {
    concepts: new Map(atlas.concepts.map((concept) => [concept.id, concept])),
    spaces: new Map(atlas.spaces.map((space) => [space.id, space])),
    placements: new Map(atlas.placements.map((placement) => [placement.id, placement])),
    relations: new Map(atlas.relations.map((relation) => [relation.id, relation])),
    placementsBySpace,
  }
}
