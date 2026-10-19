import { Color, Vector3 } from 'three'
import { ThreeKnowledgeRenderer } from '../../renderers/three/ThreeKnowledgeRenderer'
import {
  computeFoundationScores,
  computeKnowledgeDepths,
  getDomainFilterNodeIds,
  domainFilterStrengths,
  interpolateKnowledgeProjections,
  knowledgeLenses,
  projectKnowledgeDataset,
  projectKnowledgeSpace,
  publicKnowledgeSpace,
  KNOWLEDGE_NODE_COLLISION_RADIUS,
  SCIENCE_DOMAIN_ORDER,
  validateKnowledgeSpaceDataset,
} from './index'
import type { KnowledgeSpaceDataset, KnowledgeSpaceNode } from './types'
import {
  MAX_GLOBAL_ZOOM,
  MIN_GLOBAL_ZOOM,
  dampGlobalZoom,
  globalZoomPercent,
  isGlobalZoomSettled,
  nextGlobalZoom,
  wheelGlobalZoomFactor,
  zoomPanCompensation,
} from '../../renderers/three/globalZoom'
import {
  NODE_GLOW_ATTACK_MS,
  NODE_GLOW_RELEASE_MS,
  NODE_STAR_CORE_SCALE,
  buildNodeGlowSalience,
  dampNodeGlowValue,
  midrankPercentiles,
  normalizeNodeHaloLinearRgb,
  resolveNodeGlowVisual,
} from '../../renderers/three/nodeGlow'
import {
  childFieldScopeWeight,
  createSubspaceRevealRange,
  parentFieldScopeWeight,
  parentScopeWeight,
  shouldEnterSubspaceScope,
  shouldExitSubspaceScope,
  subspaceCardCenter,
  subspaceEntryZoom,
  subspaceRevealProgress,
} from '../../renderers/three/subspaceLod'
import {
  arithmeticThreeSubspace,
  calculusThreeSubspace,
  createThreeKnowledgeSubspace,
  linearAlgebraThreeSubspace,
  threeKnowledgeSubspaces,
  THREE_SUBSPACE_TRANSITION_DEFAULTS,
} from '../../features/space3d'
import {
  HOVERED_NODE_VISUAL_SCALE,
  NODE_DISPLAY_RENDER_ORDER,
  RELATED_NODE_LODS,
  RELATED_NODE_MIN_OPACITY,
  SELECTED_NODE_STAR_SCALE,
  relatedNodeDepthRenderOrder,
  resolveNodeDisplayPriority,
} from '../../renderers/three/selectionFocus'
import {
  KNOWLEDGE_BUBBLE_CENTER_OFFSET_PX,
  KNOWLEDGE_BUBBLE_DENSITY_RATIO,
  KNOWLEDGE_BUBBLE_FONT_SIZE_PX,
  KNOWLEDGE_BUBBLE_GAP_PX,
  KNOWLEDGE_BUBBLE_PIXEL_HEIGHT,
  KNOWLEDGE_BUBBLE_STAR_GAP_PX,
  KNOWLEDGE_CARD_PIXEL_HEIGHT,
  KNOWLEDGE_CARD_PIXEL_WIDTH,
  activeBubbleNodeLod,
  knowledgeLabelCenterOffsetPx,
  selectKnowledgeBubbles,
  type KnowledgeBubbleCandidate,
} from '../../renderers/three/bubbleLayout'
import {
  DOMAIN_LABEL_MAX_OPACITY,
  DOMAIN_LABEL_PIXEL_HEIGHT,
  DOMAIN_OVERVIEW_FULL_ZOOM,
  DOMAIN_OVERVIEW_START_ZOOM,
  domainLabelTextColor,
  domainOverviewProgress,
  nodeNameOverviewOpacity,
} from '../../renderers/three/domainOverview'
import {
  EDGE_PULSE_PERIOD_SECONDS,
  focusedKnowledgeEdgePulse,
  knowledgeEdgeColor,
  knowledgeEdgeOpacity,
} from '../../renderers/three/edgeVisual'
import {
  STABLE_LOD_CORE_FOUNDATION_FULL,
  STABLE_LOD_CORE_FOUNDATION_START,
  STABLE_LOD_DEMOTION_DWELL_MS,
  STABLE_LOD_EVALUATION_INTERVAL_MS,
  STABLE_LOD_INTERACTION_MAX_TRAVEL_RATIO,
  STABLE_LOD_INTERACTION_MAX_ZOOM_OCTAVES,
  STABLE_LOD_MAX_SWAPS_PER_EVALUATION,
  STABLE_LOD_MIN_HOLD_MS,
  STABLE_LOD_PROMOTION_DWELL_MS,
  STABLE_LOD_RETENTION_BONUS,
  STABLE_LOD_VIEW_REFRESH_ANGLE_RADIANS,
  STABLE_LOD_VIEW_REFRESH_DURATION_MS,
  STABLE_LOD_VIEW_REFRESH_TRAVEL_RATIO,
  stableDesiredLod,
  stableHemisphereEligibility,
  stableLodChangeReady,
  stableLodCoreStrength,
  stableLodDetail,
  stableLodInteractionRetained,
  stableLodLabelBudget,
  stableLodMinimumEmphasis,
  stableLodRetentionBonus,
  stableLodScore,
  stableLodSemanticPriority,
  stableLodViewRefreshNeeded,
} from '../../renderers/three/stableLod'
import {
  CARD_FOCUS_CONTEXT_OPACITY,
  getCardFocusEdgeRole,
  getCardFocusRole,
  resolveCardFocusState,
} from '../../renderers/core/cardFocus'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const validation = validateKnowledgeSpaceDataset(publicKnowledgeSpace)
assert(validation.valid, `三维知识数据校验失败：${validation.errors.join('；')}`)
assert(validation.warnings.length === 0, `三维知识数据存在警告：${validation.warnings.join('；')}`)
assert(validation.stats.domains === 8, '公共知识空间应包含八个知识领域。')
assert(NODE_STAR_CORE_SCALE === 0.5, '星点高亮核心尺寸应固定为外层光晕基准尺寸的 50%。')
const primaryNodeCounts = new Map(SCIENCE_DOMAIN_ORDER.map((domain) => [
  domain,
  publicKnowledgeSpace.nodes.filter((node) => node.primaryDomain === domain).length,
]))
assert(
  [...primaryNodeCounts.values()].every((count) => count >= 16),
  '每个公共领域都应有足够多、能够继续展开子主题的主节点。',
)
assert(
  new Set(primaryNodeCounts.values()).size > 1,
  '公共领域目录应按真实知识边界确定规模，不得为视觉对称强制等量。',
)
assert(primaryNodeCounts.get('mathematics') === 47, '数学目录应继续复用二维全景的 47 个稳定主节点。')
assert(primaryNodeCounts.get('physics') === 47, '加速器物理与粒子探测拆分后，物理目录应包含 47 个主节点。')
assert(primaryNodeCounts.get('chemistry') === 47, '溶液化学与酸碱化学拆分后，化学目录应包含 47 个主节点。')
assert(primaryNodeCounts.get('biology') === 45, '神经科学迁移后，生物学目录应保留 45 个真实主节点，不为等量补位。')
assert(primaryNodeCounts.get('cognitive-science') === 19, '认知科学应包含 19 个经过筛选的宽父域节点。')
assert(primaryNodeCounts.get('neuroscience') === 20, '神经科学应包含 20 个非临床宽父域节点。')
assert(primaryNodeCounts.get('computer-science') === 46, '计算机科学目录应保留 46 个具备独立父域资格的主节点。')
assert(primaryNodeCounts.get('earth-environmental') === 49, '复合方向拆分并加入火山学后，地球与环境科学应包含 49 个主节点。')
assert(validation.stats.nodes === [...primaryNodeCounts.values()].reduce((sum, count) => sum + count, 0), '公共节点统计必须等于各领域实际目录之和。')
assert(validation.stats.edges >= validation.stats.nodes * 2, '公共知识空间应为主节点提供足够的学习与语义关系。')
assert(validation.stats.lenses === validation.stats.domains + 2, '公共知识空间应为每个领域提供透镜，并保留全景与跨域桥梁透镜。')
assert(validation.stats.crossDomainNodes >= validation.stats.nodes * 0.6, '多数公共节点应通过多领域归属参与知识桥接。')
assert(validation.stats.crossDomainEdges >= validation.stats.nodes * 0.6, '公共图应包含足够多的显式跨主领域关系。')

const parentDomains = new Set(['cognitive-science', 'neuroscience'])
const parentDomainNodes = publicKnowledgeSpace.nodes.filter((node) => parentDomains.has(node.primaryDomain))
const incidentNodeIds = new Set(publicKnowledgeSpace.edges.flatMap((edge) => [edge.source, edge.target]))
assert(
  parentDomainNodes.every((node) => node.summary.length >= 24 && node.tags.length >= 3 && incidentNodeIds.has(node.id)),
  '新增父域节点必须具有明确范围、至少三个主题标签，并接入知识关系图。',
)
assert(
  publicKnowledgeSpace.nodes.find((node) => node.id === 'neuroscience')?.primaryDomain === 'neuroscience',
  '稳定 ID neuroscience 必须迁移到神经科学主域。',
)
const clinicalScopePattern = /临床|诊断|治疗|手术|药物剂量|康复|精神病学|神经病学/
assert(
  publicKnowledgeSpace.nodes
    .filter((node) => node.primaryDomain === 'neuroscience')
    .every((node) => !clinicalScopePattern.test(`${node.title}${node.summary}`)),
  '神经科学公共目录必须保持非临床边界。',
)

