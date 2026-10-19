import type { ConceptId, ProgressLevel, ProgressState } from '../../domain/knowledge'
import { resolveCanonicalConceptId } from '../../domain/conceptIdentity'

export type ProgressMode = 'exploration' | 'free'

export interface ProgressStoreState {
  mode: ProgressMode
  byConcept: ReadonlyMap<ConceptId, ProgressState>
}

const LEVEL_RANK: Readonly<Record<ProgressLevel, number>> = {
  unknown: 0,
  sensed: 1,
  discovered: 2,
  mastered: 3,
}

export function progressLevelAtLeast(current: ProgressLevel, required: ProgressLevel) {
  return LEVEL_RANK[current] >= LEVEL_RANK[required]
}

export function createProgressStore(
  mode: ProgressMode = 'exploration',
  progress: Iterable<ProgressState> = [],
): ProgressStoreState {
  const byConcept = new Map<ConceptId, ProgressState>()
  for (const entry of progress) {
    const conceptId = resolveCanonicalConceptId(entry.conceptId)
    const normalized = { ...entry, conceptId }
    const current = byConcept.get(conceptId)
    if (!current || LEVEL_RANK[normalized.level] >= LEVEL_RANK[current.level]) {
      byConcept.set(conceptId, normalized)
    }
  }
  return {
    mode,
    byConcept,
  }
}

export function getConceptProgress(
  store: ProgressStoreState,
  conceptId: ConceptId,
): ProgressState {
  const canonicalConceptId = resolveCanonicalConceptId(conceptId)
  return store.byConcept.get(canonicalConceptId) ?? { conceptId: canonicalConceptId, level: 'unknown' }
}

export function setProgressMode(
  store: ProgressStoreState,
  mode: ProgressMode,
): ProgressStoreState {
  return store.mode === mode ? store : { ...store, mode }
}

/** Progress is monotonic; reset flows should create a fresh store explicitly. */
export function advanceConceptProgress(
  store: ProgressStoreState,
  conceptId: ConceptId,
  level: ProgressLevel,
  updatedAt?: string,
): ProgressStoreState {
  const canonicalConceptId = resolveCanonicalConceptId(conceptId)
  const current = getConceptProgress(store, canonicalConceptId)
  if (progressLevelAtLeast(current.level, level)) return store

  const byConcept = new Map(store.byConcept)
  byConcept.set(canonicalConceptId, {
    ...current,
    conceptId: canonicalConceptId,
    level,
    ...(updatedAt ? { updatedAt } : {}),
  })
  return { ...store, byConcept }
}

export function completeInteraction(
  store: ProgressStoreState,
  conceptId: ConceptId,
  interactionId: string,
  updatedAt?: string,
): ProgressStoreState {
  const canonicalConceptId = resolveCanonicalConceptId(conceptId)
  const current = getConceptProgress(store, canonicalConceptId)
  const completed = new Set(current.completedInteractionIds ?? [])
  const alreadyCompleted = completed.has(interactionId)
  completed.add(interactionId)

  const level = progressLevelAtLeast(current.level, 'discovered')
    ? current.level
    : 'discovered'
  if (alreadyCompleted && level === current.level) return store

  const byConcept = new Map(store.byConcept)
  byConcept.set(canonicalConceptId, {
    ...current,
    conceptId: canonicalConceptId,
    level,
    completedInteractionIds: [...completed],
    ...(updatedAt ? { updatedAt } : {}),
  })
  return { ...store, byConcept }
}

export function filterProgressToKnownConcepts(
  store: ProgressStoreState,
  knownConceptIds: ReadonlySet<ConceptId>,
): ProgressStoreState {
  const byConcept = new Map<ConceptId, ProgressState>()
  for (const [conceptId, progress] of store.byConcept) {
    if (knownConceptIds.has(conceptId)) byConcept.set(conceptId, progress)
  }
  return byConcept.size === store.byConcept.size ? store : { ...store, byConcept }
}
