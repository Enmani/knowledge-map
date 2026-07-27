import type {
  ConceptId,
  KnowledgeAtlas,
  ProgressLevel,
} from '../../domain/knowledge'
import {
  getConceptProgress,
  progressLevelAtLeast,
  type ProgressStoreState,
} from './progressStore'

export interface UnlockEvaluation {
  conceptId: ConceptId
  unlocked: boolean
  reason: 'free-mode' | 'already-discovered' | 'requirements-met' | 'requirements-unmet'
  unmetRequiredIds: readonly ConceptId[]
  unmetAllOfIds: readonly ConceptId[]
  anyOfSatisfied: boolean
}

export interface UnlockOptions {
  requiredLevel?: ProgressLevel
}

export function getRequiredPrerequisiteIds(
  atlas: KnowledgeAtlas,
  conceptId: ConceptId,
) {
  return [...new Set(
    atlas.relations
      .filter((relation) => relation.type === 'required' && relation.to === conceptId)
      .map((relation) => relation.from),
  )]
}

export function evaluateConceptUnlock(
  atlas: KnowledgeAtlas,
  store: ProgressStoreState,
  conceptId: ConceptId,
  options: UnlockOptions = {},
): UnlockEvaluation {
  if (store.mode === 'free') {
    return {
      conceptId,
      unlocked: true,
      reason: 'free-mode',
      unmetRequiredIds: [],
      unmetAllOfIds: [],
      anyOfSatisfied: true,
    }
  }

  const current = getConceptProgress(store, conceptId)
  if (progressLevelAtLeast(current.level, 'discovered')) {
    return {
      conceptId,
      unlocked: true,
      reason: 'already-discovered',
      unmetRequiredIds: [],
      unmetAllOfIds: [],
      anyOfSatisfied: true,
    }
  }

  const concept = atlas.concepts.find((candidate) => candidate.id === conceptId)
  const requiredLevel = concept?.unlockRule?.minimumLevel ?? options.requiredLevel ?? 'mastered'
  const isSatisfied = (requiredId: ConceptId) =>
    progressLevelAtLeast(getConceptProgress(store, requiredId).level, requiredLevel)

  const requiredIds = getRequiredPrerequisiteIds(atlas, conceptId)
  const allOfIds = [...new Set(concept?.unlockRule?.allOf ?? [])]
  const anyOfIds = [...new Set(concept?.unlockRule?.anyOf ?? [])]
  const unmetRequiredIds = requiredIds.filter((id) => !isSatisfied(id))
  const unmetAllOfIds = allOfIds.filter((id) => !isSatisfied(id))
  const anyOfSatisfied = anyOfIds.length === 0 || anyOfIds.some(isSatisfied)
  const unlocked =
    unmetRequiredIds.length === 0 &&
    unmetAllOfIds.length === 0 &&
    anyOfSatisfied

  return {
    conceptId,
    unlocked,
    reason: unlocked ? 'requirements-met' : 'requirements-unmet',
    unmetRequiredIds,
    unmetAllOfIds,
    anyOfSatisfied,
  }
}

export function computeUnlockMap(
  atlas: KnowledgeAtlas,
  store: ProgressStoreState,
  options: UnlockOptions = {},
) {
  return new Map(
    atlas.concepts.map((concept) => [
      concept.id,
      evaluateConceptUnlock(atlas, store, concept.id, options),
    ]),
  )
}