const publicNodeById = new Map(publicKnowledgeSpace.nodes.map((node) => [node.id, node]))
for (const nodeId of [
  'particle-radiation-detection',
  'solution-chemistry',
  'paleoecology',
  'space-physics-space-weather',
  'volcanology',
]) {
  const node = publicNodeById.get(nodeId)
  assert(node && node.summary.length >= 24 && node.tags.length >= 3, `拆分节点 ${nodeId} 必须具有独立父域范围。`)
}
assert(publicNodeById.get('accelerator-detector-physics')?.title === '加速器物理', '旧加速器稳定 ID 应收敛为加速器物理。')
assert(publicNodeById.get('acids-bases-solutions')?.title === '酸碱化学', '旧酸碱稳定 ID 应收敛为酸碱化学。')
assert(publicNodeById.get('geomagnetism-space-weather')?.title === '地磁学与古地磁学', '旧地磁稳定 ID 应收敛为地磁与古地磁。')
assert(publicNodeById.get('paleontology-paleoecology')?.title === '古生物学', '旧古生物稳定 ID 应收敛为古生物学。')
assert(publicNodeById.get('relativity')?.title === '狭义相对论与时空', '相对论入口必须与广义相对论划清范围。')
assert(publicNodeById.get('structural-geology-tectonics')?.title === '构造地质与岩石变形', '构造地质入口必须与板块构造划清范围。')
assert(publicNodeById.get('chemical-reactions-redox')?.title === '化学反应与守恒', '一般化学反应入口不得继续占用电化学的氧化还原范围。')

const prerequisiteKind = (source: string, target: string) => publicKnowledgeSpace.edges.find((edge) => (
  edge.source === source && edge.target === target && edge.type === 'prerequisite'
))?.prerequisiteKind
const publicRelation = (source: string, target: string) => publicKnowledgeSpace.edges.find((edge) => (
  edge.source === source && edge.target === target
))
assert(prerequisiteKind('programming-fundamentals', 'programming-languages') === 'strict', '程序设计语言应严格依赖程序设计基础。')
assert(prerequisiteKind('object-oriented-programming', 'programming-languages') === 'recommended', '面向对象编程只能作为程序设计语言的建议背景。')
assert(prerequisiteKind('functional-programming', 'programming-languages') === 'recommended', '函数式编程只能作为程序设计语言的建议背景。')
assert(prerequisiteKind('bioinformatics', 'systems-biology') === 'recommended', '系统生物学不得把生物信息学虚构为严格前置。')
assert(prerequisiteKind('bioinformatics', 'computational-biology') === 'recommended', '计算生物学不得把生物信息学虚构为严格前置。')
assert(
  publicRelation('vectors-coordinates', 'classical-mechanics')?.type === 'application'
    && publicRelation('vectors-coordinates', 'classical-mechanics')?.label === '位移与力的分解',
  '公共向量概念必须以应用关系连接经典力学。',
)
assert(
  publicRelation('vectors-coordinates', 'computer-graphics')?.type === 'application'
    && publicRelation('vectors-coordinates', 'computer-graphics')?.label === '坐标与空间变换',
  '公共向量概念必须以应用关系连接计算机图形学。',
)
assert(
  publicRelation('vectors-coordinates', 'machine-learning')?.type === 'shared-model'
    && publicRelation('vectors-coordinates', 'machine-learning')?.label === '特征向量表示',
  '公共向量概念必须以共享模型关系连接机器学习。',
)

for (const lens of knowledgeLenses) {
  const first = projectKnowledgeSpace(lens.id)
  const second = projectKnowledgeSpace(lens.id)
  assert(first.nodes.length === publicKnowledgeSpace.nodes.length, `透镜 ${lens.id} 丢失节点。`)
  assert(first.edges.length === publicKnowledgeSpace.edges.length, `透镜 ${lens.id} 丢失关系。`)
  assert(first.fields.filter((field) => field.kind === 'domain').length === publicKnowledgeSpace.domains.length, `透镜 ${lens.id} 丢失领域场。`)
  assert(first.fields.some((field) => field.kind === 'tag'), `透镜 ${lens.id} 应包含自动标签场。`)
  first.fields.forEach((field) => {
    assert(field.center.every(Number.isFinite) && Number.isFinite(field.radius), `透镜 ${lens.id} 的场 ${field.id} 包络无效。`)
    assert(field.lobes.length >= 2, `场 ${field.id} 至少应由两个节点球瓣形成。`)
    field.lobes.forEach((lobe) => {
      assert(lobe.center.every(Number.isFinite) && lobe.radius > 0, `场 ${field.id} 的节点球瓣无效。`)
    })
  })
  first.nodes.forEach((node, index) => {
    assert(node.position.every(Number.isFinite), `透镜 ${lens.id} 的节点 ${node.node.id} 坐标无效。`)
    assert(node.opacity >= 0 && node.opacity <= 1, `透镜 ${lens.id} 的节点 ${node.node.id} 透明度无效。`)
    assert(node.position.every((value, axis) => value === second.nodes[index].position[axis]), `透镜 ${lens.id} 的投影结果不稳定。`)
  })
}

const world = projectKnowledgeSpace('world')
const biology = projectKnowledgeSpace('biology')
assert(
  world.fields.filter((field) => field.kind === 'tag').length >= 80,
  '公共投影应从重复主题标签生成足够丰富的自动标签场。',
)

const glowMidranks = midrankPercentiles([1, 1, 3, 5])
assert(
  Math.abs(glowMidranks[0] - 1 / 6) < 1e-9
    && glowMidranks[0] === glowMidranks[1]
    && Math.abs(glowMidranks[2] - 2 / 3) < 1e-9
    && glowMidranks[3] === 1,
  '知识重要性并列值必须使用稳定中位秩，不能受目录顺序影响。',
)
const worldGlowInputs = world.nodes.map(({ node, foundationScore }) => ({
  id: node.id,
  importance: node.importance,
  foundationScore,
}))
const worldGlowSalience = buildNodeGlowSalience(worldGlowInputs)
const reorderedGlowSalience = buildNodeGlowSalience([...worldGlowInputs].reverse())
const biologyGlowSalience = buildNodeGlowSalience(biology.nodes.map(({ node, foundationScore }) => ({
  id: node.id,
  importance: node.importance,
  foundationScore,
})))
for (const [id, salience] of worldGlowSalience) {
  assert(salience >= 0 && salience <= 1, `节点 ${id} 的稳定发光显著性必须归一化。`)
  assert(
    Math.abs((reorderedGlowSalience.get(id) ?? -1) - salience) < 1e-9,
    `节点 ${id} 的发光显著性不能受目录顺序影响。`,
  )
  assert(
    Math.abs((biologyGlowSalience.get(id) ?? -1) - salience) < 1e-9,
    `节点 ${id} 的核心亮度不能随当前透镜变化。`,
  )
}
assert(
  new Set([...worldGlowSalience.values()].map((value) => value.toFixed(3))).size >= 20,
  '公共知识空间应具有足够多的稳定发光层级。',
)

const lowContextGlow = resolveNodeGlowVisual(0.55, 0.2)
const highContextGlow = resolveNodeGlowVisual(0.55, 1)
assert(
  lowContextGlow.coreOpacity === highContextGlow.coreOpacity
    && lowContextGlow.bloomCoreDensity === highContextGlow.bloomCoreDensity
    && lowContextGlow.haloOpticalDensity < highContextGlow.haloOpticalDensity
    && lowContextGlow.haloRadiusScale < highContextGlow.haloRadiusScale,
  '稳定核心亮度与当前透镜光晕必须是独立通道。',
)
const minimumGlow = resolveNodeGlowVisual(0, 0.2)
const maximumGlow = resolveNodeGlowVisual(1, 1)
assert(
  minimumGlow.coreOpacity >= 0.7
    && maximumGlow.coreOpacity <= 1
    && minimumGlow.bloomCoreDensity >= minimumGlow.haloOpticalDensity * 3
    && maximumGlow.bloomCoreDensity <= 0.46
    && minimumGlow.haloOpticalDensity > 0
    && maximumGlow.haloOpticalDensity <= 0.26
    && maximumGlow.haloRadiusScale <= 1.04,
  '节点发光必须以高亮核心为主，保留底光并限制外晕峰值和半径。',
)

const dampFor = (start: number, target: number, milliseconds: number) => {
  let value = start
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 10) {
    value = dampNodeGlowValue(value, target, 0.01)
  }
  return value
}
const attackAtT95 = dampFor(0, 1, NODE_GLOW_ATTACK_MS)
const releaseAtT95 = dampFor(1, 0, NODE_GLOW_RELEASE_MS)
assert(
  attackAtT95 >= 0.94 && attackAtT95 <= 0.96
    && releaseAtT95 >= 0.04 && releaseAtT95 <= 0.06
    && dampNodeGlowValue(0, 1, 0.001, true) === 1,
  '发光动画必须在 160/650ms 达到约 95%，并遵守减少动态效果。',
)

