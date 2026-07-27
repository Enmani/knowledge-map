import { mathNodes, tagFields, type MathNode } from '../../data/mathMap'
import { buildTagLayout, type TagLayout, type TagLayoutStrategy } from '../../lib/tagLayout'
import { analysisSceneNodes } from './analysisSceneContent'

export type MapSceneId =
  | 'root'
  | 'calculus'
  | 'precalculus'
  | 'multivariable'
  | 'calculus-multivariable'
  | 'dynamical-systems'
  | 'topology'
  | 'discrete-math'
  | 'differential-equations'
  | 'stochastic'
  | 'real-analysis'
  | 'complex-analysis'
  | 'functional-analysis'
  | 'measure-theory'
  | 'fourier-analysis'
  | 'calculus-of-variations'
  | 'numerical-analysis'

type FocusedChildSceneId =
  | 'precalculus'
  | 'multivariable'
  | 'calculus-multivariable'
  | 'discrete-math'
  | 'stochastic'

type AnalysisChildSceneId = keyof typeof analysisSceneNodes

export interface MapScene {
  id: MapSceneId
  title: string
  parentSceneId?: MapSceneId
  ownerNodeId?: string
  nodes: readonly MathNode[]
  nodeIndex: Readonly<Record<string, MathNode>>
  worldWidth: number
  worldHeight: number
  embeddingReferenceWidth?: number
  embeddingReferenceHeight?: number
  nodeWidth: number
  nodeHeight: number
  nodeGap: number
  cardScale: number
  fieldScale: number
  layoutStrategy: TagLayoutStrategy
  layout: TagLayout
  initialNodeId: string
}

type MapSceneDefinition = Omit<MapScene, 'nodeIndex' | 'layout' | 'fieldScale' | 'layoutStrategy'> & {
  fieldScale?: number
  layoutStrategy?: TagLayoutStrategy
}

export interface MapSceneValidationResult {
  valid: boolean
  issues: readonly string[]
}

function validateDefinition(definition: MapSceneDefinition): string[] {
  const issues: string[] = []
  const nodeIds = new Set<string>()

  if (
    !Number.isFinite(definition.worldWidth) ||
    !Number.isFinite(definition.worldHeight) ||
    !Number.isFinite(definition.nodeWidth) ||
    !Number.isFinite(definition.nodeHeight) ||
    !Number.isFinite(definition.nodeGap) ||
    !Number.isFinite(definition.cardScale) ||
    !Number.isFinite(definition.fieldScale ?? definition.cardScale) ||
    definition.worldWidth <= 0 ||
    definition.worldHeight <= 0 ||
    definition.nodeWidth <= 0 ||
    definition.nodeHeight <= 0 ||
    definition.nodeGap < 0 ||
    definition.cardScale < 1 ||
    (definition.fieldScale ?? definition.cardScale) < 1 ||
    definition.nodeWidth >= definition.worldWidth ||
    definition.nodeHeight >= definition.worldHeight
  ) {
    issues.push(`场景“${definition.id}”的世界尺寸或节点尺寸无效。`)
  }

  const hasEmbeddingReference = definition.embeddingReferenceWidth !== undefined || definition.embeddingReferenceHeight !== undefined
  if (hasEmbeddingReference && (
    !Number.isFinite(definition.embeddingReferenceWidth) ||
    !Number.isFinite(definition.embeddingReferenceHeight) ||
    (definition.embeddingReferenceWidth ?? 0) <= 0 ||
    (definition.embeddingReferenceHeight ?? 0) <= 0
  )) {
    issues.push(`场景“${definition.id}”的嵌入参考尺寸无效。`)
  }

  for (const node of definition.nodes) {
    if (nodeIds.has(node.id)) issues.push(`场景“${definition.id}”包含重复节点“${node.id}”。`)
    nodeIds.add(node.id)
  }

  if (!nodeIds.has(definition.initialNodeId)) {
    issues.push(`场景“${definition.id}”的初始节点“${definition.initialNodeId}”不存在。`)
  }

  for (const node of definition.nodes) {
    for (const prerequisiteId of node.prerequisites) {
      if (!nodeIds.has(prerequisiteId)) {
        issues.push(`场景“${definition.id}”中的节点“${node.id}”引用了场景外前置“${prerequisiteId}”。`)
      }
    }
  }

  return issues
}

