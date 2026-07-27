import {
  Application,
  Container,
  Graphics,
  RendererType,
  Sprite,
  Text,
  Texture,
} from 'pixi.js'
import 'pixi.js/prepare'
import {
  domainById,
  type FieldTagId,
  type MathNode,
} from '../../data/mathMap'
import {
  sceneCatalog,
  type MapScene,
  type MapSceneId,
} from '../../features/map/sceneCatalog'
import type { GeneratedTagField } from '../../lib/tagLayout'
import type {
  PixiCameraTransform,
  PixiHitTestResult,
  PixiMapFrame,
  PixiMapRendererOptions,
  PixiNodeStatus,
  PixiSceneFrameState,
  PixiVisualState,
} from './types'

const CARD_BACKGROUND = 0xf7f2e8
const CARD_BORDER = 0x8d887d
const TEXT_PRIMARY = 0x2d2b27
const TEXT_SECONDARY = 0x716d64
const MONOCHROME = 0x777777
const MASTERED = 0x376b62
const AVAILABLE = 0xa76a2d
const LOCKED = 0x8f8d88
const EDGE_BASE = 0x6f6b62
const FIELD_RASTER_SCALE = 0.36
const FIELD_MAX_RASTER_EDGE = 2048

const EMPTY_SET: ReadonlySet<string> = new Set<string>()

const HIDDEN_FRAME: Required<PixiSceneFrameState> = {
  alpha: 0,
  markerAlpha: 0,
  cardAlpha: 0,
  interactive: false,
  x: 0,
  y: 0,
  scale: 1,
}

interface NormalizedVisualState {
  selectedSceneId: MapSceneId | null
  selectedNodeId: string | null
  hiddenNodeIds: ReadonlySet<string>
  silhouetteNodeIds: ReadonlySet<string>
  pathNodeIds: ReadonlySet<string>
  contextNodeIds: ReadonlySet<string>
  nextUnlockNodeIds: ReadonlySet<string>
  mutedNodeIds: ReadonlySet<string>
  nonInteractiveNodeIds: ReadonlySet<string>
  highlightedNodeIds: ReadonlySet<string>
  statuses: Readonly<Record<string, PixiNodeStatus>>
  activeDomains?: PixiVisualState['activeDomains']
  activeFieldTag: FieldTagId | null
}

interface NodeRuntime {
  node: MathNode
  marker: Graphics
  card: Container
  surface: Graphics
  monochromeWash: Graphics
  accent: Graphics
  detail: Container
  title: Text
  english: Text
  tags: Text
  selectionOutline: Graphics
  emphasisOutline: Graphics
  statusDot: Graphics
  nextBadge: Container
  hidden: boolean
  silhouette: boolean
  interactive: boolean
}

interface EdgeRuntime {
  sourceId: string
  targetId: string
  graphic: Graphics
}

interface FieldRuntime {
  definition: GeneratedTagField
  container: Container
  texture: Texture
}

interface SceneRuntime {
  scene: MapScene
  depth: number
  root: Container
  fieldLayer: Container
  baseEdges: Graphics
  edgeOverlayLayer: Container
  fogOverlay: Graphics
  markerLayer: Container
  cardLayer: Container
  nodes: Map<string, NodeRuntime>
  edges: EdgeRuntime[]
  fields: FieldRuntime[]
  frame: Required<PixiSceneFrameState>
  fogSignature: string
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback
}

function positiveOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback
}

function colorNumber(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16)
}

function sceneDepth(sceneId: MapSceneId): number {
  let depth = 0
  let current = sceneCatalog[sceneId]
  const visited = new Set<MapSceneId>()

  while (current.parentSceneId && !visited.has(current.id)) {
    visited.add(current.id)
    depth += 1
    current = sceneCatalog[current.parentSceneId]
  }

  return depth
}

function normalizeVisualState(state: PixiVisualState): NormalizedVisualState {
  return {
    selectedSceneId: state.selectedSceneId ?? null,
    selectedNodeId: state.selectedNodeId ?? null,
    hiddenNodeIds: state.hiddenNodeIds ?? EMPTY_SET,
    silhouetteNodeIds: state.silhouetteNodeIds ?? EMPTY_SET,
    pathNodeIds: state.pathNodeIds ?? EMPTY_SET,
    contextNodeIds: state.contextNodeIds ?? EMPTY_SET,
    nextUnlockNodeIds: state.nextUnlockNodeIds ?? EMPTY_SET,
    mutedNodeIds: state.mutedNodeIds ?? EMPTY_SET,
    nonInteractiveNodeIds: state.nonInteractiveNodeIds ?? EMPTY_SET,
    highlightedNodeIds: state.highlightedNodeIds ?? EMPTY_SET,
    statuses: state.statuses ?? {},
    activeDomains: state.activeDomains,
    activeFieldTag: state.activeFieldTag ?? null,
  }
}