const topGlowIds = (salience: ReadonlyMap<string, number>, count: number) => [...salience]
  .sort(([leftId, left], [rightId, right]) => right - left || leftId.localeCompare(rightId))
  .slice(0, count)
  .map(([id]) => id)
const perturbedGlowSalience = buildNodeGlowSalience(worldGlowInputs.map((input, index) => ({
  ...input,
  importance: (input.importance ?? 1) * (1 + (((index * 17) % 11) - 5) / 100),
})))
const topGlowCount = Math.max(20, Math.ceil(worldGlowInputs.length * 0.1))
const baselineTopGlow = new Set(topGlowIds(worldGlowSalience, topGlowCount))
const perturbedTopGlow = topGlowIds(perturbedGlowSalience, topGlowCount)
  .filter((id) => baselineTopGlow.has(id))
const meanGlowPerturbation = worldGlowInputs.reduce((sum, { id }) => (
  sum + Math.abs((worldGlowSalience.get(id) ?? 0) - (perturbedGlowSalience.get(id) ?? 0))
), 0) / worldGlowInputs.length
assert(
  perturbedTopGlow.length >= Math.floor(topGlowCount * 0.8)
    && meanGlowPerturbation <= 0.14,
  `重要性发生 ±5% 小扰动时，最高 10% 发光节点应保持大部分成员，整体显著性不得突变（重合 ${perturbedTopGlow.length}/${topGlowCount}，平均变化 ${meanGlowPerturbation.toFixed(3)}）。`,
)

const normalizedHaloLuminances = publicKnowledgeSpace.domains.map((domain) => {
  const color = new Color(domain.fieldColor)
  const normalized = normalizeNodeHaloLinearRgb(color)
  return 0.2126 * normalized.r + 0.7152 * normalized.g + 0.0722 * normalized.b
})
const meanHaloLuminance = normalizedHaloLuminances.reduce((sum, value) => sum + value, 0)
  / normalizedHaloLuminances.length
const haloLuminanceCv = Math.sqrt(
  normalizedHaloLuminances.reduce(
    (sum, value) => sum + (value - meanHaloLuminance) ** 2,
    0,
  ) / normalizedHaloLuminances.length,
) / meanHaloLuminance
assert(
  meanHaloLuminance >= 0.42
    && meanHaloLuminance <= 0.44
    && haloLuminanceCv <= 0.01,
  '恒星外晕必须使用明亮场域色，且全部领域的线性亮度变异系数不超过 1%。',
)

const chainFoundation = computeFoundationScores({
  nodes: world.nodes.slice(0, 3).map(({ node }) => node),
  edges: [
    {
      id: 'chain-0-1',
      source: world.nodes[0].node.id,
      target: world.nodes[1].node.id,
      type: 'prerequisite',
      strength: 1,
    },
    {
      id: 'chain-1-2',
      source: world.nodes[1].node.id,
      target: world.nodes[2].node.id,
      type: 'prerequisite',
      strength: 1,
    },
  ],
})
assert(
  chainFoundation[0] === 1
    && chainFoundation[0] > chainFoundation[1]
    && chainFoundation[1] > chainFoundation[2]
    && chainFoundation[2] === 0,
  '子空间必须使用自身严格前置图计算基础性，不能把全部节点写成零。',
)
const invalidImportanceDataset: KnowledgeSpaceDataset = {
  ...publicKnowledgeSpace,
  nodes: publicKnowledgeSpace.nodes.map((node, index) => (
    index === 0 ? { ...node, importance: Number.NaN } : node
  )),
}
assert(
  validateKnowledgeSpaceDataset(invalidImportanceDataset).errors.some((error) => (
    error.includes('importance must be a finite non-negative number')
  )),
  '数据校验必须拒绝非有限或负数 importance。',
)

const axisSpans = [0, 1, 2].map((axis) => {
  const values = world.nodes.map((node) => node.position[axis])
  return Math.max(...values) - Math.min(...values)
})
assert(axisSpans[2] >= Math.max(axisSpans[0], axisSpans[1]) * 0.68, '公共全景应具有显著 Z 轴体积，不能退化为二维平面。')

const spatialDistance = (left: (typeof world.nodes)[number], right: (typeof world.nodes)[number]) => Math.hypot(
  right.position[0] - left.position[0],
  right.position[1] - left.position[1],
  right.position[2] - left.position[2],
)
const median = (values: readonly number[]) => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)]
const worldById = new Map(world.nodes.map((node) => [node.node.id, node]))
const relatedPairIds = new Set(publicKnowledgeSpace.edges.map((edge) => [edge.source, edge.target].sort().join('|')))
const strongRelationDistances = publicKnowledgeSpace.edges
  .filter((edge) => edge.strength >= 0.78)
  .map((edge) => spatialDistance(worldById.get(edge.source)!, worldById.get(edge.target)!))
const unrelatedDistances: number[] = []
for (let leftIndex = 0; leftIndex < world.nodes.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < world.nodes.length; rightIndex += 1) {
    const pairId = [world.nodes[leftIndex].node.id, world.nodes[rightIndex].node.id].sort().join('|')
    if (!relatedPairIds.has(pairId) && (leftIndex * 277 + rightIndex) % 19 === 0) {
      unrelatedDistances.push(spatialDistance(world.nodes[leftIndex], world.nodes[rightIndex]))
    }
  }
}
assert(
  median(strongRelationDistances) < median(unrelatedDistances) * 0.55,
  '强知识关系的典型空间距离应显著短于无直接关系节点。',
)
const causalNodes = Array.from({ length: 10 }, (_, index): KnowledgeSpaceNode => ({
  id: `causal-${index}`,
  title: `causal-${index}`,
  englishTitle: `causal-${index}`,
  summary: `causal-${index}`,
  primaryDomain: 'mathematics',
  domains: ['mathematics'],
  tags: [`causal-tag-${index}`],
  level: 1,
}))
const causalBaselineDataset: KnowledgeSpaceDataset = {
  ...publicKnowledgeSpace,
  nodes: causalNodes,
  edges: [],
}
const causalRelatedDataset: KnowledgeSpaceDataset = {
  ...causalBaselineDataset,
  edges: [{
    id: 'causal-strong-relation',
    source: 'causal-0',
    target: 'causal-1',
    type: 'shared-model',
    strength: 1,
  }],
}
const causalBaseline = projectKnowledgeDataset(causalBaselineDataset, 'world', { relaxationIterations: 16 })
const causalRelated = projectKnowledgeDataset(causalRelatedDataset, 'world', { relaxationIterations: 16 })
assert(
  spatialDistance(causalRelated.nodes[0], causalRelated.nodes[1])
    < spatialDistance(causalBaseline.nodes[0], causalBaseline.nodes[1]) * 0.8,
  '在同领域同半径对照中加入强关系后，目标节点应显著靠近。',
)
SCIENCE_DOMAIN_ORDER.forEach((domain) => {
  const members = world.nodes.filter((node) => node.node.primaryDomain === domain)
  const sameDomainNearest = members.filter((member) => {
    const nearest = world.nodes
      .filter((candidate) => candidate.node.id !== member.node.id)
      .sort((left, right) => spatialDistance(member, left) - spatialDistance(member, right))[0]
    return nearest.node.primaryDomain === domain
  }).length
  assert(sameDomainNearest / members.length > 0.25, `领域 ${domain} 应形成可辨认的柔性空间聚集。`)
})

const radiiByDepth = new Map<number, number[]>()
const projectedByNodeId = new Map(world.nodes.map((node) => [node.node.id, node]))
world.nodes.forEach((node) => {
  assert(node.foundationScore >= 0 && node.foundationScore <= 1, `节点 ${node.node.id} 的前置覆盖中心度必须归一化。`)
  radiiByDepth.set(node.knowledgeDepth, [...(radiiByDepth.get(node.knowledgeDepth) ?? []), node.radius])
  assert(Math.abs(Math.hypot(...node.position) - node.radius) < 1e-6, `节点 ${node.node.id} 必须保持知识半径。`)
})
assert(
  (projectedByNodeId.get('linear-algebra')?.foundationScore ?? 0) > 0.95,
  '线性代数必须由严格前置关系覆盖自然计算为最高一档中心知识。',
)
const meanRadiusByDepth = [...radiiByDepth.entries()]
  .map(([depth, radii]) => [depth, radii.reduce((sum, radius) => sum + radius, 0) / radii.length] as const)
  .sort(([left], [right]) => left - right)
assert(
  meanRadiusByDepth.at(-1)![1] > meanRadiusByDepth[0][1],
  '最深层知识的平均基础—专业化半径应大于根层。',
)
publicKnowledgeSpace.edges
  .filter((edge) => edge.type === 'prerequisite' && edge.prerequisiteKind !== 'recommended')
  .forEach((edge) => {
    const source = projectedByNodeId.get(edge.source)
    const target = projectedByNodeId.get(edge.target)
    assert(source && target && target.radius > source.radius, `严格前置 ${edge.id} 必须保持由内向外。`)
  })

let minimumCollisionGap = Number.POSITIVE_INFINITY
for (let leftIndex = 0; leftIndex < world.nodes.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < world.nodes.length; rightIndex += 1) {
    const left = world.nodes[leftIndex]
    const right = world.nodes[rightIndex]
    const distance = Math.hypot(
      right.position[0] - left.position[0],
      right.position[1] - left.position[1],
      right.position[2] - left.position[2],
    )
    minimumCollisionGap = Math.min(minimumCollisionGap, distance - (KNOWLEDGE_NODE_COLLISION_RADIUS * (left.scale + right.scale) + 0.18))
  }
}
assert(minimumCollisionGap >= -0.02, `三维碰撞约束残留过大：${minimumCollisionGap.toFixed(3)}。`)