function createMapScene(definition: MapSceneDefinition): MapScene {
  const issues = validateDefinition(definition)
  if (issues.length > 0) throw new Error(issues.join('\n'))

  const layoutStrategy = definition.layoutStrategy ?? (definition.parentSceneId ? 'progression' : 'radial-clusters')
  const fieldScale = definition.fieldScale ?? definition.cardScale

  return {
    ...definition,
    fieldScale,
    layoutStrategy,
    nodeIndex: Object.fromEntries(definition.nodes.map((node) => [node.id, node])),
    layout: buildTagLayout(
      [...definition.nodes],
      tagFields,
      definition.nodeWidth,
      definition.nodeHeight,
      definition.worldWidth,
      definition.worldHeight,
      {
        collisionGap: definition.nodeGap,
        fieldScale,
        strategy: layoutStrategy,
      },
    ),
  }
}

const calculusNodes: MathNode[] = [
  {
    id: 'calculus-limit', title: '极限', english: 'Limits', domain: 'analysis', level: 0, x: 180, y: 1160,
    summary: '研究函数在输入接近某点时的变化趋势。', why: '极限为连续、导数、积分和级数提供统一语言。', prerequisites: [],
    fieldTags: ['连续变化', '证明推理'], tags: ['趋近', '连续', '收敛'], hours: 18,
  },
  {
    id: 'calculus-derivative', title: '导数', english: 'Derivatives', domain: 'analysis', level: 1, x: 1680, y: 360,
    summary: '用极限定义瞬时变化率和曲线切线斜率。', why: '导数用于描述变化、近似和局部最优化。', prerequisites: ['calculus-limit'],
    fieldTags: ['连续变化', '计算方法'], tags: ['变化率', '切线', '微分'], hours: 24,
  },
  {
    id: 'calculus-integral', title: '积分', english: 'Integrals', domain: 'analysis', level: 1, x: 1700, y: 1900,
    summary: '通过分割与极限计算连续量的累积。', why: '积分连接面积、总量、平均值和连续累积。', prerequisites: ['calculus-limit'],
    fieldTags: ['连续变化', '计算方法'], tags: ['累积', '黎曼和', '面积'], hours: 26,
  },
  {
    id: 'calculus-fundamental-theorem', title: '微积分基本定理', english: 'Fundamental Theorem of Calculus', domain: 'analysis', level: 2, x: 3200, y: 440,
    summary: '说明微分与积分之间的互逆联系。', why: '它把局部变化率与整体累积纳入同一套计算方法。', prerequisites: ['calculus-derivative', 'calculus-integral'],
    fieldTags: ['连续变化', '证明推理', '计算方法'], tags: ['原函数', '定积分', '互逆'], hours: 16,
  },
  {
    id: 'calculus-series', title: '级数', english: 'Series', domain: 'analysis', level: 2, x: 3220, y: 1880,
    summary: '研究无限项求和、收敛判别和函数展开。', why: '级数把复杂函数转换为可计算的近似表达。', prerequisites: ['calculus-limit', 'calculus-integral'],
    fieldTags: ['连续变化', '计算方法', '证明推理'], tags: ['收敛', '幂级数', '泰勒展开'], hours: 28,
  },
  {
    id: 'multivariable', title: '多元微积分', english: 'Multivariable Calculus', domain: 'analysis', level: 3, x: 4720, y: 1100,
    summary: '把微分与积分扩展到多个变量和高维空间。', why: '多元方法用于研究向量场、约束优化和连续物理系统。', prerequisites: ['calculus-fundamental-theorem'],
    fieldTags: ['连续变化', '空间形态', '计算方法'], tags: ['偏导', '梯度', '重积分'], hours: 75,
  },
]