interface RasterizedField {
  texture: Texture
  x: number
  y: number
  width: number
  height: number
}

function rasterizeField(scene: MapScene, field: GeneratedTagField): RasterizedField {
  const centers = field.members.flatMap((id) => {
    const position = scene.layout.positions[id]
    return position
      ? [{ x: position.x + scene.nodeWidth / 2, y: position.y + scene.nodeHeight / 2 }]
      : []
  })
  const points = [
    ...centers,
    ...field.links.flatMap((link) => [link.from, link.to]),
  ]
  const radius = 125 * scene.fieldScale
  const lineWidth = 145 * scene.fieldScale
  const blurRadius = 17 * scene.fieldScale
  const padding = Math.max(radius, lineWidth / 2) + blurRadius * 3

  const pointXs = points.length > 0 ? points.map((point) => point.x) : [scene.worldWidth / 2]
  const pointYs = points.length > 0 ? points.map((point) => point.y) : [scene.worldHeight / 2]
  const left = Math.max(0, Math.min(...pointXs) - padding)
  const top = Math.max(0, Math.min(...pointYs) - padding)
  const right = Math.min(scene.worldWidth, Math.max(...pointXs) + padding)
  const bottom = Math.min(scene.worldHeight, Math.max(...pointYs) + padding)
  const width = Math.max(1, right - left)
  const height = Math.max(1, bottom - top)
  const rasterScale = Math.min(
    FIELD_RASTER_SCALE,
    FIELD_MAX_RASTER_EDGE / width,
    FIELD_MAX_RASTER_EDGE / height,
  )
  const pixelWidth = Math.max(1, Math.ceil(width * rasterScale))
  const pixelHeight = Math.max(1, Math.ceil(height * rasterScale))
  const maskCanvas = document.createElement('canvas')
  const fieldCanvas = document.createElement('canvas')
  maskCanvas.width = fieldCanvas.width = pixelWidth
  maskCanvas.height = fieldCanvas.height = pixelHeight
  const mask = maskCanvas.getContext('2d', { alpha: true })
  const output = fieldCanvas.getContext('2d', { alpha: true })
  if (!mask || !output) throw new Error('Pixi 地图无法创建标签场域纹理。')

  mask.save()
  mask.scale(rasterScale, rasterScale)
  mask.translate(-left, -top)
  mask.strokeStyle = '#ffffff'
  mask.fillStyle = '#ffffff'
  mask.lineWidth = lineWidth
  mask.lineCap = 'round'
  mask.lineJoin = 'round'
  for (const link of field.links) {
    mask.beginPath()
    mask.moveTo(link.from.x, link.from.y)
    mask.lineTo(link.to.x, link.to.y)
    mask.stroke()
  }
  for (const center of centers) {
    mask.beginPath()
    mask.arc(center.x, center.y, radius, 0, Math.PI * 2)
    mask.fill()
  }
  mask.restore()

  output.save()
  output.filter = `blur(${blurRadius * rasterScale}px)`
  output.drawImage(maskCanvas, 0, 0)
  output.restore()
  output.globalCompositeOperation = 'source-in'
  output.fillStyle = field.color
  output.fillRect(0, 0, pixelWidth, pixelHeight)
  output.globalCompositeOperation = 'source-over'

  return {
    texture: Texture.from(fieldCanvas),
    x: left,
    y: top,
    width,
    height,
  }
}