for (const lens of knowledgeLenses) {
  const projection = projectKnowledgeSpace(lens.id)
  projection.nodes.forEach((node, index) => {
    assert(Math.abs(node.radius - world.nodes[index].radius) < 1e-9, `透镜 ${lens.id} 不应改变知识半径。`)
    assert(
      node.position.every((value, axis) => value === world.nodes[index].position[axis]),
      `透镜 ${lens.id} 不应改变关系驱动的公共坐标。`,
    )
  })
}

const temporaryMath = projectKnowledgeSpace('world', { domainFilter: 'mathematics', filterMode: 'temporary' })
const filterFixture: KnowledgeSpaceDataset = {
  ...publicKnowledgeSpace,
  nodes: [
    { ...publicKnowledgeSpace.nodes[0], id: 'only', domains: ['mathematics'], primaryDomain: 'mathematics' },
    { ...publicKnowledgeSpace.nodes[0], id: 'shared', domains: ['physics', 'mathematics'], primaryDomain: 'physics' },
    { ...publicKnowledgeSpace.nodes[0], id: 'incoming', domains: ['physics'], primaryDomain: 'physics' },
    { ...publicKnowledgeSpace.nodes[0], id: 'outgoing', domains: ['physics'], primaryDomain: 'physics' },
    { ...publicKnowledgeSpace.nodes[0], id: 'two-hops', domains: ['physics'], primaryDomain: 'physics' },
  ],
  edges: [
    { id: 'in', source: 'incoming', target: 'only', type: 'analogy', strength: 0.2 },
    { id: 'out', source: 'shared', target: 'outgoing', type: 'application', strength: 0.3 },
    { id: 'second', source: 'outgoing', target: 'two-hops', type: 'prerequisite', strength: 1 },
  ],
}
assert(getDomainFilterNodeIds(filterFixture, 'mathematics', 'exclusive').join(',') === 'only', '最强筛选必须排除所有跨领域归属。')
assert(getDomainFilterNodeIds(filterFixture, 'mathematics', 'inclusive').join(',') === 'only,shared', '中档必须包含非主领域归属，同时保留独属节点。')
assert(getDomainFilterNodeIds(filterFixture, 'mathematics', 'related').sort().join(',') === 'incoming,only,outgoing,shared', '最宽筛选应包含双向直接关系，不受关系类型或强度限制，也不得扩展到二跳。')
const emptyFilter = projectKnowledgeDataset(filterFixture, 'world', { domainFilter: 'chemistry', domainFilterStrength: 'exclusive', filterMode: 'temporary' })
assert(emptyFilter.nodes.every((node) => !node.visible && !node.interactive && node.opacity === 0), '没有匹配节点时必须显示空结果，不得恢复全图。')
// Exercise the renderer's actual pivot selection without constructing a WebGL context.
const pivotRenderer = Object.assign(Object.create(ThreeKnowledgeRenderer.prototype), {
  projection: world,
  projectionCenter: new Vector3(...world.lens.cameraTarget),
  activeScopeId: null,
  nodes: new Map(world.nodes.map(({ node, position }) => [node.id, { currentPosition: new Vector3(...position) }])),
}) as ThreeKnowledgeRenderer
assert(pivotRenderer['rotationPivotForActiveScope']()!.equals(pivotRenderer['projectionCenter']), '全部节点可见时应使用公共空间中心。')
pivotRenderer['projection'] = emptyFilter
assert(pivotRenderer['rotationPivotForActiveScope']() === null, '空筛选结果没有旋转中心，不得使用已隐藏节点或镜头目标旋转。')
for (const domain of publicKnowledgeSpace.domains) {
  for (const { value: strength } of domainFilterStrengths) {
    const filtered = projectKnowledgeSpace('world', { domainFilter: domain.id, domainFilterStrength: strength, filterMode: 'temporary' })
    const members = new Set(publicKnowledgeSpace.nodes.filter((node) => node.domains.includes(domain.id)).map((node) => node.id))
    filtered.nodes.forEach((item, index) => {
      const expected = strength === 'exclusive'
        ? members.has(item.node.id) && item.node.domains.length === 1
        : members.has(item.node.id) || (strength === 'related' && publicKnowledgeSpace.edges.some((edge) => (
          edge.source === item.node.id && members.has(edge.target)
        ) || (
          edge.target === item.node.id && members.has(edge.source)
        )))
      assert(item.visible === expected && item.interactive === expected, `${domain.id}/${strength} 的显示与命中集合必须符合领域强度。`)
      assert(item.position.every((value, axis) => value === world.nodes[index].position[axis]), '所有筛选强度必须保持公共坐标。')
      if (!expected) assert(item.opacity === 0, '强度筛选隐藏节点必须完全透明。')
    })
    const visibleIds = new Set(filtered.nodes.filter((node) => node.visible).map((node) => node.node.id))
    pivotRenderer['projection'] = filtered
    const pivot = pivotRenderer['rotationPivotForActiveScope']()
    if (visibleIds.size > 0) {
      const expectedCenter = filtered.nodes.filter((item) => item.visible)
        .reduce((sum, item) => sum.add(new Vector3(...item.position)), new Vector3()).divideScalar(visibleIds.size)
      assert(pivot !== null && pivot.distanceTo(expectedCenter) < 1e-10, `${domain.id}/${strength} 的旋转中心必须只取筛选保留节点的算术中心。`)
      const hidden = filtered.nodes.find((item) => !item.visible)!
      const hiddenRuntime = pivotRenderer['nodes'].get(hidden.node.id)!
      const originalPosition = hiddenRuntime.currentPosition.clone()
      hiddenRuntime.currentPosition.set(1e6, -1e6, 1e6)
      assert(pivotRenderer['rotationPivotForActiveScope']()!.equals(pivot!), '隐藏节点的位置不得影响筛选旋转中心。')
      hiddenRuntime.currentPosition.copy(originalPosition)
    } else {
      assert(pivot === null, '无可见节点的领域强度不得生成旋转中心。')
    }
    filtered.edges.forEach(({ edge, opacity }) => {
      if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) assert(opacity === 0, '连线必须随筛选隐藏的端点退出显示。')
    })
  }
}
const focusedMath = projectKnowledgeSpace('world', { domainFilter: 'mathematics', filterMode: 'focus' })
const focusedMathAgain = projectKnowledgeSpace('world', { domainFilter: 'mathematics', filterMode: 'focus' })
assert(temporaryMath.nodes.some((node) => !node.visible), '临时领域筛选应隐藏不匹配节点。')
temporaryMath.nodes.forEach((node, index) => {
  assert(node.position.every((value, axis) => value === world.nodes[index].position[axis]), '临时筛选不得重排公共语义布局。')
  if (!node.visible) assert(node.opacity === 0 && !node.interactive, '临时筛选隐藏节点必须退出显示与命中。')
})
assert(focusedMath.nodes.some((node) => node.visibility === 'prerequisite' || node.visibility === 'bridge'), '专业聚焦应保留必要前置或跨域桥梁。')
assert(focusedMath.nodes.some((node) => node.visibility === 'hidden'), '专业聚焦应隐藏无关节点。')
assert(focusedMath.nodes.some((node, index) => node.visible && node.position.some((value, axis) => Math.abs(value - world.nodes[index].position[axis]) > 0.1)), '专业聚焦应重新利用可见空间。')
focusedMath.nodes.forEach((node, index) => {
  assert(node.position.every((value, axis) => value === focusedMathAgain.nodes[index].position[axis]), '专业聚焦结果必须确定。')
  assert(Math.abs(node.radius - world.nodes[index].radius) < 1e-9, '专业聚焦不得改变基础—专业化半径。')
  if (!node.visible) assert(node.opacity === 0 && !node.interactive, '专业聚焦隐藏节点必须退出显示与命中。')
})

const cyclicDataset: KnowledgeSpaceDataset = {
  ...publicKnowledgeSpace,
  edges: [...publicKnowledgeSpace.edges, {
    id: 'cycle-fallback-smoke',
    source: 'calculus',
    target: 'functions',
    type: 'prerequisite',
    strength: 1,
  }],
}
const cyclicDepths = computeKnowledgeDepths(cyclicDataset)
assert(cyclicDepths.fallbackNodeIds.has('functions') && cyclicDepths.fallbackNodeIds.has('calculus'), '前置环应确定性回退到人工 level。')
const cyclicProjection = projectKnowledgeDataset(cyclicDataset, 'world', { relaxationIterations: 0 })
const cyclicFunction = cyclicProjection.nodes.find(({ node }) => node.id === 'functions')!
const cyclicCalculus = cyclicProjection.nodes.find(({ node }) => node.id === 'calculus')!
assert(
  cyclicFunction.radius < cyclicProjection.sphere.outerRadius - 0.5
    && cyclicCalculus.radius < cyclicProjection.sphere.outerRadius - 0.5,
  '前置环的投影半径应保留 level 回退结果，不得被顺序约束推到最外层。',
)

