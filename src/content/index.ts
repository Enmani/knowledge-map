import { calculusContent } from './calculus'
import { resolveCanonicalConceptId } from '../domain/conceptIdentity'
import { linearAlgebraContents, vectorsCoordinatesContent } from './linearAlgebra'
import { validateContentCatalog } from './validation'
import type { FrontierStatus, KnowledgeCardContent } from './types'

export const frontierStatusLabels: Readonly<Record<FrontierStatus, string>> = {
  established: '基础共识',
  'active-research': '活跃研究',
  preliminary: '初步结果',
  disputed: '存在争议',
  'open-problem': '开放问题',
}

export const knowledgeContents: readonly KnowledgeCardContent[] = [
  calculusContent,
  vectorsCoordinatesContent,
  ...linearAlgebraContents,
]

export const contentCatalogValidation = validateContentCatalog(knowledgeContents)

const contentById = new Map(
  knowledgeContents.map((content) => [content.id, content]),
)

const contentByConceptId = new Map(
  knowledgeContents.map((content) => [content.conceptId, content]),
)

export function getKnowledgeContentById(contentId: string): KnowledgeCardContent | undefined {
  return contentById.get(contentId)
}

export function getKnowledgeContentForConcept(conceptId: string): KnowledgeCardContent | undefined {
  return contentByConceptId.get(resolveCanonicalConceptId(conceptId))
}

export { calculusContent } from './calculus'
export {
  determinantsInvertibilityContent,
  eigenvaluesDiagonalizationContent,
  fundamentalSubspacesRankContent,
  innerProductsOrthogonalityProjectionsContent,
  jordanGeneralizedEigenvectorsContent,
  leastSquaresQrContent,
  linearCombinationsSpanContent,
  linearAlgebraContents,
  linearAlgebraOverviewContent,
  linearMapsMatrixRepresentationsContent,
  linearSystemsEliminationContent,
  matrixBasicsOperationsContent,
  matrixFactorizationsContent,
  matrixPropertiesAtlasContent,
  normalUnitaryMatricesContent,
  normalSymmetricDefiniteMatricesContent,
  pseudoinverseMinimumNormContent,
  singularValuesLowRankContent,
  vectorsCoordinatesContent,
  vectorSpacesBasesContent,
} from './linearAlgebra'
export { KnowledgeArticle } from './KnowledgeArticle'
export { validateContentCatalog, validateKnowledgeContent } from './validation'
export type {
  ContentSource,
  ContentValidationIssue,
  ContentValidationResult,
  FrontierStatus,
  IsoDate,
  KnowledgeArticleFormula,
  KnowledgeArticleSection,
  KnowledgeArticleVisual,
  KnowledgeArticleVisualKind,
  KnowledgeCardContent,
  SourceKind,
} from './types'
