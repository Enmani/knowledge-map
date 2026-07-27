import {
  calculusEmbedding,
  composeEmbeddedCamera,
  decomposeEmbeddedCamera,
  getChildScenes,
  knowledgeAtlas,
  knowledgeAtlasValidation,
  sceneEmbeddings,
  sceneCatalog,
  smoothstep,
  validateMapScene,
} from '../features/map'
import {
  advanceSemanticLod,
  DEFAULT_LOD_POLICY,
  INITIAL_SEMANTIC_LOD_STATE,
  resolveRevealProgress,
  resolveRevealScope,
} from './lod/semanticLod'
import { getFogVisibility } from './progression/fogVisibility'
import { createProgressStore } from './progression/progressStore'
import { parseProgress, serializeProgress } from '../persistence/progressStorage'
import { createWheelZoomGesture, createZoomTarget, dampWheelZoom } from '../features/map/wheelZoom'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(knowledgeAtlasValidation.valid, '知识图谱校验未通过。')

for (const scene of Object.values(sceneCatalog)) {
  assert(validateMapScene(scene).valid, `场景 ${scene.id} 校验未通过。`)
  const uniqueX = new Set(scene.nodes.map((node) => scene.layout.positions[node.id].x.toFixed(3)))
  const uniqueY = new Set(scene.nodes.map((node) => scene.layout.positions[node.id].y.toFixed(3)))
  for (let leftIndex = 0; leftIndex < scene.nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < scene.nodes.length; rightIndex += 1) {
      const left = scene.layout.positions[scene.nodes[leftIndex].id]
      const right = scene.layout.positions[scene.nodes[rightIndex].id]
      const separated =
        left.x + scene.nodeWidth + scene.nodeGap <= right.x ||
        right.x + scene.nodeWidth + scene.nodeGap <= left.x ||
        left.y + scene.nodeHeight + scene.nodeGap <= right.y ||
        right.y + scene.nodeHeight + scene.nodeGap <= left.y
      assert(separated, `场景 ${scene.id} 中的节点间距不足。`)
    }
  }
  if (scene.layoutStrategy === 'progression') {
    assert(
      uniqueX.size >= Math.min(scene.nodes.length, 2) && uniqueY.size >= Math.min(scene.nodes.length, 2),
      `推进式场景 ${scene.id} 应同时保留知识阶段与分支层次。`,
    )
    for (const target of scene.nodes) {
      for (const prerequisiteId of target.prerequisites) {
        const source = scene.layout.positions[prerequisiteId]
        const destination = scene.layout.positions[target.id]
        assert(
          source.x + scene.nodeWidth + scene.nodeGap <= destination.x,
          `场景 ${scene.id} 的前置关系 ${prerequisiteId} → ${target.id} 没有保持从左向右推进。`,
        )
      }
    }
  } else if (scene.layoutStrategy === 'radial-clusters') {
    const organicAxisMinimum = Math.min(scene.nodes.length, 4)
    assert(
      uniqueX.size >= organicAxisMinimum && uniqueY.size >= organicAxisMinimum,
      `径向场景 ${scene.id} 的节点布局退化成规则网格。`,
    )
    const center = { x: scene.worldWidth / 2, y: scene.worldHeight / 2 }
    const radiusOf = (nodeId: string) => {
      const position = scene.layout.positions[nodeId]
      return Math.hypot(
        position.x + scene.nodeWidth / 2 - center.x,
        position.y + scene.nodeHeight / 2 - center.y,
      )
    }
    for (const target of scene.nodes) {
      for (const prerequisiteId of target.prerequisites) {
        const prerequisite = scene.nodeIndex[prerequisiteId]
        if (target.domain === 'foundation' || prerequisite.domain !== target.domain) continue
        assert(
          radiusOf(target.id) > radiusOf(prerequisiteId),
          `场景 ${scene.id} 的领域内前置关系 ${prerequisiteId} → ${target.id} 没有向簇外推进。`,
        )
      }
    }
    for (const node of scene.nodes.filter((candidate) => candidate.domain === 'foundation')) {
      assert(radiusOf(node.id) <= 240.01, `基础节点 ${node.id} 应位于主图中心核。`)
    }
    for (const node of scene.nodes.filter((candidate) => candidate.domain !== 'foundation')) {
      assert(radiusOf(node.id) <= 1240, `领域节点 ${node.id} 超出紧凑分支簇范围：${radiusOf(node.id).toFixed(2)}。`)
    }
  }
}

