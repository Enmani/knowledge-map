import type { ConceptId } from './knowledge'

export const VECTOR_COORDINATES_CONCEPT_ID = 'vectors-coordinates'
export const LINEAR_ALGEBRA_VECTOR_PROJECTION_ID = 'linear-algebra:vectors-coordinates'

const canonicalConceptIdByProjection: Readonly<Record<string, ConceptId>> = {
  [LINEAR_ALGEBRA_VECTOR_PROJECTION_ID]: VECTOR_COORDINATES_CONCEPT_ID,
}

export function resolveCanonicalConceptId(conceptId: ConceptId): ConceptId {
  let current = conceptId
  const visited = new Set<ConceptId>()

  while (canonicalConceptIdByProjection[current] && !visited.has(current)) {
    visited.add(current)
    current = canonicalConceptIdByProjection[current]
  }

  return current
}

export function isConceptProjection(conceptId: ConceptId): boolean {
  return resolveCanonicalConceptId(conceptId) !== conceptId
}

export const conceptProjectionAliases = canonicalConceptIdByProjection