const depthNode = (id: string, level: KnowledgeSpaceNode['level']): KnowledgeSpaceNode => ({
  id,
  title: id,
  englishTitle: id,
  summary: id,
  primaryDomain: 'mathematics',
  domains: ['mathematics'],
  tags: ['depth-test'],
  level,
})
const exactDepthDataset: KnowledgeSpaceDataset = {
  ...publicKnowledgeSpace,
  nodes: [depthNode('a', 0), depthNode('b', 4), depthNode('c', 0), depthNode('d', 0)],
  edges: [
    { id: 'a-b', source: 'a', target: 'b', type: 'prerequisite', strength: 1 },
    { id: 'b-c', source: 'b', target: 'c', type: 'prerequisite', strength: 1 },
    { id: 'c-d-recommended', source: 'c', target: 'd', type: 'prerequisite', prerequisiteKind: 'recommended', strength: 0.7 },
  ],
}
const exactDepths = computeKnowledgeDepths(exactDepthDataset).depthById
assert(exactDepths.get('a') === 0, '严格前置起点深度应为零。')
assert(exactDepths.get('b') === 4, '人工层级只校准节点自身。')
assert(exactDepths.get('c') === 2, '上游人工层级不得沿严格前置关系传播。')
assert(exactDepths.get('d') === 0, '推荐前置不得参与知识深度。')

const halfway = interpolateKnowledgeProjections(world, biology, 0.5)
assert(halfway.nodes.length === world.nodes.length, '连续透镜插值应保持节点身份与数量。')
assert(halfway.lens.id === 'biology', '连续透镜插值应指向目标透镜。')

const focusedHalfway = interpolateKnowledgeProjections(world, focusedMath, 0.5)
assert(focusedHalfway.nodes.every((node) => node.position.every(Number.isFinite)), '筛选切换插值必须保持有限三维坐标。')

const zoomIn = nextGlobalZoom(1, -120, 0, false)
const zoomOut = nextGlobalZoom(1, 120, 0, false)
assert(Math.abs(zoomIn - wheelGlobalZoomFactor(-120, 0, false)) < 1e-12, '三维滚轮步进应与二维画布一致。')
assert(zoomIn > 1 && zoomOut < 1, '三维滚轮必须支持双向缩放。')
assert(nextGlobalZoom(MAX_GLOBAL_ZOOM, -120, 0, false) === MAX_GLOBAL_ZOOM, '全局倍率必须限制最大值。')
assert(nextGlobalZoom(MIN_GLOBAL_ZOOM, 120, 0, false) === MIN_GLOBAL_ZOOM, '全局倍率必须限制最小值。')
assert(MIN_GLOBAL_ZOOM === 0.1 && MAX_GLOBAL_ZOOM === 128, '三维缩放范围应与二维画布保持一致。')
const dampedZoom = dampGlobalZoom(1, 4, 0.09)
assert(dampedZoom > 1 && dampedZoom < 4, '三维缩放缓冲必须在当前值与目标值之间。')
assert(isGlobalZoomSettled(4, 4) && !isGlobalZoomSettled(dampedZoom, 4), '三维缩放收敛判断必须使用对数倍率误差。')
assert(globalZoomPercent(1) === 100 && globalZoomPercent(2.5) === 250, '三维缩放百分比必须直接读取全局倍率。')
const compensation = zoomPanCompensation(6, -3, 1, 2)
assert(Math.abs((6 - compensation.x) * 2 - 6) < 1e-12, '横向指针锚点补偿应抵消全局倍率变化。')
assert(Math.abs((-3 - compensation.y) * 2 + 3) < 1e-12, '纵向指针锚点补偿应抵消全局倍率变化。')

const relationValidationOptions = {
  title: '关系校验',
  ownerNodeId: 'quantity-arithmetic',
  primaryDomain: 'mathematics' as const,
  nodeScale: 0.1,
  domainField: { label: '数学', color: '#8fb8d7', opacity: 0.1, lobeRadius: 0.5 },
  tagFields: { colors: ['#8fb8d7'], opacity: 0.04, lobeRadius: 0.4 },
}
const nonStrictCycle = createThreeKnowledgeSubspace({
  ...relationValidationOptions,
  id: 'non-strict-cycle-check',
  nodes: [
    {
      id: 'left', title: '左', englishTitle: 'Left', summary: '测试非严格关系。', tags: [], fieldTags: [], level: 0,
      localPosition: [-1, 0, 0] as const,
      relations: [{ sourceId: 'right', kind: 'analogy' as const }],
    },
    {
      id: 'right', title: '右', englishTitle: 'Right', summary: '测试非严格关系。', tags: [], fieldTags: [], level: 0,
      localPosition: [1, 0, 0] as const,
      relations: [{ sourceId: 'left', kind: 'shared-model' as const }],
    },
  ],
})
assert(nonStrictCycle.edges.length === 2, '类比与共享模型可以双向关联，不应被误判为严格前置环。')
let strictCycleRejected = false
try {
  createThreeKnowledgeSubspace({
    ...relationValidationOptions,
    id: 'strict-cycle-check',
    nodes: [
      {
        id: 'left', title: '左', englishTitle: 'Left', summary: '测试严格关系。', tags: [], fieldTags: [], level: 0,
        localPosition: [-1, 0, 0] as const,
        relations: [{ sourceId: 'right', kind: 'strict-prerequisite' as const }],
      },
      {
        id: 'right', title: '右', englishTitle: 'Right', summary: '测试严格关系。', tags: [], fieldTags: [], level: 0,
        localPosition: [1, 0, 0] as const,
        relations: [{ sourceId: 'left', kind: 'strict-prerequisite' as const }],
      },
    ],
  })
} catch {
  strictCycleRejected = true
}
assert(strictCycleRejected, '严格前置关系形成循环时，三维子域定义必须立即拒绝。')

assert(arithmeticThreeSubspace.ownerNodeId === 'quantity-arithmetic', '三维数与运算子域必须锚定公共基础节点。')
assert(arithmeticThreeSubspace.nodes.length === 13, '三维数与运算子域应包含十三个内部节点。')
assert(arithmeticThreeSubspace.edges.length === 21, '三维数与运算子域应包含二十一条类型化关系。')
const arithmeticNodeIds = new Set(arithmeticThreeSubspace.nodes.map(({ node }) => node.id))
const expectedArithmeticNodeIds = [
  'place-value',
  'addition-subtraction',
  'multiplication-division',
  'divisibility-factors-primes',
  'integers-number-line',
  'fractions-rationals',
  'operation-properties',
  'decimal-representations',
  'decimals-percents-ratios',
  'powers-roots-scientific-notation',
  'real-number-system',
  'complex-numbers',
  'estimation-checking',
].map((id) => `arithmetic:${id}`)
assert(
  expectedArithmeticNodeIds.every((nodeId) => arithmeticNodeIds.has(nodeId)),
  '三维数与运算子域必须保留完整而稳定的十三节点概念集合。',
)
assert(
  arithmeticThreeSubspace.edges.filter(({ prerequisiteKind }) => prerequisiteKind === 'strict').length === 15
    && arithmeticThreeSubspace.edges.filter(({ prerequisiteKind }) => prerequisiteKind === 'recommended').length === 6,
  '三维数与运算子域必须区分十五条严格前置与六条建议前置。',
)
assert(
  arithmeticThreeSubspace.edges.every(({ source, target }) => (
    arithmeticNodeIds.has(source) && arithmeticNodeIds.has(target)
  )),
  '三维数与运算子域的关系必须全部解析到域内节点。',
)
const arithmeticSubspaceFields = arithmeticThreeSubspace.fields ?? []
assert(arithmeticSubspaceFields.length === 5, '三维数与运算子域应生成一个领域场和四个共享标签场。')
assert(
  arithmeticSubspaceFields.every((field) => field.lobes.length >= 2),
  '三维数与运算子域的每个场域都必须至少覆盖两个内部节点。',
)
assert(
  arithmeticThreeSubspace.nodes.every(({ node, localPosition, scale }) => (
    node.id.startsWith('arithmetic:')
      && localPosition.every(Number.isFinite)
      && scale === 0.132
  )),
  '三维数与运算子域节点必须使用命名空间身份、有限局部坐标和统一尺寸。',
)
assert(threeKnowledgeSubspaces.length === 7, '集中注册表应收录三个数学子域与四个认知/神经科学试点子域。')
assert(
  new Set(threeKnowledgeSubspaces.map((subspace) => subspace.id)).size === threeKnowledgeSubspaces.length
    && new Set(threeKnowledgeSubspaces.map((subspace) => subspace.ownerNodeId)).size === threeKnowledgeSubspaces.length,
  '集中注册表中的子域 ID 与父节点必须一一对应。',
)
const publicNodeIds = new Set(publicKnowledgeSpace.nodes.map((node) => node.id))
for (const subspace of threeKnowledgeSubspaces) {
  const localNodeIds = new Set(subspace.nodes.map(({ node }) => node.id))
  assert(publicNodeIds.has(subspace.ownerNodeId), `三维子域 ${subspace.id} 必须锚定现有公共父节点。`)
  assert(
    subspace.edges.every((edge) => localNodeIds.has(edge.source) && localNodeIds.has(edge.target)),
    `三维子域 ${subspace.id} 的关系必须全部解析到域内节点。`,
  )
  assert(
    subspace.revealStartPx === THREE_SUBSPACE_TRANSITION_DEFAULTS.revealStartPx
      && subspace.revealEndPx === THREE_SUBSPACE_TRANSITION_DEFAULTS.revealEndPx
      && subspace.scopeEnterZoom === THREE_SUBSPACE_TRANSITION_DEFAULTS.scopeEnterZoom
      && subspace.scopeExitZoom === THREE_SUBSPACE_TRANSITION_DEFAULTS.scopeExitZoom,
    `三维子域 ${subspace.id} 必须复用公共工厂的默认进入退出参数。`,
  )
}
const registeredSubspaceRelationKinds = new Set(threeKnowledgeSubspaces.flatMap((subspace) => (
  subspace.edges.map((edge) => (
    edge.type === 'prerequisite'
      ? `${edge.prerequisiteKind ?? 'strict'}-prerequisite`
      : edge.type
  ))
)))
for (const kind of ['strict-prerequisite', 'recommended-prerequisite', 'shared-model', 'analogy', 'application']) {
  assert(registeredSubspaceRelationKinds.has(kind), `三维子域注册表应实际使用 ${kind} 关系。`)
}
assert(
  threeKnowledgeSubspaces.filter((subspace) => (
    subspace.nodes[0]?.node.primaryDomain === 'cognitive-science'
    || subspace.nodes[0]?.node.primaryDomain === 'neuroscience'
  )).length === 4,
  '认知科学与神经科学应各提供两个可下钻的代表性父域。',
)