assert(sceneCatalog.root.layoutStrategy === 'radial-clusters', '数学全景应使用中心向外发散的领域簇布局。')
assert(sceneCatalog.root.nodeGap === 24, '数学全景节点应保留 24 个世界单位的安全间距。')
assert(sceneCatalog.root.initialNodeId === 'numbers', '数学全景应从中心基础节点开始。')
assert(sceneCatalog.root.nodes.length === 46, '数学全景应包含补充后的 46 个主节点。')
for (const nodeId of [
  'category-theory',
  'theory-of-computation',
  'dynamical-systems',
  'game-theory',
  'algebraic-geometry',
  'measure-theory',
  'fourier-analysis',
  'calculus-of-variations',
]) {
  assert(Boolean(sceneCatalog.root.nodeIndex[nodeId]), `数学全景缺少桥接节点 ${nodeId}。`)
}
const childSceneExpectations = new Map([
  ['calculus', 'calculus-limit'],
  ['precalculus', 'trigonometry'],
  ['multivariable', 'vector-calculus'],
  ['calculus-multivariable', 'vector-calculus'],
  ['dynamical-systems', 'chaos-theory'],
  ['topology', 'fractal-geometry'],
  ['discrete-math', 'order-theory'],
  ['differential-equations', 'fluid-dynamics'],
  ['stochastic', 'financial-mathematics'],
  ['real-analysis', 'real-uniform-convergence'],
  ['complex-analysis', 'complex-cauchy-theory'],
  ['functional-analysis', 'functional-spectral-theory'],
  ['measure-theory', 'measure-lebesgue-integration'],
  ['fourier-analysis', 'fourier-transform'],
  ['calculus-of-variations', 'euler-lagrange-equations'],
  ['numerical-analysis', 'numerical-linear-algebra'],
])
assert(getChildScenes('root').length === 15, '数学全景应公开 15 个可连续钻取的子空间。')
assert(getChildScenes('calculus').length === 1, '微积分子空间中的多元微积分应继续公开向量微积分子空间。')
for (const [sceneId, nodeId] of childSceneExpectations) {
  const scene = sceneCatalog[sceneId as keyof typeof sceneCatalog]
  assert(scene.layoutStrategy === 'progression', `子场景 ${sceneId} 应使用依赖推进布局。`)
  assert(Boolean(scene.nodeIndex[nodeId]), `子场景 ${sceneId} 缺少节点 ${nodeId}。`)
  assert(scene.cardScale === 6, `子场景 ${sceneId} 应保持六倍卡片视觉尺寸。`)
  assert(sceneEmbeddings.has(scene.id), `子场景 ${sceneId} 缺少连续缩放嵌入。`)
}
for (const [sceneId, expectedCount] of Object.entries({
  'real-analysis': 6,
  'complex-analysis': 6,
  'functional-analysis': 5,
  'measure-theory': 7,
  'fourier-analysis': 5,
  'calculus-of-variations': 5,
  'numerical-analysis': 6,
  'differential-equations': 6,
  topology: 6,
  'dynamical-systems': 6,
})) {
  assert(
    sceneCatalog[sceneId as keyof typeof sceneCatalog].nodes.length === expectedCount,
    `分析专题子场景 ${sceneId} 的节点数量应为 ${expectedCount}。`,
  )
}
const complexDynamicsPlacements = knowledgeAtlas.placements.filter((placement) => placement.conceptId === 'complex-dynamics')
assert(complexDynamicsPlacements.length === 2, '复动力系统应在复分析与动力系统中各有一个共享投影。')
assert(
  complexDynamicsPlacements.some((placement) => placement.role === 'canonical') &&
    complexDynamicsPlacements.some((placement) => placement.role === 'alias'),
  '复动力系统的两个投影应共享一个规范概念。',
)
for (const prerequisiteId of ['complex-analytic-functions', 'chaos-theory']) {
  assert(
    knowledgeAtlas.relations.some((relation) => (
      relation.type === 'required' && relation.from === prerequisiteId && relation.to === 'complex-dynamics'
    )),
    `复动力系统缺少跨子域前置 ${prerequisiteId}。`,
  )
}
const exploration = createProgressStore('exploration', [{ conceptId: 'numbers', level: 'mastered' }])
assert(getFogVisibility(knowledgeAtlas, exploration, 'numbers').level === 'revealed', '已掌握节点应穿透迷雾。')

