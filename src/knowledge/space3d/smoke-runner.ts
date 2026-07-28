import {
  computeKnowledgeDepths,
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
  createSubspaceRevealRange,
  parentScopeWeight,
  shouldEnterSubspaceScope,
  shouldExitSubspaceScope,
  subspaceCardCenter,
  subspaceEntryZoom,
  subspaceRevealProgress,
} from '../../renderers/three/subspaceLod'
import { calculusThreeSubspace } from '../../features/space3d/calculusSubspace'
import {
  HOVERED_NODE_VISUAL_SCALE,
  NODE_DISPLAY_RENDER_ORDER,
  RELATED_NODE_LODS,
  RELATED_NODE_MIN_OPACITY,
  resolveNodeDisplayPriority,
} from '../../renderers/three/selectionFocus'
import {
  STABLE_LOD_DEMOTION_DWELL_MS,
  STABLE_LOD_EVALUATION_INTERVAL_MS,
  STABLE_LOD_MAX_SWAPS_PER_EVALUATION,
  STABLE_LOD_MIN_HOLD_MS,
  STABLE_LOD_PROMOTION_DWELL_MS,
  STABLE_LOD_RETENTION_BONUS,
  stableDesiredLod,
  stableHemisphereEligibility,
  stableLodChangeReady,
  stableLodDetail,
  stableLodLabelBudget,
  stableLodMinimumEmphasis,
  stableLodScore,
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
assert(validation.stats.domains === 6, '公共知识空间应包含六个理科领域。')
assert(validation.stats.nodes === 276, '公共知识空间应包含 276 个主节点。')
for (const domain of SCIENCE_DOMAIN_ORDER) {
  assert(publicKnowledgeSpace.nodes.filter((node) => node.primaryDomain === domain).length === 46, `领域 ${domain} 应包含 46 个主节点。`)
}
assert(validation.stats.edges === 799, '公共知识空间应包含 799 条前置与跨域关系。')
assert(validation.stats.lenses === 8, '公共知识空间应提供八个公共透镜。')
assert(validation.stats.crossDomainNodes === 196, '公共知识空间应包含 196 个多领域桥接节点。')
assert(validation.stats.crossDomainEdges === 246, '公共知识空间应包含 246 条跨主领域关系。')

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
assert(world.fields.filter((field) => field.kind === 'tag').length === 90, '公共投影应生成 90 个自动标签场。')

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
  radiiByDepth.set(node.knowledgeDepth, [...(radiiByDepth.get(node.knowledgeDepth) ?? []), node.radius])
  assert(Math.abs(Math.hypot(...node.position) - node.radius) < 1e-6, `节点 ${node.node.id} 必须保持知识半径。`)
})
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

assert(calculusThreeSubspace.ownerNodeId === 'calculus', '三维微积分子域必须锚定微积分父节点。')
assert(calculusThreeSubspace.nodes.length === 6, '三维微积分子域应复用六个二维内部节点。')
assert(calculusThreeSubspace.edges.length === 7, '三维微积分子域应复用七条前置关系。')
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
  !resolveCardFocusState({ allNodeIds: ['visible'], relatedNodeIds: ['missing'] }).active,
  '当前画布没有命中卡片时不得把整张地图错误淡化。',
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

console.log(`3D semantic knowledge layout smoke test passed: ${validation.stats.nodes} nodes, ${validation.stats.edges} edges, ${validation.stats.crossDomainNodes} cross-domain nodes, ${validation.stats.crossDomainEdges} cross-domain edges, ${world.fields.filter((field) => field.kind === 'tag').length} tag fields, ${world.fields.reduce((sum, field) => sum + field.lobes.length, 0)} field lobes, spans ${axisSpans.map((value) => value.toFixed(1)).join('×')}, collision gap ${minimumCollisionGap.toFixed(3)}.`)