function drawCardEdgePath(
  graphics: Graphics,
  scene: MapScene,
  sourceNode: MathNode,
  targetNode: MathNode,
): void {
  const source = scene.layout.positions[sourceNode.id]
  const target = scene.layout.positions[targetNode.id]
  if (!source || !target) return

  if (scene.layoutStrategy === 'progression') {
    const sourceX = source.x + scene.nodeWidth
    const sourceY = source.y + scene.nodeHeight / 2
    const targetX = target.x
    const targetY = target.y + scene.nodeHeight / 2
    const curve = Math.max(70, Math.abs(targetX - sourceX) * 0.48)
    graphics
      .moveTo(sourceX, sourceY)
      .bezierCurveTo(sourceX + curve, sourceY, targetX - curve, targetY, targetX, targetY)
    return
  }

  const sourceCenter = {
    x: source.x + scene.nodeWidth / 2,
    y: source.y + scene.nodeHeight / 2,
  }
  const targetCenter = {
    x: target.x + scene.nodeWidth / 2,
    y: target.y + scene.nodeHeight / 2,
  }
  const direction = {
    x: targetCenter.x - sourceCenter.x,
    y: targetCenter.y - sourceCenter.y,
  }
  const sourceScale = 1 / Math.max(
    Math.abs(direction.x) / (scene.nodeWidth / 2),
    Math.abs(direction.y) / (scene.nodeHeight / 2),
  )
  const targetScale = 1 / Math.max(
    Math.abs(direction.x) / (scene.nodeWidth / 2),
    Math.abs(direction.y) / (scene.nodeHeight / 2),
  )
  const sourceEdge = {
    x: sourceCenter.x + direction.x * sourceScale,
    y: sourceCenter.y + direction.y * sourceScale,
  }
  const targetEdge = {
    x: targetCenter.x - direction.x * targetScale,
    y: targetCenter.y - direction.y * targetScale,
  }

  if (sourceNode.domain === targetNode.domain || sourceNode.domain === 'foundation') {
    graphics.moveTo(sourceEdge.x, sourceEdge.y).lineTo(targetEdge.x, targetEdge.y)
    return
  }

  const worldCenter = { x: scene.worldWidth / 2, y: scene.worldHeight / 2 }
  const sourceVector = {
    x: sourceCenter.x - worldCenter.x,
    y: sourceCenter.y - worldCenter.y,
  }
  const targetVector = {
    x: targetCenter.x - worldCenter.x,
    y: targetCenter.y - worldCenter.y,
  }
  const sourceRadius = Math.hypot(sourceVector.x, sourceVector.y)
  const targetRadius = Math.hypot(targetVector.x, targetVector.y)
  const sourceAngle = Math.atan2(sourceVector.y, sourceVector.x)
  const targetAngle = Math.atan2(targetVector.y, targetVector.x)
  const angleDelta = Math.atan2(
    Math.sin(targetAngle - sourceAngle),
    Math.cos(targetAngle - sourceAngle),
  )
  const controlAngle = sourceAngle + angleDelta / 2
  const controlRadius = Math.max(sourceRadius, targetRadius) + 320
  graphics
    .moveTo(sourceEdge.x, sourceEdge.y)
    .quadraticCurveTo(
      worldCenter.x + Math.cos(controlAngle) * controlRadius,
      worldCenter.y + Math.sin(controlAngle) * controlRadius,
      targetEdge.x,
      targetEdge.y,
    )
}

function statusColor(status: PixiNodeStatus | undefined, domainColor: number): number {
  if (status === 'mastered') return MASTERED
  if (status === 'locked') return LOCKED
  if (status === 'available') return AVAILABLE
  return domainColor
}

/**
 * Retained-mode PixiJS v8 renderer. Every scene, card, edge and field is built
 * once; frame updates only touch transforms, alpha and renderability.
 */
export class PixiMapRenderer {
  static async create(options: PixiMapRendererOptions): Promise<PixiMapRenderer> {
    const app = new Application()
    const resolution = options.resolution
      ?? Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 1.5)

    await app.init({
      width: Math.max(1, options.width),
      height: Math.max(1, options.height),
      resolution: positiveOr(resolution, 1),
      preference: 'webgl',
      powerPreference: 'high-performance',
      antialias: true,
      autoDensity: true,
      backgroundAlpha: clamp01(options.backgroundAlpha ?? 0),
      autoStart: false,
      sharedTicker: false,
    })

    if (options.signal?.aborted) {
      app.destroy({ removeView: true }, { children: true, context: true })
      throw new DOMException('PixiJS 地图初始化已取消。', 'AbortError')
    }

    if (app.renderer.type !== RendererType.WEBGL) {
      app.destroy({ removeView: true }, { children: true, context: true })
      throw new Error('知识地图需要 WebGL；当前环境未能创建 PixiJS WebGL 渲染器。')
    }