const serialized = serializeProgress(exploration)
const parsed = parseProgress(serialized, new Set(['numbers']))
assert(parsed.status === 'loaded', '进度数据应能完成版本化往返。')

const metrics = {
  widthPx: 190,
  heightPx: 190,
  viewportWidthPx: 240,
  viewportHeightPx: 240,
  centerDistancePx: 0,
}
const firstLod = advanceSemanticLod({ ...INITIAL_SEMANTIC_LOD_STATE }, { metrics, nowMs: 0, canEnter: true })
const secondLod = advanceSemanticLod(firstLod.state, { metrics, nowMs: 100, canEnter: true })
const thirdLod = advanceSemanticLod(secondLod.state, { metrics, nowMs: 260, canEnter: true })
assert(secondLod.state.level === 'children', '语义 LOD 应在停留后显示子节点层级。')
assert(thirdLod.enterRequested, '居中放大并停留后应请求进入子空间。')

const rootCamera = { x: -4172.5, y: -2638.25, scale: 3.4 }
const childCamera = composeEmbeddedCamera(rootCamera, calculusEmbedding)
const restoredRootCamera = decomposeEmbeddedCamera(childCamera, calculusEmbedding)
assert(Math.abs(restoredRootCamera.x - rootCamera.x) < 1e-9, '父子相机横向正反变换应保持一致。')
assert(Math.abs(restoredRootCamera.y - rootCamera.y) < 1e-9, '父子相机纵向正反变换应保持一致。')
assert(Math.abs(restoredRootCamera.scale - rootCamera.scale) < 1e-12, '父子相机缩放正反变换应保持一致。')

const childPoint = { x: 1040, y: 620 }
const rootScreenPoint = {
  x: rootCamera.x + rootCamera.scale * (calculusEmbedding.offsetX + childPoint.x * calculusEmbedding.scale),
  y: rootCamera.y + rootCamera.scale * (calculusEmbedding.offsetY + childPoint.y * calculusEmbedding.scale),
}
const childScreenPoint = {
  x: childCamera.x + childCamera.scale * childPoint.x,
  y: childCamera.y + childCamera.scale * childPoint.y,
}
assert(Math.hypot(rootScreenPoint.x - childScreenPoint.x, rootScreenPoint.y - childScreenPoint.y) < 0.5, '导航换根前后的子节点屏幕坐标应保持连续。')