assert(linearAlgebraThreeSubspace.ownerNodeId === 'linear-algebra', '三维线性代数子域必须锚定公共线性代数父节点。')
assert(linearAlgebraThreeSubspace.nodes.length === 18, '三维线性代数子域应复用十八个二维内部节点。')
assert(linearAlgebraThreeSubspace.edges.length === 38, '三维线性代数子域应包含三十八条类型化关系。')
const linearAlgebraNodeIds = new Set(linearAlgebraThreeSubspace.nodes.map(({ node }) => node.id))
assert(
  linearAlgebraThreeSubspace.nodes.find(({ node }) => node.id === 'linear-algebra:vectors-coordinates')
    ?.node.canonicalConceptId === 'vectors-coordinates',
  '三维线性代数向量投影必须指向公共向量规范概念。',
)
assert(
  linearAlgebraThreeSubspace.edges.filter(({ prerequisiteKind }) => prerequisiteKind === 'strict').length === 31
    && linearAlgebraThreeSubspace.edges.filter(({ prerequisiteKind }) => prerequisiteKind === 'recommended').length === 2
    && linearAlgebraThreeSubspace.edges.filter(({ type }) => type === 'shared-model').length === 2
    && linearAlgebraThreeSubspace.edges.filter(({ type }) => type === 'application').length === 3,
  '三维线性代数子域必须区分三十一条严格前置、两条建议前置、两条共享模型和三条应用关系。',
)
assert(
  linearAlgebraThreeSubspace.edges.every(({ source, target }) => (
    linearAlgebraNodeIds.has(source) && linearAlgebraNodeIds.has(target)
  )),
  '三维线性代数子域的关系必须全部解析到域内节点。',
)
const linearAlgebraSubspaceFields = linearAlgebraThreeSubspace.fields ?? []
assert(linearAlgebraSubspaceFields.length === 6, '三维线性代数子域应生成一个领域场和五个学习阶段场。')
assert(
  linearAlgebraSubspaceFields.slice(1).map(({ tag }) => tag).join('|')
    === '直观基础|方程计算|空间结构|几何与谱|进阶工具',
  '三维线性代数子域必须按五个学习阶段生成场域。',
)
assert(
  linearAlgebraSubspaceFields.every((field) => field.lobes.length >= 2),
  '三维线性代数子域的每个场域都必须至少覆盖两个内部节点。',
)
assert(
  linearAlgebraThreeSubspace.nodes.every(({ node, localPosition, scale }) => (
    node.id.startsWith('linear-algebra:')
      && localPosition.every(Number.isFinite)
      && scale === 0.115
  )),
  '三维线性代数子域节点必须使用命名空间身份、有限局部坐标和统一尺寸。',
)

