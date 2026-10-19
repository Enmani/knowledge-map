import { sceneCatalog } from '../features/map'
import { linearAlgebraThreeSubspace } from '../features/space3d'
import {
  LINEAR_ALGEBRA_VECTOR_PROJECTION_ID,
  VECTOR_COORDINATES_CONCEPT_ID,
} from '../domain/conceptIdentity'
import {
  advanceConceptProgress,
  createProgressStore,
  getConceptProgress,
} from '../engine/progression/progressStore'
import {
  calculusContent,
  contentCatalogValidation,
  getKnowledgeContentForConcept,
  jordanGeneralizedEigenvectorsContent,
  leastSquaresQrContent,
  linearAlgebraContents,
  linearAlgebraOverviewContent,
  matrixFactorizationsContent,
  matrixPropertiesAtlasContent,
  normalUnitaryMatricesContent,
  normalSymmetricDefiniteMatricesContent,
  pseudoinverseMinimumNormContent,
  singularValuesLowRankContent,
  vectorsCoordinatesContent,
} from './index'

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

expect(
  contentCatalogValidation.valid,
  contentCatalogValidation.issues.map((issue) => issue.message).join('\n'),
)

const expectedCalculusSectionIds = [
  'calculus-what-is-it',
  'calculus-history',
  'calculus-derivative',
  'calculus-integral',
  'calculus-fundamental-theorem',
  'calculus-interaction-guide',
]

expect(
  calculusContent.sections.map((section) => section.id).join('|') === expectedCalculusSectionIds.join('|'),
  '微积分卡片区段顺序必须与正式参考案例一致。',
)
expect(
  calculusContent.sections.some((section) => section.visual?.kind === 'calculus-change-and-accumulation'),
  '微积分卡片必须包含变化与累积概念图。',
)
expect(calculusContent.widgetIds.length > 0, '微积分卡片必须登记至少一个互动组件。')
expect(
  calculusContent.sources.every((source) => source.url && source.accessedAt),
  '微积分正式参考案例的来源必须包含链接和访问日期。',
)

expect(linearAlgebraContents.length === 18, '线性代数应包含一张父级导览卡和十七张独立内部主题卡。')
expect(
  linearAlgebraOverviewContent.sections.map((section) => section.id).join('|')
    === 'linear-algebra-overview|linear-algebra-route',
  '线性代数父卡只应保留领域说明与下钻路线。',
)
expect(
  getKnowledgeContentForConcept('linear-algebra') === linearAlgebraOverviewContent,
  '公共线性代数节点必须解析到精简后的导览卡。',
)
expect(
  getKnowledgeContentForConcept(VECTOR_COORDINATES_CONCEPT_ID) === vectorsCoordinatesContent
    && getKnowledgeContentForConcept(LINEAR_ALGEBRA_VECTOR_PROJECTION_ID) === vectorsCoordinatesContent,
  '公共向量节点与线性代数向量投影必须解析到同一正式卡片。',
)

const vectorProjectionProgress = advanceConceptProgress(
  createProgressStore('exploration'),
  LINEAR_ALGEBRA_VECTOR_PROJECTION_ID,
  'mastered',
)
expect(
  getConceptProgress(vectorProjectionProgress, VECTOR_COORDINATES_CONCEPT_ID).level === 'mastered'
    && vectorProjectionProgress.byConcept.size === 1,
  '公共向量节点与线性代数投影必须共享唯一学习进度。',
)

const linearAlgebraSceneNodeIds = sceneCatalog['linear-algebra'].nodes.map((node) => node.id)
const linearAlgebraThreeNodeIds = linearAlgebraThreeSubspace.nodes.map(({ node }) => node.id)
expect(
  linearAlgebraSceneNodeIds.join('|') === linearAlgebraThreeNodeIds.join('|'),
  '二维与三维线性代数子域必须复用完全相同的稳定概念 ID。',
)
expect(
  linearAlgebraSceneNodeIds.every((conceptId) => getKnowledgeContentForConcept(conceptId)),
  '每个线性代数内部节点都必须具有正式知识卡片。',
)

const matrixWorldSections = linearAlgebraContents.flatMap((content) => (
  content.sections.filter((section) => section.visual?.kind === 'matrix-world')
))
expect(matrixWorldSections.length === 1, '矩阵世界三视图只能有一个内容宿主。')
expect(
  matrixWorldSections[0]?.id === 'linear-algebra-matrix-world-special-points'
    && matrixPropertiesAtlasContent.sections.some((section) => section.id === matrixWorldSections[0]?.id),
  '矩阵世界三视图必须归属矩阵性质图谱节点。',
)
expect(
  matrixFactorizationsContent.sections.some((section) => section.formulas?.some(
    (formula) => formula.expression === 'PA = LU',
  )),
  '矩阵分解节点必须保留带行主元交换的 LU 条件。',
)
expect(
  leastSquaresQrContent.sections.some((section) => section.formulas?.some(
    (formula) => formula.expression === 'Rx̂ = Qᵀb',
  )),
  '投影、最小二乘与 QR 节点必须拥有 QR 求解公式。',
)
expect(
  normalSymmetricDefiniteMatricesContent.sections.some((section) => section.formulas?.some(
    (formula) => formula.expression.includes('zᵀΣz') && formula.expression.includes('≥ 0'),
  )),
  '正规、对称与正定节点必须明确协方差矩阵的半正定条件。',
)
expect(
  singularValuesLowRankContent.sections.some((section) => section.formulas?.some(
    (formula) => formula.expression === 'Aₖ = UₖΣₖVₖᵀ',
  )),
  '奇异值与低秩节点必须拥有截断 SVD 公式。',
)
expect(
  pseudoinverseMinimumNormContent.sections.some((section) => section.formulas?.some(
    (formula) => formula.expression === 'A⁺ = VΣ⁺Uᵀ',
  )),
  '伪逆节点必须拥有 SVD 伪逆公式。',
)
expect(
  normalUnitaryMatricesContent.sections.some((section) => section.formulas?.some(
    (formula) => formula.expression === 'A*A = AA*  ⇔  A = UΛU*',
  )),
  '复内积、正规与酉矩阵节点必须独立拥有复正规谱定理。',
)
expect(
  jordanGeneralizedEigenvectorsContent.sections.some((section) => section.formulas?.some(
    (formula) => formula.expression === 'A = XJX⁻¹',
  )),
  'Jordan 节点必须独立拥有 Jordan 标准形公式。',
)
expect(
  linearAlgebraContents.every((content) => (
    content.sources.length > 0
      && content.sources.every((source) => source.url && source.accessedAt)
  )),
  '全部线性代数正式卡片的来源必须包含链接和访问日期。',
)
expect(
  vectorsCoordinatesContent.sources.every((source) => source.url && source.accessedAt),
  '公共向量基础卡片的来源必须包含链接和访问日期。',
)
expect(
  matrixPropertiesAtlasContent.sources.some(
    (source) => source.id === 'source:hiranabe-matrix-world'
      && 'license' in source
      && source.license === 'CC0-1.0',
  ),
  '矩阵性质图谱必须保留原作链接与 CC0-1.0 许可。',
)

console.log(
  `Content smoke test passed: ${calculusContent.sections.length} calculus sections and ${linearAlgebraContents.length} linear-algebra cards checked.`,
)