const focusedChildNodes: Readonly<Record<FocusedChildSceneId, MathNode>> = {
  precalculus: {
    id: 'trigonometry', title: '三角学', english: 'Trigonometry', domain: 'analysis', level: 1, x: 620, y: 310,
    summary: '研究角、三角函数、周期现象及其几何关系。', why: '三角学连接几何、周期变化、波动与旋转。', prerequisites: [],
    fieldTags: ['连续变化', '空间形态', '计算方法'], tags: ['三角函数', '周期', '单位圆'], hours: 30,
  },
  multivariable: {
    id: 'vector-calculus', title: '向量微积分', english: 'Vector Calculus', domain: 'analysis', level: 4, x: 620, y: 310,
    summary: '研究向量场中的梯度、散度、旋度和积分定理。', why: '向量微积分为流体、电磁场和连续介质提供计算语言。', prerequisites: [],
    fieldTags: ['连续变化', '空间形态', '计算方法'], tags: ['梯度', '散度', '旋度'], hours: 45,
  },
  'calculus-multivariable': {
    id: 'vector-calculus', title: '向量微积分', english: 'Vector Calculus', domain: 'analysis', level: 4, x: 620, y: 310,
    summary: '研究向量场中的梯度、散度、旋度和积分定理。', why: '向量微积分为流体、电磁场和连续介质提供计算语言。', prerequisites: [],
    fieldTags: ['连续变化', '空间形态', '计算方法'], tags: ['梯度', '散度', '旋度'], hours: 45,
  },
  'discrete-math': {
    id: 'order-theory', title: '序理论', english: 'Order Theory', domain: 'discrete', level: 3, x: 620, y: 310,
    summary: '研究偏序、格与对象之间的比较结构。', why: '序理论统一表达层级、依赖、组合和信息递进关系。', prerequisites: [],
    fieldTags: ['离散结构', '抽象结构', '证明推理'], tags: ['偏序', '格', '哈斯图'], hours: 32,
  },
  stochastic: {
    id: 'financial-mathematics', title: '金融数学', english: 'Financial Mathematics', domain: 'applied', level: 4, x: 620, y: 310,
    summary: '用随机过程、统计与优化研究资产定价和风险。', why: '金融数学把不确定性转化为可计算、可比较的决策模型。', prerequisites: [],
    fieldTags: ['不确定性', '数学建模', '最优化'], tags: ['资产定价', '风险', '随机模型'], hours: 48,
  },
}

const rootScene = createMapScene({
  id: 'root',
  title: '数学全景',
  nodes: mathNodes,
  worldWidth: 3200,
  worldHeight: 3200,
  nodeWidth: 208,
  nodeHeight: 96,
  nodeGap: 24,
  cardScale: 1,
  fieldScale: 1.4,
  layoutStrategy: 'radial-clusters',
  initialNodeId: 'numbers',
})

const calculusScene = createMapScene({
  id: 'calculus',
  title: '微积分',
  parentSceneId: 'root',
  ownerNodeId: 'calculus',
  nodes: calculusNodes,
  worldWidth: 6200,
  worldHeight: 2900,
  embeddingReferenceWidth: 2800,
  embeddingReferenceHeight: 1280,
  nodeWidth: 1248,
  nodeHeight: 576,
  nodeGap: 220,
  cardScale: 6,
  initialNodeId: 'calculus-limit',
})

