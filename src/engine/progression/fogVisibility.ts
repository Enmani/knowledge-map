import type {
  Concept,
  ConceptId,
  KnowledgeAtlas,
  ProgressLevel,
  Relation,
} from '../../domain/knowledge'
import { getConceptProgress, type ProgressStoreState } from './progressStore'
import { evaluateConceptUnlock } from './unlock'

export type FogVisibilityLevel = 'hidden' | 'silhouette' | 'revealed'

export interface FogVisibility {
  conceptId: ConceptId
  progressLevel: ProgressLevel
  level: FogVisibilityLevel
  includeInScene: boolean
  revealIdentity: boolean
  revealContent: boolean
  revealTags: boolean
  interactive: boolean
  canEnter: boolean
  fogOpacity: number
}

export interface FogSafeConceptView {
  id: ConceptId
  visibility: FogVisibilityLevel
  title?: string
  tags?: readonly string[]
  summary?: string
  contentRef?: string
}

export function getFogVisibility(
  atlas: KnowledgeAtlas,
  store: ProgressStoreState,
  conceptId: ConceptId,
): FogVisibility {
  const progress = getConceptProgress(store, conceptId)
  const unlock = evaluateConceptUnlock(atlas, store, conceptId)

  if (store.mode === 'free' || progress.level === 'discovered' || progress.level === 'mastered') {
    return {
      conceptId,
      progressLevel: progress.level,
      level: 'revealed',
      includeInScene: true,
      revealIdentity: true,
      revealContent: true,
      revealTags: true,
      interactive: true,
      canEnter: true,
      fogOpacity: 0,
    }
  }

  if (progress.level === 'sensed') {
    return {
      conceptId,
      progressLevel: progress.level,
      level: 'silhouette',
      includeInScene: true,
      revealIdentity: true,
      revealContent: false,
      revealTags: false,
      interactive: unlock.unlocked,
      canEnter: false,
      fogOpacity: 0.55,
    }
  }

  if (unlock.unlocked) {
    return {
      conceptId,
      progressLevel: progress.level,
      level: 'silhouette',
      includeInScene: true,
      revealIdentity: false,
      revealContent: false,
      revealTags: false,
      interactive: true,
      canEnter: false,
      fogOpacity: 0.78,
    }
  }

  return {
    conceptId,
    progressLevel: progress.level,
    level: 'hidden',
    includeInScene: false,
    revealIdentity: false,
    revealContent: false,
    revealTags: false,
    interactive: false,
    canEnter: false,
    fogOpacity: 1,
  }
}

/** Return only fields the current fog state is allowed to expose to a renderer. */
export function getFogSafeConceptView(
  concept: Concept,
  visibility: FogVisibility,
): FogSafeConceptView | undefined {
  if (!visibility.includeInScene) return undefined
  if (!visibility.revealIdentity) {
    return { id: concept.id, visibility: visibility.level }
  }
  if (!visibility.revealContent) {
    return { id: concept.id, visibility: visibility.level, title: concept.title }
  }
  return {
    id: concept.id,
    visibility: visibility.level,
    title: concept.title,
    tags: concept.tags,
    summary: concept.summary,
    contentRef: concept.contentRef,
  }
}

export function isRelationVisibleThroughFog(
  atlas: KnowledgeAtlas,
  store: ProgressStoreState,
  relation: Relation,
) {
  const from = getFogVisibility(atlas, store, relation.from)
  const to = getFogVisibility(atlas, store, relation.to)
  return from.includeInScene && to.includeInScene
}