assert(calculusThreeSubspace.ownerNodeId === 'calculus', '三维微积分子域必须锚定微积分父节点。')
assert(calculusThreeSubspace.nodes.length === 6, '三维微积分子域应复用六个二维内部节点。')
assert(calculusThreeSubspace.edges.length === 7, '三维微积分子域应复用七条前置关系。')
const calculusSubspaceFields = calculusThreeSubspace.fields ?? []
assert(calculusSubspaceFields.length >= 3, '三维微积分子域应生成领域环境场和共享标签场。')
assert(
  calculusSubspaceFields.every((field) => field.lobes.length >= 2),
  '三维微积分子域的每个场域都必须至少覆盖两个内部节点。',
)
assert(
  calculusThreeSubspace.scopeEnterZoom === 12.45
    && calculusThreeSubspace.scopeExitZoom === 8
    && calculusThreeSubspace.scopeExitZoom < calculusThreeSubspace.scopeEnterZoom,
  '三维微积分子域必须以 1245% 进入、800% 退出，并保持独立滞回区间。',
)
assert(
  calculusThreeSubspace.nodes.every(({ node, localPosition, scale }) => (
    node.id.startsWith('calculus:')
      && localPosition.every(Number.isFinite)
      && scale === 0.144
  )),
  '三维微积分子域节点必须使用命名空间身份、有限局部坐标和统一缩小后的尺寸。',
)
assert(
  subspaceRevealProgress(360, 360, 620) === 0
    && subspaceRevealProgress(620, 360, 620) === 1,
  '三维子域显隐应覆盖完整的连续区间。',
)
assert(parentScopeWeight(1) === 0, '三维子域完全显现后父域必须完全隐藏。')
assert(
  parentFieldScopeWeight(0) === 1 && parentFieldScopeWeight(1) === 0,
  '父场域必须在子域推进期间从完整显示连续消散。',
)
assert(
  childFieldScopeWeight(0) === 0 && childFieldScopeWeight(1) === 1,
  '子场域必须在子域推进期间从隐藏连续显现。',
)
assert(
  parentFieldScopeWeight(0.4) > 0 && childFieldScopeWeight(0.4) > 0,
  '父子场域必须保留交叉显示区间，避免钻取过程出现无光空档。',
)
const childRotationCenter = subspaceCardCenter([
  [2, -1, 4],
  [4, 3, 0],
  [6, 1, 2],
], [9, 9, 9])
assert(
  childRotationCenter.every((value, axis) => value === [4, 1, 2][axis]),
  '三维子域旋转中心必须取当前子域卡片世界坐标的算术中心。',
)
assert(
  subspaceCardCenter([], [7, 8, 9]).every((value, axis) => value === [7, 8, 9][axis]),
  '没有有效子域卡片时旋转中心必须回退到公共投影中心。',
)
assert(
  subspaceEntryZoom(2, 310, 620, 12.45, MAX_GLOBAL_ZOOM) === 12.45,
  '双击父节点必须至少把全局倍率推进到子域进入阈值。',
)
assert(
  subspaceEntryZoom(100, 100, 620, 12.45, MAX_GLOBAL_ZOOM) === MAX_GLOBAL_ZOOM,
  '双击进入子域的目标倍率不得超过全局倍率上限。',
)
assert(
  !shouldEnterSubspaceScope(12.44, 1, 12.45)
    && shouldEnterSubspaceScope(12.45, 0.8, 12.45),
  '三维子域只能在实际倍率和显隐进度同时达到进入阈值后接管作用域。',
)
assert(
  !shouldExitSubspaceScope(8.01, 8) && shouldExitSubspaceScope(8, 8),
  '三维子域在 800% 以上必须保持作用域，达到 800% 时退出。',
)
const delayedReveal = createSubspaceRevealRange(800, 360, 620)
assert(delayedReveal.startPx === 800 && delayedReveal.endPx === 1320, '高倍率首次触发子域时仍应保留连续展开区间。')
assert(
  RELATED_NODE_LODS.join(',') === 'card,title',
  '三维直接关系邻居的 LOD 不得退化为光点。',
)
assert(RELATED_NODE_MIN_OPACITY === 0.88, '三维直接关系邻居必须保持稳定的最低透明度。')
assert(
  NODE_DISPLAY_RENDER_ORDER.hovered > NODE_DISPLAY_RENDER_ORDER.selected
    && NODE_DISPLAY_RENDER_ORDER.selected > NODE_DISPLAY_RENDER_ORDER.default,
  '三维卡片显示层级必须满足悬停高于选中、选中高于普通。',
)
assert(
  resolveNodeDisplayPriority(true, false) === 'selected'
    && resolveNodeDisplayPriority(true, true) === 'hovered'
    && HOVERED_NODE_VISUAL_SCALE === 1.06,
  '三维卡片悬停必须覆盖选中显示层并使用受控的轻微放大。',
)
assert(CARD_FOCUS_CONTEXT_OPACITY === 0.46, '二维与三维必须共享相同的关联聚焦淡化系数。')
const selectedCardFocus = resolveCardFocusState({
  allNodeIds: ['primary', 'related', 'context'],
  primaryNodeIds: ['primary'],
  relatedNodeIds: ['primary', 'related', 'missing'],
})
assert(getCardFocusRole(selectedCardFocus, 'primary') === 'primary', '主卡必须优先于重复的关联卡身份。')
assert(getCardFocusRole(selectedCardFocus, 'related') === 'related', '关联卡必须保持共享高亮身份。')
assert(getCardFocusRole(selectedCardFocus, 'context') === 'context', '未命中卡片必须进入低透明度上下文。')
assert(getCardFocusEdgeRole(selectedCardFocus, 'primary', 'related') === 'connected', '焦点卡片之间的边必须高亮。')
assert(getCardFocusEdgeRole(selectedCardFocus, 'related', 'context') === 'context', '离开焦点集合的边必须淡化。')
const lightPrerequisiteEdge = new Color(knowledgeEdgeColor('prerequisite', 'light'))
const darkPrerequisiteEdge = new Color(knowledgeEdgeColor('prerequisite', 'dark'))
const linearLuminance = (color: Color) => 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
assert(
  linearLuminance(darkPrerequisiteEdge) > linearLuminance(lightPrerequisiteEdge) * 2,
  '深色主题的普通前置连线必须显著亮于浅色主题基线色。',
)
assert(
  knowledgeEdgeOpacity(1, 'default', 'dark') === 0.36
    && knowledgeEdgeOpacity(1, 'default', 'dark') > knowledgeEdgeOpacity(1, 'default', 'light')
    && knowledgeEdgeOpacity(1, 'connected', 'dark') === 0.92
    && knowledgeEdgeOpacity(1, 'context', 'dark') < 0.04,
  '深色主题必须提高普通和选中关系的可见度，同时继续压低无关连线。',
)
assert(
  EDGE_PULSE_PERIOD_SECONDS === 1.8
    && focusedKnowledgeEdgePulse(selectedCardFocus, 'primary', 'related') === 1
    && focusedKnowledgeEdgePulse(selectedCardFocus, 'related', 'primary') === 1
    && focusedKnowledgeEdgePulse(selectedCardFocus, 'related', 'context') === 0,
  '规律脉冲只能出现在主选择节点与直接关联节点之间，并保持固定周期。',
)
const radarCardFocus = resolveCardFocusState({
  allNodeIds: ['radar-a', 'radar-b', 'context'],
  relatedNodeIds: ['radar-a', 'radar-b'],
})
assert(radarCardFocus.active && radarCardFocus.primaryNodeIds.size === 0, '前沿雷达必须支持没有主卡的批量命中聚焦。')
assert(
  getCardFocusRole(radarCardFocus, 'radar-a') === 'related'
    && getCardFocusRole(radarCardFocus, 'context') === 'context',
  '前沿雷达命中卡必须复用关联卡显示，其余卡片必须淡化。',
)
assert(
  focusedKnowledgeEdgePulse(radarCardFocus, 'radar-a', 'radar-b') === 0,
  '没有主选择节点的雷达聚焦不得启动方向脉冲。',
)
assert(
  !resolveCardFocusState({ allNodeIds: ['visible'], relatedNodeIds: ['missing'] }).active,
  '当前画布没有命中卡片时不得把整张地图错误淡化。',
)
const bubbleCandidates: KnowledgeBubbleCandidate[] = [
  { id: 'near-a', importance: 0.1, cameraDistance: 1, rect: { left: 10, right: 50, top: 10, bottom: 40 } },
  { id: 'near-b', importance: 0.2, cameraDistance: 2, rect: { left: 70, right: 110, top: 10, bottom: 40 } },
  { id: 'near-c', importance: 0.3, cameraDistance: 3, rect: { left: 130, right: 170, top: 10, bottom: 40 } },
  { id: 'central', importance: 1, cameraDistance: 100, rect: { left: 190, right: 230, top: 10, bottom: 40 } },
  { id: 'far', importance: 0, cameraDistance: 101, rect: { left: 250, right: 290, top: 10, bottom: 40 } },
]
const selectedBubbles = selectKnowledgeBubbles({
  candidates: bubbleCandidates,
  viewportWidth: 400,
  viewportHeight: 120,
})
const reorderedBubbles = selectKnowledgeBubbles({
  candidates: [...bubbleCandidates].reverse(),
  viewportWidth: 400,
  viewportHeight: 120,
})
assert(
  KNOWLEDGE_BUBBLE_PIXEL_HEIGHT === 26
    && KNOWLEDGE_BUBBLE_FONT_SIZE_PX === 13
    && KNOWLEDGE_BUBBLE_GAP_PX === 7
    && KNOWLEDGE_BUBBLE_STAR_GAP_PX === 16
    && KNOWLEDGE_BUBBLE_CENTER_OFFSET_PX === 29
    && KNOWLEDGE_BUBBLE_DENSITY_RATIO === 0.11,
  '三维知识气泡必须使用固定屏幕像素尺寸、星点上方偏移、间距和密度预算。',
)
assert(
  KNOWLEDGE_CARD_PIXEL_WIDTH === 280
    && KNOWLEDGE_CARD_PIXEL_HEIGHT === 105
    && knowledgeLabelCenterOffsetPx(KNOWLEDGE_BUBBLE_PIXEL_HEIGHT)
      - KNOWLEDGE_BUBBLE_PIXEL_HEIGHT / 2 === KNOWLEDGE_BUBBLE_STAR_GAP_PX
    && knowledgeLabelCenterOffsetPx(KNOWLEDGE_CARD_PIXEL_HEIGHT)
      - KNOWLEDGE_CARD_PIXEL_HEIGHT / 2 === KNOWLEDGE_BUBBLE_STAR_GAP_PX,
  '中文气泡与保留的旧完整卡片回退尺寸必须共用固定底边换算。',
)
assert(
  SELECTED_NODE_STAR_SCALE === 2
    && activeBubbleNodeLod(true, false) === 'title'
    && activeBubbleNodeLod(false, true) === 'title'
    && activeBubbleNodeLod(false, false) === 'glow',
  '当前气泡机制不得为主选择节点生成完整卡片，并必须把选中星点放大为两倍。',
)
assert(
  DOMAIN_OVERVIEW_START_ZOOM === 1
    && DOMAIN_OVERVIEW_FULL_ZOOM === 0.7
    && DOMAIN_LABEL_PIXEL_HEIGHT === 48
    && DOMAIN_LABEL_MAX_OPACITY === 0.5
    && domainOverviewProgress(1) === 0
    && domainOverviewProgress(0.7) === 1
    && Math.abs(domainOverviewProgress(0.85) - 0.5) < 1e-8,
  '大域总览必须从 100% 以下开始平滑淡入，并在 70% 时完成切换。',
)
assert(
  nodeNameOverviewOpacity(0.4, false) === 0
    && nodeNameOverviewOpacity(0.4, true) === 1,
  '低缩放时普通节点名称必须淡出，但选中节点及其直接关联节点必须保持显示。',
)
assert(
  relatedNodeDepthRenderOrder(2) > relatedNodeDepthRenderOrder(20),
  '选中节点的关联气泡发生重叠时，离镜头更近的气泡必须绘制在更上层。',
)
const darkDomainLabel = new Color(domainLabelTextColor('#496f9a', 'dark'))
const lightDomainLabel = new Color(domainLabelTextColor('#496f9a', 'light'))
assert(
  darkDomainLabel.getHSL({ h: 0, s: 0, l: 0 }).l
    < lightDomainLabel.getHSL({ h: 0, s: 0, l: 0 }).l,
  '大域名称必须保留领域主题色，并在深色模式压暗以越过高亮星云背景。',
)
assert(
  selectedBubbles.has('near-a')
    && selectedBubbles.has('near-b')
    && selectedBubbles.has('central')
    && [...selectedBubbles].every((id) => reorderedBubbles.has(id))
    && selectedBubbles.size === reorderedBubbles.size,
  '气泡优先级必须稳定交织镜头近邻与关系中心节点，且不受输入顺序影响。',
)
const addOnlyBubbles = selectKnowledgeBubbles({
  candidates: bubbleCandidates,
  viewportWidth: 400,
  viewportHeight: 120,
  existingIds: new Set(['near-a', 'existing-offscreen']),
  pinnedId: 'last-interaction',
  addOnly: true,
})
assert(
  addOnlyBubbles.has('near-a')
    && addOnlyBubbles.has('existing-offscreen')
    && addOnlyBubbles.has('last-interaction'),
  '靠近缩放只能增量加入气泡，并必须保留现有气泡与最后互动节点。',
)
const collisionBubbles = selectKnowledgeBubbles({
  candidates: [
    { id: 'collision-a', importance: 1, cameraDistance: 1, rect: { left: 20, right: 80, top: 20, bottom: 50 } },
    { id: 'collision-b', importance: 0.9, cameraDistance: 2, rect: { left: 60, right: 120, top: 20, bottom: 50 } },
  ],
  viewportWidth: 500,
  viewportHeight: 300,
})
assert(collisionBubbles.size === 1, '普通知识气泡不得在屏幕像素矩形上互相覆盖。')
const focusedRelationBubbles = selectKnowledgeBubbles({
  candidates: [
    { id: 'ordinary-near', importance: 1, cameraDistance: 1, rect: { left: 20, right: 80, top: 20, bottom: 50 } },
    { id: 'focused-relation', importance: 0, cameraDistance: 100, rect: { left: 60, right: 120, top: 20, bottom: 50 } },
  ],
  viewportWidth: 500,
  viewportHeight: 300,
  priorityIds: new Set(['focused-relation']),
})
assert(
  focusedRelationBubbles.has('focused-relation')
    && !focusedRelationBubbles.has('ordinary-near'),
  '选中节点的直接关系必须先于普通近邻占用气泡位置。',
)
assert(
  stableLodDetail([18]) === 0
    && stableLodDetail([72]) === 1
    && stableLodMinimumEmphasis(0) === 0.7
    && stableLodMinimumEmphasis(1) === 0,
  '稳定 LOD 必须在远景提高语义门槛，并在近景向全部可见节点开放。',
)
assert(
  stableLodLabelBudget(1600, 900, 1) > stableLodLabelBudget(1600, 900, 0),
  '稳定 LOD 的文字卡名额必须随近景细节等级增加。',
)
assert(
  stableLodScore({ emphasis: 0.9, hemisphere: -1, projectedHeight: 10, detail: 0, hiddenForMs: 0 })
    > stableLodScore({ emphasis: 0.4, hemisphere: 1, projectedHeight: 100, detail: 0, hiddenForMs: 0 }),
  '远景稳定 LOD 必须让语义重要度主导正面程度和投影尺寸。',
)
assert(
  STABLE_LOD_CORE_FOUNDATION_START === 0.84
    && STABLE_LOD_CORE_FOUNDATION_FULL === 0.95
    && stableLodCoreStrength(0.84) === 0
    && stableLodCoreStrength(0.95) === 1
    && stableLodSemanticPriority(0.56, 0.982) > stableLodMinimumEmphasis(0)
    && stableLodScore({
      emphasis: 0.8,
      foundationScore: 0.982,
      hemisphere: 0,
      projectedHeight: 30,
      detail: 0.4,
      hiddenForMs: 0,
    }) > stableLodScore({
      emphasis: 0.8,
      foundationScore: 0.2,
      hemisphere: 0,
      projectedHeight: 30,
      detail: 0.4,
      hiddenForMs: 0,
    })
    && stableLodRetentionBonus(0.982) > stableLodRetentionBonus(0.2),
  '高前置覆盖中心度必须提高卡片的语义排序和保留加成。',
)
assert(
  !stableHemisphereEligibility(false, -0.1)
    && stableHemisphereEligibility(false, 0)
    && stableHemisphereEligibility(true, -0.2)
    && !stableHemisphereEligibility(true, -0.31),
  '半球候选资格必须使用独立的进入与退出阈值。',
)
assert(
  stableDesiredLod(27, 'glow') === 'glow'
    && stableDesiredLod(28, 'glow') === 'title'
    && stableDesiredLod(20, 'title') === 'title'
    && stableDesiredLod(19, 'title') === 'glow'
    && stableDesiredLod(70, 'title') === 'card'
    && stableDesiredLod(54, 'card') === 'card'
    && stableDesiredLod(53, 'card') === 'title',
  '卡片、标题和光点必须使用成对的 LOD 进入/退出阈值。',
)
assert(
  stableDesiredLod(23, 'glow', 0.2) === 'glow'
    && stableDesiredLod(23, 'glow', 0.982) === 'title'
    && stableDesiredLod(56, 'title', 0.2) === 'title'
    && stableDesiredLod(56, 'title', 0.982) === 'card',
  '最高一档中心知识必须以较小的实际投影尺寸进入标题卡和完整卡。',
)
const viewReferenceDistance = 100
const viewReferenceZoom = 2
const viewEffectiveDistance = viewReferenceDistance / viewReferenceZoom
assert(
  STABLE_LOD_VIEW_REFRESH_TRAVEL_RATIO === 0.18
    && STABLE_LOD_VIEW_REFRESH_ANGLE_RADIANS === Math.PI / 15
    && STABLE_LOD_VIEW_REFRESH_DURATION_MS === 1_100
    && !stableLodViewRefreshNeeded({
      cameraTravel: viewEffectiveDistance * 0.18,
      lookAtTravel: viewEffectiveDistance * 0.1,
      referenceDistance: viewReferenceDistance,
      referenceZoom: viewReferenceZoom,
      viewAngleRadians: Math.PI / 16,
    })
    && stableLodViewRefreshNeeded({
      cameraTravel: viewEffectiveDistance * 0.181,
      lookAtTravel: 0,
      referenceDistance: viewReferenceDistance,
      referenceZoom: viewReferenceZoom,
      viewAngleRadians: 0,
    })
    && stableLodViewRefreshNeeded({
      cameraTravel: 0,
      lookAtTravel: 0,
      referenceDistance: viewReferenceDistance,
      referenceZoom: viewReferenceZoom,
      viewAngleRadians: Math.PI / 14,
    })
    && stableLodInteractionRetained({
      cameraTravel: viewEffectiveDistance * 0.181,
      lookAtTravel: 0,
      referenceDistance: viewReferenceDistance,
      referenceZoom: viewReferenceZoom,
      currentZoom: viewReferenceZoom,
    }),
  '普通卡片必须在累计位移或视角跨过换景门槛后重排，同时不得释放仍在独立保留范围内的最后互动卡。',
)
assert(
  STABLE_LOD_EVALUATION_INTERVAL_MS === 80
    && STABLE_LOD_PROMOTION_DWELL_MS === 140
    && STABLE_LOD_DEMOTION_DWELL_MS === 80
    && STABLE_LOD_MIN_HOLD_MS === 180
    && STABLE_LOD_RETENTION_BONUS === 0.08
    && STABLE_LOD_MAX_SWAPS_PER_EVALUATION === 4
    && !stableLodChangeReady(179, 0, 0, true)
    && stableLodChangeReady(180, 0, 100, true)
    && !stableLodChangeReady(239, 0, 100, false)
    && stableLodChangeReady(240, 0, 100, false),
  '实时 LOD 调度必须以降级快于升级的非对称驻留限制评估、保持和单轮换位。',
)
assert(
  !stableLodChangeReady(899, 0, 0, true, 0.982)
    && stableLodChangeReady(900, 0, 0, true, 0.982),
  '最高一档中心知识的文字卡降级前必须至少保持 900 毫秒。',
)
const interactionReferenceDistance = 100
const interactionReferenceZoom = 2
const interactionEffectiveViewDistance = interactionReferenceDistance / interactionReferenceZoom
assert(
  STABLE_LOD_INTERACTION_MAX_TRAVEL_RATIO === 0.45
    && STABLE_LOD_INTERACTION_MAX_ZOOM_OCTAVES === 0.75
    && stableLodInteractionRetained({
      cameraTravel: interactionEffectiveViewDistance * 0.45,
      lookAtTravel: interactionEffectiveViewDistance * 0.2,
      referenceDistance: interactionReferenceDistance,
      referenceZoom: interactionReferenceZoom,
      currentZoom: interactionReferenceZoom * 2 ** 0.75,
    })
    && !stableLodInteractionRetained({
      cameraTravel: interactionEffectiveViewDistance * 0.451,
      lookAtTravel: 0,
      referenceDistance: interactionReferenceDistance,
      referenceZoom: interactionReferenceZoom,
      currentZoom: interactionReferenceZoom,
    })
    && !stableLodInteractionRetained({
      cameraTravel: 0,
      lookAtTravel: 0,
      referenceDistance: interactionReferenceDistance,
      referenceZoom: interactionReferenceZoom,
      currentZoom: interactionReferenceZoom * 2 ** 0.751,
    }),
  '最后互动卡片必须在小范围相机移动和缩放内保留，并在镜头走远后释放。',
)
for (const referenceZoom of [0.1, 0.7, 2, 10, 128]) {
  const zoomFactor = 2 ** STABLE_LOD_INTERACTION_MAX_ZOOM_OCTAVES
  const retainedAtZoom = (currentZoom: number) => stableLodInteractionRetained({
    cameraTravel: 0,
    lookAtTravel: 0,
    referenceDistance: interactionReferenceDistance,
    referenceZoom,
    currentZoom,
  })
  assert(
    retainedAtZoom(referenceZoom / zoomFactor)
      && retainedAtZoom(referenceZoom * zoomFactor)
      && !retainedAtZoom(referenceZoom / 2 ** 0.751)
      && !retainedAtZoom(referenceZoom * 2 ** 0.751),
    `最后互动卡片必须在参考倍率 ${referenceZoom} 的双向缩放边界保持，并在越界后释放。`,
  )
}

console.log(`3D semantic knowledge layout smoke test passed: ${validation.stats.nodes} nodes, ${validation.stats.edges} edges, ${validation.stats.crossDomainNodes} cross-domain nodes, ${validation.stats.crossDomainEdges} cross-domain edges, ${world.fields.filter((field) => field.kind === 'tag').length} tag fields, ${world.fields.reduce((sum, field) => sum + field.lobes.length, 0)} field lobes; ${threeKnowledgeSubspaces.length} subspaces, ${threeKnowledgeSubspaces.reduce((sum, subspace) => sum + subspace.nodes.length, 0)} local nodes, ${threeKnowledgeSubspaces.reduce((sum, subspace) => sum + subspace.edges.length, 0)} local edges, ${threeKnowledgeSubspaces.reduce((sum, subspace) => sum + (subspace.fields?.length ?? 0), 0)} local fields; spans ${axisSpans.map((value) => value.toFixed(1)).join('×')}, collision gap ${minimumCollisionGap.toFixed(3)}.`)