    const renderer = new PixiMapRenderer(app, options.host)
    const abortRenderer = () => renderer.destroy()
    options.signal?.addEventListener('abort', abortRenderer, { once: true })
    try {
      renderer.buildSceneCatalog()
      if (options.signal?.aborted) throw new DOMException('PixiJS 地图初始化已取消。', 'AbortError')
      options.host.appendChild(renderer.canvas)

      // Pre-rasterize Chinese text and upload all static graphics/textures before
      // the first LOD transition. The transition RAF never pays those costs.
      await app.renderer.prepare.upload(renderer.world)
      if (options.signal?.aborted) throw new DOMException('PixiJS 地图初始化已取消。', 'AbortError')
      renderer.applyFrame({ scenes: { root: {
        alpha: 1,
        markerAlpha: 1,
        cardAlpha: 1,
        interactive: true,
      } } })
      renderer.render()
      options.signal?.removeEventListener('abort', abortRenderer)
      return renderer
    } catch (error) {
      options.signal?.removeEventListener('abort', abortRenderer)
      renderer.destroy()
      throw error
    }
  }

  readonly canvas: HTMLCanvasElement

  private readonly app: Application
  private readonly host: HTMLElement
  private readonly world = new Container()
  private readonly sceneRuntimes = new Map<MapSceneId, SceneRuntime>()
  private visualState = normalizeVisualState({})
  private camera: PixiCameraTransform = { x: 0, y: 0, scale: 1 }
  private renderScheduled = false
  private destroyed = false

  private constructor(app: Application, host: HTMLElement) {
    this.app = app
    this.host = host
    this.canvas = app.canvas as HTMLCanvasElement
    this.canvas.style.display = 'block'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.touchAction = 'none'
    this.canvas.setAttribute('aria-hidden', 'true')

    this.world.eventMode = 'none'
    this.world.sortableChildren = true
    this.app.stage.eventMode = 'none'
    this.app.stage.addChild(this.world)
  }

  resize(width: number, height: number, resolution = this.app.renderer.resolution): void {
    this.assertAlive()
    this.app.renderer.resize(
      Math.max(1, finiteOr(width, 1)),
      Math.max(1, finiteOr(height, 1)),
      positiveOr(resolution, this.app.renderer.resolution),
    )
    this.scheduleRender()
  }

  setCamera(camera: PixiCameraTransform): void {
    this.assertAlive()
    this.camera = {
      x: finiteOr(camera.x, this.camera.x),
      y: finiteOr(camera.y, this.camera.y),
      scale: positiveOr(camera.scale, this.camera.scale),
    }
    this.world.position.set(this.camera.x, this.camera.y)
    this.world.scale.set(this.camera.scale)
    this.scheduleRender()
  }

  applyFrame(frame: PixiMapFrame): void {
    this.assertAlive()

    for (const [sceneId, runtime] of this.sceneRuntimes) {
      const input = frame.scenes[sceneId]
      const normalized: Required<PixiSceneFrameState> = input
        ? {
            alpha: clamp01(input.alpha),
            markerAlpha: clamp01(input.markerAlpha),
            cardAlpha: clamp01(input.cardAlpha),
            interactive: Boolean(input.interactive),
            x: finiteOr(input.x, 0),
            y: finiteOr(input.y, 0),
            scale: positiveOr(input.scale, 1),
          }
        : { ...HIDDEN_FRAME }

      runtime.frame = normalized
      runtime.root.position.set(normalized.x, normalized.y)
      runtime.root.scale.set(normalized.scale)
      runtime.root.alpha = normalized.alpha
      runtime.root.renderable = normalized.alpha > 0.0001
      runtime.markerLayer.alpha = normalized.markerAlpha
      runtime.cardLayer.alpha = normalized.cardAlpha
    }

    this.scheduleRender()
  }

  updateVisualState(state: PixiVisualState): void {
    this.assertAlive()
    this.visualState = normalizeVisualState(state)

    for (const runtime of this.sceneRuntimes.values()) {
      this.applySceneVisualState(runtime)
    }

    this.scheduleRender()
  }

  hitTest(viewportX: number, viewportY: number): PixiHitTestResult | null {
    this.assertAlive()
    if (!Number.isFinite(viewportX) || !Number.isFinite(viewportY)) return null

    const worldX = (viewportX - this.camera.x) / this.camera.scale
    const worldY = (viewportY - this.camera.y) / this.camera.scale
    const orderedScenes = [...this.sceneRuntimes.values()].sort((a, b) => b.depth - a.depth)

    for (const runtime of orderedScenes) {
      const frame = runtime.frame
      if (!frame.interactive || frame.alpha <= 0.02) continue
      if (Math.max(frame.cardAlpha, frame.markerAlpha) <= 0.02) continue

      const sceneX = (worldX - frame.x) / frame.scale
      const sceneY = (worldY - frame.y) / frame.scale
      for (let index = runtime.scene.nodes.length - 1; index >= 0; index -= 1) {
        const node = runtime.scene.nodes[index]
        const nodeRuntime = runtime.nodes.get(node.id)
        const position = runtime.scene.layout.positions[node.id]
        if (!nodeRuntime || !position || !nodeRuntime.interactive) continue

        const cardHit = frame.cardAlpha > 0.02
          && sceneX >= position.x
          && sceneX <= position.x + runtime.scene.nodeWidth
          && sceneY >= position.y
          && sceneY <= position.y + runtime.scene.nodeHeight
        const markerRadius = Math.max(14 * runtime.scene.cardScale, runtime.scene.nodeHeight * 0.12)
        const markerHit = frame.markerAlpha > 0.02
          && Math.hypot(
            sceneX - position.x - runtime.scene.nodeWidth / 2,
            sceneY - position.y - runtime.scene.nodeHeight / 2,
          ) <= markerRadius

        if (cardHit || markerHit) {
          return { sceneId: runtime.scene.id, nodeId: node.id, node }
        }
      }
    }

    return null
  }

  render(): void {
    this.assertAlive()
    this.renderScheduled = false
    this.app.render()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.renderScheduled = false
    for (const runtime of this.sceneRuntimes.values()) {
      for (const field of runtime.fields) field.texture.destroy(true)
    }
    this.app.destroy(
      { removeView: true },
      { children: true, texture: false, textureSource: false, context: true },
    )
    this.sceneRuntimes.clear()
    if (this.canvas.parentElement === this.host) this.canvas.remove()
  }

  private buildSceneCatalog(): void {
    const orderedScenes = Object.values(sceneCatalog).sort(
      (a, b) => sceneDepth(a.id) - sceneDepth(b.id),
    )

    for (const scene of orderedScenes) {
      const runtime = this.buildScene(scene)
      this.sceneRuntimes.set(scene.id, runtime)
      this.world.addChild(runtime.root)
    }

    this.world.sortChildren()
  }

  private buildScene(scene: MapScene): SceneRuntime {
    const depth = sceneDepth(scene.id)
    const root = new Container({ isRenderGroup: true })
    const fieldLayer = new Container()
    const baseEdges = new Graphics()
    const edgeOverlayLayer = new Container()
    const fogOverlay = new Graphics()
    const markerLayer = new Container()
    const cardLayer = new Container()

    root.label = `scene:${scene.id}`
    root.zIndex = depth
    root.eventMode = 'none'
    root.renderable = false
    fieldLayer.eventMode = 'none'
    edgeOverlayLayer.eventMode = 'none'
    fogOverlay.eventMode = 'none'
    fogOverlay.renderable = false
    markerLayer.eventMode = 'none'
    cardLayer.eventMode = 'none'
    root.addChild(fieldLayer, baseEdges, edgeOverlayLayer, fogOverlay, markerLayer, cardLayer)

    const fields = scene.layout.fields.map((field) =>
      this.buildField(scene, field, fieldLayer),
    )
    const edges: EdgeRuntime[] = []
    const edgeWidth = Math.max(1, scene.cardScale * 0.7)

    for (const targetNode of scene.nodes) {
      for (const sourceId of targetNode.prerequisites) {
        const sourceNode = scene.nodeIndex[sourceId]
        if (!sourceNode) continue

        drawCardEdgePath(baseEdges, scene, sourceNode, targetNode)
        const overlay = new Graphics()
        drawCardEdgePath(overlay, scene, sourceNode, targetNode)
        overlay.stroke({ color: 0xffffff, width: edgeWidth, alpha: 1 })
        overlay.alpha = 0
        overlay.renderable = false
        overlay.eventMode = 'none'
        edgeOverlayLayer.addChild(overlay)
        edges.push({ sourceId, targetId: targetNode.id, graphic: overlay })
      }
    }
    baseEdges.stroke({ color: EDGE_BASE, width: edgeWidth, alpha: 0.18 })
    baseEdges.eventMode = 'none'

    const nodes = new Map<string, NodeRuntime>()
    scene.nodes.forEach((node, index) => {
      const nodeRuntime = this.buildNode(scene, node, index)
      nodes.set(node.id, nodeRuntime)
      markerLayer.addChild(nodeRuntime.marker)
      cardLayer.addChild(nodeRuntime.card)
    })

    const runtime: SceneRuntime = {
      scene,
      depth,
      root,
      fieldLayer,
      baseEdges,
      edgeOverlayLayer,
      fogOverlay,
      markerLayer,
      cardLayer,
      nodes,
      edges,
      fields,
      frame: { ...HIDDEN_FRAME },
      fogSignature: '',
    }
    this.applySceneVisualState(runtime)
    return runtime
  }

  private buildField(
    scene: MapScene,
    definition: GeneratedTagField,
    fieldLayer: Container,
  ): FieldRuntime {
    const container = new Container()
    const tint = colorNumber(definition.color)
    const rasterized = rasterizeField(scene, definition)
    const fieldSprite = new Sprite(rasterized.texture)
    container.eventMode = 'none'
    fieldSprite.position.set(rasterized.x, rasterized.y)
    fieldSprite.width = rasterized.width
    fieldSprite.height = rasterized.height
    fieldSprite.blendMode = 'normal'
    fieldSprite.eventMode = 'none'

    const label = new Text({
      text: `#${definition.id}`,
      style: {
        fontFamily: 'Inter, "Microsoft YaHei", sans-serif',
        fontSize: Math.max(14, 17 * scene.fieldScale),
        fontWeight: '600',
        fill: tint,
        align: 'center',
      },
      resolution: 2,
    })
    label.anchor.set(0.5)
    label.position.set(definition.center.x, definition.center.y)
    label.alpha = 0.42
    label.eventMode = 'none'
    container.addChild(fieldSprite, label)
    container.alpha = 0.105
    fieldLayer.addChild(container)
    return { definition, container, texture: rasterized.texture }
  }

  private buildNode(scene: MapScene, node: MathNode, index: number): NodeRuntime {
    const position = scene.layout.positions[node.id]
    if (!position) throw new Error(`场景“${scene.id}”缺少节点“${node.id}”的位置。`)

    const cardWidth = scene.nodeWidth / scene.cardScale
    const cardHeight = scene.nodeHeight / scene.cardScale
    const domainColor = colorNumber(domainById[node.domain].color)
    const radius = 7

    const marker = new Graphics()
      .circle(0, 0, radius * scene.cardScale)
      .fill({ color: domainColor, alpha: 0.76 })
      .circle(0, 0, (radius + 4) * scene.cardScale)
      .stroke({ color: domainColor, width: Math.max(1, scene.cardScale), alpha: 0.42 })
    marker.position.set(position.x + scene.nodeWidth / 2, position.y + scene.nodeHeight / 2)
    marker.eventMode = 'none'

    const card = new Container()
    card.position.set(position.x, position.y)
    card.scale.set(scene.cardScale)
    card.eventMode = 'none'

    const surface = new Graphics()
      .roundRect(0, 0, cardWidth, cardHeight, 2)
      .fill({ color: CARD_BACKGROUND, alpha: 0.96 })
      .stroke({ color: CARD_BORDER, width: 0.8, alpha: 0.64 })
    const monochromeWash = new Graphics()
      .roundRect(0, 0, cardWidth, cardHeight, 2)
      .fill({ color: 0xe0e0de, alpha: 0.94 })
    monochromeWash.alpha = 0
    const accent = new Graphics()
      .rect(4, 7, 2, cardHeight - 14)
      .fill({ color: domainColor, alpha: 0.82 })

    const detail = new Container()
    const indexText = new Text({
      text: String(index + 1).padStart(2, '0'),
      style: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 8,
        fontStyle: 'italic',
        fill: domainColor,
      },
      resolution: 2,
    })
    indexText.position.set(10, cardHeight / 2 - 5)

    const title = new Text({
      text: node.title,
      style: {
        fontFamily: '"Noto Serif SC", "Songti SC", SimSun, serif',
        fontSize: node.title.length > 8 ? 14 : 16,
        fontWeight: '600',
        fill: TEXT_PRIMARY,
      },
      resolution: 2,
    })
    title.position.set(40, 19)

    const english = new Text({
      text: node.english,
      style: {
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: 8,
        fill: TEXT_SECONDARY,
      },
      resolution: 2,
    })
    english.position.set(40, 40)

    const tags = new Text({
      text: node.fieldTags.slice(0, 2).map((tag) => `#${tag}`).join('  '),
      style: {
        fontFamily: 'Inter, "Microsoft YaHei", sans-serif',
        fontSize: 7,
        fill: domainColor,
      },
      resolution: 2,
    })
    tags.position.set(40, 59)

    const statusDot = new Graphics()
      .circle(0, 0, 5)
      .fill({ color: 0xffffff, alpha: 1 })
      .circle(0, 0, 10)
      .stroke({ color: 0xffffff, width: 1, alpha: 0.88 })
    statusDot.position.set(cardWidth - 17, cardHeight / 2)
    statusDot.tint = domainColor

    const selectionOutline = new Graphics()
      .roundRect(-1.5, -1.5, cardWidth + 3, cardHeight + 3, 3)
      .stroke({ color: domainColor, width: 2, alpha: 1 })
    selectionOutline.alpha = 0
    const emphasisOutline = new Graphics()
      .roundRect(-0.7, -0.7, cardWidth + 1.4, cardHeight + 1.4, 2.5)
      .stroke({ color: 0xffffff, width: 1.2, alpha: 1 })
    emphasisOutline.alpha = 0

    const nextBadge = new Container()
    const nextBadgeBackground = new Graphics()
      .roundRect(0, 0, 42, 14, 7)
      .fill({ color: 0xf4f4f2, alpha: 1 })
      .stroke({ color: MONOCHROME, width: 0.8, alpha: 0.9 })
    const nextBadgeText = new Text({
      text: '下一批',
      style: {
        fontFamily: 'Inter, "Microsoft YaHei", sans-serif',
        fontSize: 7,
        fontWeight: '600',
        fill: MONOCHROME,
      },
      resolution: 2,
    })
    nextBadgeText.anchor.set(0.5)
    nextBadgeText.position.set(21, 7)
    nextBadge.addChild(nextBadgeBackground, nextBadgeText)
    nextBadge.position.set(cardWidth - 47, -9)
    nextBadge.alpha = 0

    detail.addChild(indexText, title, english, tags, statusDot)
    card.addChild(
      surface,
      monochromeWash,
      accent,
      detail,
      emphasisOutline,
      selectionOutline,
      nextBadge,
    )

    return {
      node,
      marker,
      card,
      surface,
      monochromeWash,
      accent,
      detail,
      title,
      english,
      tags,
      selectionOutline,
      emphasisOutline,
      statusDot,
      nextBadge,
      hidden: false,
      silhouette: false,
      interactive: true,
    }
  }

  private applySceneVisualState(runtime: SceneRuntime): void {
    const state = this.visualState
    const hasVisibilityMask = runtime.scene.nodes.some((node) =>
      state.hiddenNodeIds.has(node.id) || state.silhouetteNodeIds.has(node.id),
    )
    const hasEdgeFocus = state.pathNodeIds.size > 0
      || state.contextNodeIds.size > 0
      || state.nextUnlockNodeIds.size > 0
      || state.mutedNodeIds.size > 0
      || state.selectedNodeId !== null
    const hasNodeFilter = state.activeDomains !== undefined || state.activeFieldTag !== null

    for (const nodeRuntime of runtime.nodes.values()) {
      this.applyNodeVisualState(runtime.scene.id, nodeRuntime)
    }

    this.applyFogVisualState(runtime)

    runtime.baseEdges.alpha = hasVisibilityMask || hasEdgeFocus || hasNodeFilter ? 0 : 1
    runtime.baseEdges.renderable = runtime.baseEdges.alpha > 0
    for (const edge of runtime.edges) {
      if (runtime.baseEdges.renderable) {
        edge.graphic.alpha = 0
        edge.graphic.renderable = false
      } else {
        this.applyEdgeVisualState(runtime, edge)
      }
    }

    for (const fieldRuntime of runtime.fields) {
      const field = fieldRuntime.definition
      // A partially hidden field would disclose fogged node positions through
      // its connecting haze, so reveal a field only when all of its members are known.
      const fullyRevealed = field.members.every((id) =>
        !state.hiddenNodeIds.has(id) && !state.silhouetteNodeIds.has(id),
      )
      const hasVisibleDomain = field.members.some((id) => {
        const node = runtime.scene.nodeIndex[id]
        return node && (!state.activeDomains || state.activeDomains.has(node.domain))
      })
      const selected = state.activeFieldTag === field.id
      const passesTagFilter = state.activeFieldTag === null || selected
      fieldRuntime.container.renderable = fullyRevealed && hasVisibleDomain && passesTagFilter
      fieldRuntime.container.alpha = selected ? 0.3 : 0.105
    }
  }

  private applyNodeVisualState(sceneId: MapSceneId, runtime: NodeRuntime): void {
    const state = this.visualState
    const nodeId = runtime.node.id
    const domainColor = colorNumber(domainById[runtime.node.domain].color)
    const selected = state.selectedNodeId === nodeId
      && (!state.selectedSceneId || state.selectedSceneId === sceneId)
    const hidden = state.hiddenNodeIds.has(nodeId)
    const silhouette = !hidden && state.silhouetteNodeIds.has(nodeId)
    const tagFiltered = Boolean(
      state.activeFieldTag && !runtime.node.fieldTags.includes(state.activeFieldTag),
    )
    const path = state.pathNodeIds.has(nodeId)
    const context = state.contextNodeIds.has(nodeId)
    const nextUnlock = state.nextUnlockNodeIds.has(nodeId)
    const muted = state.mutedNodeIds.has(nodeId)
      || Boolean(state.activeDomains && !state.activeDomains.has(runtime.node.domain))
    const highlighted = state.highlightedNodeIds.has(nodeId)

    runtime.hidden = hidden
    runtime.silhouette = silhouette
    runtime.interactive = !hidden
      && !tagFiltered
      && !state.nonInteractiveNodeIds.has(nodeId)
    runtime.card.renderable = !hidden && !tagFiltered
    runtime.marker.renderable = !hidden && !tagFiltered
    if (hidden || tagFiltered) return

    let alpha = 1
    if (silhouette) alpha = 0.32
    else if (muted) alpha = 0.07
    else if (context && !selected && !path && !nextUnlock) alpha = 0.52

    runtime.card.alpha = alpha
    runtime.marker.alpha = silhouette ? 0.26 : alpha
    runtime.marker.tint = silhouette || nextUnlock ? MONOCHROME : 0xffffff
    runtime.detail.alpha = silhouette ? 0 : 1
    runtime.monochromeWash.alpha = silhouette || nextUnlock ? 1 : 0
    runtime.accent.tint = silhouette || nextUnlock ? MONOCHROME : 0xffffff
    runtime.title.tint = nextUnlock ? MONOCHROME : 0xffffff
    runtime.english.tint = nextUnlock ? MONOCHROME : 0xffffff
    runtime.tags.tint = nextUnlock ? MONOCHROME : 0xffffff
    runtime.selectionOutline.alpha = selected && !silhouette && !muted ? 1 : 0
    runtime.emphasisOutline.tint = nextUnlock ? MONOCHROME : domainColor
    runtime.emphasisOutline.alpha = !silhouette && !muted && (highlighted || path || nextUnlock) ? 1 : 0
    runtime.nextBadge.alpha = nextUnlock && !silhouette && !muted ? 1 : 0
    runtime.statusDot.tint = statusColor(state.statuses[nodeId], nextUnlock ? MONOCHROME : domainColor)
  }

  private applyFogVisualState(runtime: SceneRuntime): void {
    const state = this.visualState
    const hasFoggedNode = runtime.scene.nodes.some((node) =>
      state.hiddenNodeIds.has(node.id) || state.silhouetteNodeIds.has(node.id),
    )
    if (!hasFoggedNode) {
      runtime.fogOverlay.renderable = false
      runtime.fogSignature = ''
      return
    }

    const revealedIds = runtime.scene.nodes
      .filter((node) => !state.hiddenNodeIds.has(node.id) && !state.silhouetteNodeIds.has(node.id))
      .map((node) => node.id)
    const signature = revealedIds.join('|')
    runtime.fogOverlay.renderable = true
    if (signature === runtime.fogSignature) return

    runtime.fogSignature = signature
    const fog = runtime.fogOverlay
    const padding = Math.max(runtime.scene.nodeGap * 0.7, runtime.scene.nodeHeight * 0.18)
    fog.clear()
      .rect(0, 0, runtime.scene.worldWidth, runtime.scene.worldHeight)
      .fill({ color: 0xe7e1d5, alpha: 0.72 })

    for (const nodeId of revealedIds) {
      const position = runtime.scene.layout.positions[nodeId]
      if (!position) continue
      const left = Math.max(0.5, position.x - padding)
      const top = Math.max(0.5, position.y - padding)
      const right = Math.min(
        runtime.scene.worldWidth - 0.5,
        position.x + runtime.scene.nodeWidth + padding,
      )
      const bottom = Math.min(
        runtime.scene.worldHeight - 0.5,
        position.y + runtime.scene.nodeHeight + padding,
      )
      fog
        .roundRect(
          left,
          top,
          right - left,
          bottom - top,
          Math.max(8, runtime.scene.nodeHeight * 0.22),
        )
        .cut()
    }
  }

  private applyEdgeVisualState(runtime: SceneRuntime, edge: EdgeRuntime): void {
    const state = this.visualState
    const sourceHidden = state.hiddenNodeIds.has(edge.sourceId)
      || state.silhouetteNodeIds.has(edge.sourceId)
    const targetHidden = state.hiddenNodeIds.has(edge.targetId)
      || state.silhouetteNodeIds.has(edge.targetId)
    if (sourceHidden || targetHidden) {
      edge.graphic.alpha = 0
      edge.graphic.renderable = false
      return
    }

    const selectedAppliesToScene = !state.selectedSceneId || state.selectedSceneId === runtime.scene.id
    const sourcePath = state.pathNodeIds.has(edge.sourceId)
      || (selectedAppliesToScene && state.selectedNodeId === edge.sourceId)
    const targetPath = state.pathNodeIds.has(edge.targetId)
      || (selectedAppliesToScene && state.selectedNodeId === edge.targetId)
    const sourceContext = state.contextNodeIds.has(edge.sourceId)
    const targetContext = state.contextNodeIds.has(edge.targetId)
    const targetNext = state.nextUnlockNodeIds.has(edge.targetId)
    const sourceNode = runtime.scene.nodeIndex[edge.sourceId]
    const targetNode = runtime.scene.nodeIndex[edge.targetId]
    const tagFiltered = state.activeFieldTag !== null && (
      !sourceNode.fieldTags.includes(state.activeFieldTag)
      || !targetNode.fieldTags.includes(state.activeFieldTag)
    )
    if (tagFiltered) {
      edge.graphic.alpha = 0
      edge.graphic.renderable = false
      return
    }
    const sourceMuted = state.mutedNodeIds.has(edge.sourceId)
      || Boolean(state.activeDomains && !state.activeDomains.has(sourceNode.domain))
    const targetMuted = state.mutedNodeIds.has(edge.targetId)
      || Boolean(state.activeDomains && !state.activeDomains.has(targetNode.domain))

    let alpha = 0.14
    let tint = EDGE_BASE
    if (sourceMuted || targetMuted) {
      alpha = 0.025
    } else if (sourcePath && targetPath) {
      alpha = 0.82
      tint = colorNumber(domainById[runtime.scene.nodeIndex[edge.targetId].domain].color)
    } else if (targetNext && (sourcePath || sourceContext)) {
      alpha = 0.72
      tint = MONOCHROME
    } else if (sourceContext && targetContext) {
      alpha = 0.38
    }

    edge.graphic.tint = tint
    edge.graphic.alpha = alpha
    edge.graphic.renderable = alpha > 0.001
  }

  private scheduleRender(): void {
    if (this.destroyed || this.renderScheduled) return
    this.renderScheduled = true
    queueMicrotask(() => {
      if (this.destroyed || !this.renderScheduled) return
      this.renderScheduled = false
      this.app.render()
    })
  }

  private assertAlive(): void {
    if (this.destroyed) throw new Error('PixiMapRenderer 已销毁。')
  }
}
