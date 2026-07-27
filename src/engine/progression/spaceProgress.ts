import type {
  ConceptId,
  KnowledgeIndex,
  ProgressLevel,
  SpaceId,
} from '../../domain/knowledge'
import { getConceptProgress, type ProgressStoreState } from './progressStore'

export interface SpaceProgressSummary {
  spaceId: SpaceId
  total: number
  unknown: number
  sensed: number
  discovered: number
  mastered: number
  exploredRatio: number
  masteredRatio: number
}

export interface SpaceProgressOptions {
  includeDescendants?: boolean
}

export function collectSpaceConceptIds(
  index: KnowledgeIndex,
  spaceId: SpaceId,
  options: SpaceProgressOptions = {},
) {
  const conceptIds = new Set<ConceptId>()
  const visitedSpaces = new Set<SpaceId>()
  const includeDescendants = options.includeDescendants ?? true

  const visit = (currentSpaceId: SpaceId) => {
    if (visitedSpaces.has(currentSpaceId)) return
    visitedSpaces.add(currentSpaceId)

    for (const placement of index.placementsBySpace.get(currentSpaceId) ?? []) {
      conceptIds.add(placement.conceptId)
      if (includeDescendants && placement.childSpaceId) visit(placement.childSpaceId)
    }
  }

  visit(spaceId)
  return conceptIds
}

export function summarizeSpaceProgress(
  index: KnowledgeIndex,
  store: ProgressStoreState,
  spaceId: SpaceId,
  options: SpaceProgressOptions = {},
): SpaceProgressSummary {
  const conceptIds = collectSpaceConceptIds(index, spaceId, options)
  const counts: Record<ProgressLevel, number> = {
    unknown: 0,
    sensed: 0,
    discovered: 0,
    mastered: 0,
  }

  for (const conceptId of conceptIds) {
    counts[getConceptProgress(store, conceptId).level] += 1
  }

  const total = conceptIds.size
  return {
    spaceId,
    total,
    ...counts,
    exploredRatio: total === 0 ? 0 : (counts.sensed + counts.discovered + counts.mastered) / total,
    masteredRatio: total === 0 ? 0 : counts.mastered / total,
  }
}
