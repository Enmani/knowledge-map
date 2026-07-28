import {
  computeKnowledgeDepths,
  interpolateKnowledgeProjections,
  knowledgeLenses,
  projectKnowledgeSpace,
  publicKnowledgeSpace,
  KNOWLEDGE_NODE_COLLISION_RADIUS,
  TETRAHEDRAL_DOMAIN_DIRECTIONS,
  validateKnowledgeSpaceDataset,
} from './index'
import type { KnowledgeSpaceDataset, KnowledgeSpaceNode, ScienceDomainId } from './types'
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
  subspaceRevealProgress,
} from '../../renderers/three/subspaceLod'
import { calculusThreeSubspace } from '../../features/space3d/calculusSubspace'
import {
  RELATED_NODE_LODS,
  RELATED_NODE_MIN_OPACITY,
} from '../../renderers/three/selectionFocus'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const validation = validateKnowledgeSpaceDataset(publicKnowledgeSpace)
assert(validation.valid, `三维知识数据校验失败：${validation.errors.join('；')}`)
assert(validation.warnings.length === 0, `三维知识数据存在警告：${validation.warnings.join('；')}`)
assert(validation.stats.domains === 4, '公共知识空间应包含四个理科领域。')
assert(validation.stats.nodes === 184, '公共知识空间应包含 184 个主节点。')
for (const domain of ['mathematics', 'physics', 'chemistry', 'biology'] as const) {
  assert(publicKnowledgeSpace.nodes.filter((node) => node.primaryDomain === domain).length === 46, `领域 ${domain} 应包含 46 个主节点。`)
}
assert(validation.stats.edges >= 300, '公共知识空间应包含足够的前置与跨域关系。')
assert(validation.stats.lenses === 6, '公共知识空间应提供六个公共透镜。')
assert(validation.stats.crossDomainNodes >= 20, '公共知识空间应包含足够的多领域桥接节点。')
assert(validation.stats.crossDomainEdges >= 30, '公共知识空间应包含足够的跨领域关系。')

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

const domainIds: readonly ScienceDomainId[] = ['mathematics', 'physics', 'chemistry', 'biology']
for (let leftIndex = 0; leftIndex < domainIds.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < domainIds.length; rightIndex += 1) {
    const left = TETRAHEDRAL_DOMAIN_DIRECTIONS[domainIds[leftIndex]]
    const right = TETRAHEDRAL_DOMAIN_DIRECTIONS[domainIds[rightIndex]]
    const pairDot = left[0] * right[0] + left[1] * right[1] + left[2] * right[2]
    assert(Math.abs(pairDot + 1 / 3) < 1e-12, '四个领域方向必须构成正四面体。')
  }
}

const axisSpans = [0, 1, 2].map((axis) => {
  const values = world.nodes.map((node) => node.position[axis])
  return Math.max(...values) - Math.min(...values)
})
assert(axisSpans[2] >= Math.max(axisSpans[0], axisSpans[1]) * 0.68, '公共全景应具有显著 Z 轴体积，不能退化为二维平面。')

const radiiByDepth = new Map<number, number[]>()
world.nodes.forEach((node) => {
  radiiByDepth.set(node.knowledgeDepth, [...(radiiByDepth.get(node.knowledgeDepth) ?? []), node.radius])
  assert(Math.abs(Math.hypot(...node.position) - node.radius) < 1e-6, `节点 ${node.node.id} 必须保持知识半径。`)
})
const meanRadiusByDepth = [...radiiByDepth.entries()]
  .map(([depth, radii]) => [depth, radii.reduce((sum, radius) => sum + radius, 0) / radii.length] as const)
  .sort(([left], [right]) => left - right)
for (let index = 1; index < meanRadiusByDepth.length; index += 1) {
  assert(meanRadiusByDepth[index][1] > meanRadiusByDepth[index - 1][1], '知识半径应随前置深度总体严格递增。')
}

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
  })
}

const temporaryMath = projectKnowledgeSpace('world', { domainFilter: 'mathematics', filterMode: 'temporary' })
const focusedMath = projectKnowledgeSpace('world', { domainFilter: 'mathematics', filterMode: 'focus' })
const focusedMathAgain = projectKnowledgeSpace('world', { domainFilter: 'mathematics', filterMode: 'focus' })
assert(temporaryMath.nodes.some((node) => !node.visible), '临时领域筛选应隐藏不匹配节点。')
temporaryMath.nodes.forEach((node, index) => {
  assert(node.position.every((value, axis) => value === world.nodes[index].position[axis]), '临时筛选不得重排公共球体。')
  if (!node.visible) assert(node.opacity === 0 && !node.interactive, '临时筛选隐藏节点必须退出显示与命中。')
})
assert(focusedMath.nodes.some((node) => node.visibility === 'prerequisite' || node.visibility === 'bridge'), '专业聚焦应保留必要前置或跨域桥梁。')
assert(focusedMath.nodes.some((node) => node.visibility === 'hidden'), '专业聚焦应隐藏无关节点。')
assert(focusedMath.nodes.some((node, index) => node.visible && node.position.some((value, axis) => Math.abs(value - world.nodes[index].position[axis]) > 0.1)), '专业聚焦应重新分配球面空间。')
focusedMath.nodes.forEach((node, index) => {
  assert(node.position.every((value, axis) => value === focusedMathAgain.nodes[index].position[axis]), '专业聚焦结果必须确定。')
  assert(Math.abs(node.radius - world.nodes[index].radius) < 1e-9, '专业聚焦不得改变知识深度半径。')
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
const delayedReveal = createSubspaceRevealRange(800, 360, 620)
assert(delayedReveal.startPx === 800 && delayedReveal.endPx === 1320, '高倍率首次触发子域时仍应保留连续展开区间。')
assert(
  RELATED_NODE_LODS.join(',') === 'card,title',
  '三维直接关系邻居的 LOD 不得退化为光点。',
)
assert(RELATED_NODE_MIN_OPACITY === 0.88, '三维直接关系邻居必须保持稳定的最低透明度。')

console.log(`3D knowledge sphere smoke test passed: ${validation.stats.nodes} nodes, ${validation.stats.edges} edges, ${validation.stats.crossDomainNodes} cross-domain nodes, ${validation.stats.crossDomainEdges} cross-domain edges, ${world.fields.filter((field) => field.kind === 'tag').length} tag fields, ${world.fields.reduce((sum, field) => sum + field.lobes.length, 0)} field lobes, spans ${axisSpans.map((value) => value.toFixed(1)).join('×')}, collision gap ${minimumCollisionGap.toFixed(3)}.`)