assert(DEFAULT_LOD_POLICY.revealStartScale === 1.8, '内部节点应从画布缩放 180% 开始显现。')
assert(DEFAULT_LOD_POLICY.scopeEnterOpacity === 0.8, '子层透明度应在 80% 以上进入子作用域。')
assert(DEFAULT_LOD_POLICY.scopeExitOpacity === 0.2, '子层透明度应在 20% 以下返回父作用域。')
assert(resolveRevealScope('parent', 0.8) === 'parent', '进入阈值本身应保留父作用域。')
assert(resolveRevealScope('parent', 0.81) === 'child', '超过进入阈值应切换到子作用域。')
assert(resolveRevealScope('child', 0.2) === 'child', '退出阈值本身应保留子作用域。')
assert(resolveRevealScope('child', 0.19) === 'parent', '低于退出阈值应切换到父作用域。')
assert(resolveRevealScope('parent', 0.5) === 'parent' && resolveRevealScope('child', 0.5) === 'child', '滞回区间应保留当前作用域。')
assert(resolveRevealProgress(0.9, 0, 'parent') === 0, '进入子域前，门户离开视口中心应隐藏子层。')
assert(resolveRevealProgress(0.9, 0, 'child') === 0.9, '进入子域后，画布平移不应改变子层透明度。')
assert(resolveRevealProgress(0.1, 1, 'child') === 0.1, '进入子域后，缩小仍应降低子层透明度并允许退出。')
assert(DEFAULT_LOD_POLICY.portalButtonZoomMultiplier === 2, '内部地图按钮应把默认钻取镜头放大两倍。')
assert(sceneCatalog.calculus.cardScale === 6, '微积分子卡片自身应使用六倍视觉尺寸。')
const revealSamples = [1.8, 2, 2.2, 2.4, 2.6]
  .map((scale) => smoothstep(DEFAULT_LOD_POLICY.revealStartScale, DEFAULT_LOD_POLICY.revealEndScale, scale))
assert(revealSamples[0] === 0 && revealSamples.at(-1) === 1, '内部节点显隐曲线应覆盖完整透明度范围。')
assert(revealSamples.every((value, index) => index === 0 || value >= revealSamples[index - 1]), '内部节点显隐曲线应随放大单调增加。')

const wheelStart = { x: 18, y: -26, scale: 1.4 }
const wheelPoint = { x: 620, y: 410 }
const wheelTarget = createZoomTarget(wheelStart, 1.8, wheelPoint.x, wheelPoint.y)
const wheelWorldBefore = {
  x: (wheelPoint.x - wheelStart.x) / wheelStart.scale,
  y: (wheelPoint.y - wheelStart.y) / wheelStart.scale,
}
const wheelWorldAfter = {
  x: (wheelPoint.x - wheelTarget.x) / wheelTarget.scale,
  y: (wheelPoint.y - wheelTarget.y) / wheelTarget.scale,
}
assert(Math.hypot(wheelWorldBefore.x - wheelWorldAfter.x, wheelWorldBefore.y - wheelWorldAfter.y) < 1e-9, '平滑滚轮缩放应保持指针锚点。')
assert(createZoomTarget({ x: 0, y: 0, scale: 0.12 }, 0.1, 0, 0).scale === 0.1, '画布最小缩放应限制在 10%。')
const wheelGesture = createWheelZoomGesture(wheelStart, null, 1.8, wheelPoint.x, wheelPoint.y)
const dampedWheel = dampWheelZoom(wheelStart, wheelGesture, 16)
assert(dampedWheel.scale > wheelStart.scale && dampedWheel.scale < wheelGesture.scale, '滚轮相机应通过阻尼逐帧接近目标倍率。')
const dampedWheelWorld = {
  x: (wheelPoint.x - dampedWheel.x) / dampedWheel.scale,
  y: (wheelPoint.y - dampedWheel.y) / dampedWheel.scale,
}
assert(Math.hypot(dampedWheelWorld.x - wheelGesture.worldX, dampedWheelWorld.y - wheelGesture.worldY) < 1e-9, '滚轮阻尼的每一帧都应保持手势锚点。')
const continuedWheel = createWheelZoomGesture(dampedWheel, wheelGesture, 1.1, wheelPoint.x, wheelPoint.y)
assert(continuedWheel.worldX === wheelGesture.worldX && continuedWheel.worldY === wheelGesture.worldY, '连续滚轮输入应复用同一世界锚点。')

console.log('Engine smoke test passed: atlas, scene layout strategies, collision, fog, storage, LOD and camera continuity checked.')