function createFocusedChildScene(
  id: FocusedChildSceneId,
  title: string,
  ownerNodeId: string,
  parentSceneId: MapSceneId = 'root',
): MapScene {
  const node = focusedChildNodes[id]
  return createMapScene({
    id,
    title,
    parentSceneId,
    ownerNodeId,
    nodes: [node],
    worldWidth: 2500,
    worldHeight: 1200,
    embeddingReferenceWidth: 2800,
    embeddingReferenceHeight: 1280,
    nodeWidth: 1248,
    nodeHeight: 576,
    nodeGap: 220,
    cardScale: 6,
    initialNodeId: node.id,
  })
}

function createAnalysisChildScene(
  id: AnalysisChildSceneId,
  title: string,
): MapScene {
  const nodes = analysisSceneNodes[id]
  return createMapScene({
    id,
    title,
    parentSceneId: 'root',
    ownerNodeId: id,
    nodes,
    worldWidth: 9200,
    worldHeight: 3300,
    embeddingReferenceWidth: 2800,
    embeddingReferenceHeight: 1280,
    nodeWidth: 1248,
    nodeHeight: 576,
    nodeGap: 220,
    cardScale: 6,
    initialNodeId: nodes[0].id,
  })
}

const precalculusScene = createFocusedChildScene('precalculus', '初等函数', 'precalculus')
const multivariableScene = createFocusedChildScene('multivariable', '多元微积分', 'multivariable')
const calculusMultivariableScene = createFocusedChildScene(
  'calculus-multivariable',
  '多元微积分',
  'multivariable',
  'calculus',
)
const discreteMathScene = createFocusedChildScene('discrete-math', '离散结构', 'discrete-math')
const stochasticScene = createFocusedChildScene('stochastic', '随机过程', 'stochastic')
const realAnalysisScene = createAnalysisChildScene('real-analysis', '实分析')
const complexAnalysisScene = createAnalysisChildScene('complex-analysis', '复分析')
const functionalAnalysisScene = createAnalysisChildScene('functional-analysis', '泛函分析')
const measureTheoryScene = createAnalysisChildScene('measure-theory', '测度论与积分')
const fourierAnalysisScene = createAnalysisChildScene('fourier-analysis', '傅里叶与调和分析')
const calculusOfVariationsScene = createAnalysisChildScene('calculus-of-variations', '变分法')
const numericalAnalysisScene = createAnalysisChildScene('numerical-analysis', '数值分析')
const differentialEquationsScene = createAnalysisChildScene('differential-equations', '微分方程')
const topologyScene = createAnalysisChildScene('topology', '点集拓扑')
const dynamicalSystemsScene = createAnalysisChildScene('dynamical-systems', '动力系统')

export const sceneCatalog: Readonly<Record<MapSceneId, MapScene>> = {
  root: rootScene,
  calculus: calculusScene,
  precalculus: precalculusScene,
  multivariable: multivariableScene,
  'calculus-multivariable': calculusMultivariableScene,
  'dynamical-systems': dynamicalSystemsScene,
  topology: topologyScene,
  'discrete-math': discreteMathScene,
  'differential-equations': differentialEquationsScene,
  stochastic: stochasticScene,
  'real-analysis': realAnalysisScene,
  'complex-analysis': complexAnalysisScene,
  'functional-analysis': functionalAnalysisScene,
  'measure-theory': measureTheoryScene,
  'fourier-analysis': fourierAnalysisScene,
  'calculus-of-variations': calculusOfVariationsScene,
  'numerical-analysis': numericalAnalysisScene,
}

export function getMapScene(sceneId: string): MapScene | undefined {
  return sceneCatalog[sceneId as MapSceneId]
}

export function validateMapScene(scene: MapScene): MapSceneValidationResult {
  const issues = validateDefinition(scene)
  const layoutNodeIds = new Set(Object.keys(scene.layout.positions))

  for (const node of scene.nodes) {
    const position = scene.layout.positions[node.id]
    if (!layoutNodeIds.has(node.id) || !position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      issues.push(`场景“${scene.id}”中的节点“${node.id}”缺少有效布局坐标。`)
    }
  }

  return { valid: issues.length === 0, issues }
}
