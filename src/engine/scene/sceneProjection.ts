import {
  createKnowledgeIndex,
  type Concept,
  type ConceptId,
  type KnowledgeAtlas,
  type KnowledgeIndex,
  type KnowledgeSpace,
  type Placement,
  type ProgressState,
  type RelationId,
  type RelationType,
  type SpaceId,
} from '../../domain/knowledge'

export type EndpointProjection = 'exact' | 'descendant'

export interface ProjectedSceneNode {
  placement: Placement
  concept: Concept
  progress?: ProgressState
  directChildCount: number
  descendantConceptCount: number
  internalRelationCount: number
}

export interface ProjectedSceneRelation {
  id: string
  type: RelationType
  fromPlacementId: string
  toPlacementId: string
  fromProjection: EndpointProjection
  toProjection: EndpointProjection
  relationIds: readonly RelationId[]
  count: number
}

export interface ProjectedExternalRelation {
  id: string
  type: RelationType
  visiblePlacementId: string
  remoteConceptId: ConceptId
  direction: 'incoming' | 'outgoing'
  relationIds: readonly RelationId[]
  count: number
}

export interface SceneProjection {
  space: KnowledgeSpace
  nodes: readonly ProjectedSceneNode[]
  relations: readonly ProjectedSceneRelation[]
  externalRelations: readonly ProjectedExternalRelation[]
}

export interface SceneProjectionOptions {
  progressByConcept?: ReadonlyMap<ConceptId, ProgressState>
  relationTypes?: ReadonlySet<RelationType>
  isConceptVisible?: (concept: Concept, progress: ProgressState | undefined) => boolean
}

interface Representative {
  placement: Placement
  depth: number
  projection: EndpointProjection
}

function preferRepresentative(next: Representative, current: Representative | undefined) {
  if (!current) return true
  if (next.depth !== current.depth) return next.depth < current.depth
  if (next.placement.role !== current.placement.role) return next.placement.role === 'canonical'
  return next.placement.id.localeCompare(current.placement.id) < 0
}

function isVisible(
  concept: Concept,
  options: SceneProjectionOptions,
) {
  const progress = options.progressByConcept?.get(concept.id)
  return options.isConceptVisible?.(concept, progress) ?? true
}

/**
 * Project concept-level relationships onto the direct placements of one space.
 * Descendant endpoints are lifted to their nearest visible top-level container.
 */
export function projectKnowledgeSceneFromIndex(
  index: KnowledgeIndex,
  activeSpaceId: SpaceId,
  options: SceneProjectionOptions = {},
): SceneProjection {
  const space = index.spaces.get(activeSpaceId)
  if (!space) throw new Error(`无法投影不存在的空间 “${activeSpaceId}”。`)

  const directPlacements = (index.placementsBySpace.get(activeSpaceId) ?? []).filter((placement) => {
    const concept = index.concepts.get(placement.conceptId)
    return concept ? isVisible(concept, options) : false
  })
  const representatives = new Map<ConceptId, Representative>()
  const descendantConcepts = new Map<string, Set<ConceptId>>()

  const assignRepresentative = (conceptId: ConceptId, representative: Representative) => {
    const current = representatives.get(conceptId)
    if (preferRepresentative(representative, current)) {
      representatives.set(conceptId, representative)
    }
  }

  for (const placement of directPlacements) {
    assignRepresentative(placement.conceptId, {
      placement,
      depth: 0,
      projection: 'exact',
    })

    const descendants = new Set<ConceptId>()
    descendantConcepts.set(placement.id, descendants)
    if (!placement.childSpaceId) continue

    const visitedSpaces = new Set<SpaceId>()
    const visitSpace = (spaceId: SpaceId, depth: number) => {
      if (visitedSpaces.has(spaceId)) return
      visitedSpaces.add(spaceId)

      for (const child of index.placementsBySpace.get(spaceId) ?? []) {
        const childConcept = index.concepts.get(child.conceptId)
        if (!childConcept || !isVisible(childConcept, options)) continue

        descendants.add(child.conceptId)
        assignRepresentative(child.conceptId, {
          placement,
          depth,
          projection: 'descendant',
        })
        if (child.childSpaceId) visitSpace(child.childSpaceId, depth + 1)
      }
    }

    visitSpace(placement.childSpaceId, 1)
  }

  const internalRelationCount = new Map<string, number>()
  const relationGroups = new Map<string, ProjectedSceneRelation>()
  const externalGroups = new Map<string, ProjectedExternalRelation>()

  for (const relation of index.relations.values()) {
    if (options.relationTypes && !options.relationTypes.has(relation.type)) continue

    const fromConcept = index.concepts.get(relation.from)
    const toConcept = index.concepts.get(relation.to)
    if (
      !fromConcept ||
      !toConcept ||
      !isVisible(fromConcept, options) ||
      !isVisible(toConcept, options)
    ) {
      continue
    }

    const from = representatives.get(relation.from)
    const to = representatives.get(relation.to)

    if (from && to) {
      if (from.placement.id === to.placement.id) {
        internalRelationCount.set(
          from.placement.id,
          (internalRelationCount.get(from.placement.id) ?? 0) + 1,
        )
        continue
      }

      const key = `${relation.type}:${from.placement.id}:${to.placement.id}`
      const current = relationGroups.get(key)
      if (current) {
        relationGroups.set(key, {
          ...current,
          relationIds: [...current.relationIds, relation.id],
          count: current.count + 1,
        })
      } else {
        relationGroups.set(key, {
          id: key,
          type: relation.type,
          fromPlacementId: from.placement.id,
          toPlacementId: to.placement.id,
          fromProjection: from.projection,
          toProjection: to.projection,
          relationIds: [relation.id],
          count: 1,
        })
      }
      continue
    }

    const visible = from ?? to
    if (!visible) continue

    const direction = from ? 'outgoing' : 'incoming'
    const remoteConceptId = from ? relation.to : relation.from
    const key = `${relation.type}:${visible.placement.id}:${direction}:${remoteConceptId}`
    const current = externalGroups.get(key)
    if (current) {
      externalGroups.set(key, {
        ...current,
        relationIds: [...current.relationIds, relation.id],
        count: current.count + 1,
      })
    } else {
      externalGroups.set(key, {
        id: key,
        type: relation.type,
        visiblePlacementId: visible.placement.id,
        remoteConceptId,
        direction,
        relationIds: [relation.id],
        count: 1,
      })
    }
  }

  const nodes = directPlacements.flatMap<ProjectedSceneNode>((placement) => {
    const concept = index.concepts.get(placement.conceptId)
    if (!concept) return []
    const childPlacements = placement.childSpaceId
      ? index.placementsBySpace.get(placement.childSpaceId) ?? []
      : []

    return [{
      placement,
      concept,
      progress: options.progressByConcept?.get(concept.id),
      directChildCount: childPlacements.filter((child) => {
        const childConcept = index.concepts.get(child.conceptId)
        return childConcept ? isVisible(childConcept, options) : false
      }).length,
      descendantConceptCount: descendantConcepts.get(placement.id)?.size ?? 0,
      internalRelationCount: internalRelationCount.get(placement.id) ?? 0,
    }]
  })

  return {
    space,
    nodes,
    relations: [...relationGroups.values()],
    externalRelations: [...externalGroups.values()],
  }
}

export function projectKnowledgeScene(
  atlas: KnowledgeAtlas,
  activeSpaceId: SpaceId,
  options: SceneProjectionOptions = {},
) {
  return projectKnowledgeSceneFromIndex(createKnowledgeIndex(atlas), activeSpaceId, options)
}
