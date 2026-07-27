import {
  DEFAULT_LOD_POLICY,
  resolveRevealProgress,
  resolveRevealScope,
  type LodPolicy,
} from '../../engine/lod/semanticLod'
import {
  sceneCatalog as defaultSceneCatalog,
  type MapScene,
  type MapSceneId,
} from '../../features/map/sceneCatalog'
import {
  sceneEmbeddings as defaultSceneEmbeddings,
  smoothstep,
  type CameraTransform,
  type SceneEmbedding,
} from '../../features/map/sceneEmbedding'
import type {
  MapHitResult,
  MapHitTestOptions,
  MapPanelState,
  MapRenderFrame,
  MapRenderKernelOptions,
  MapRenderKernelState,
  MapRenderKernelUpdate,
  MapScopeEvent,
  MapScopeTransition,
  MapViewport,
  SceneFrameRole,
  SceneFrameState,
  SceneNodeHitArea,
  SceneNodeHitAreaResolver,
  SceneWorldTransform,
} from './types'

const DEFAULT_VIEWPORT: Readonly<MapViewport> = { width: 1, height: 1 }
const DEFAULT_PANEL: Readonly<MapPanelState> = { open: false, width: 390 }
const DEFAULT_CAMERA: Readonly<CameraTransform> = { x: 0, y: 0, scale: 1 }
const DEFAULT_PORTAL_FOCUS_RADIUS_RATIO = 0.34
const DEFAULT_PARENT_FADE_START = 0.18
const VISIBLE_ALPHA_EPSILON = 0.0001

interface RevealMeasurement {
  revealProgress: number
  portalFocus: number
  sizeProgress: number
}

interface ResolvedTransition {
  transition: MapScopeTransition
  parentScene: MapScene
  childScene: MapScene
}

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function finiteCoordinate(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function distanceFromPointToRect(
  pointX: number,
  pointY: number,
  rect: Readonly<{ left: number; top: number; right: number; bottom: number }>,
): number {
  const dx = Math.max(rect.left - pointX, 0, pointX - rect.right)
  const dy = Math.max(rect.top - pointY, 0, pointY - rect.bottom)
  return Math.hypot(dx, dy)
}

function defaultNodeHitAreas(scene: MapScene): readonly SceneNodeHitArea[] {
  return scene.nodes.map((node) => {
    const position = scene.layout.positions[node.id]
    return {
      node,
      x: position.x,
      y: position.y,
      width: scene.nodeWidth,
      height: scene.nodeHeight,
    }
  })
}

/**
 * Owns the continuously changing presentation state of the map.
 *
 * The kernel is deliberately independent of React and the concrete renderer.
 * Calling resolveFrame never mounts, removes, or mutates a scene resource; it
 * only describes how already-resident scene containers should be presented.
 */
export class MapRenderKernel {
  private readonly scenes: Readonly<Record<MapSceneId, MapScene>>
  private readonly sceneList: readonly MapScene[]
  private readonly embeddings: ReadonlyMap<MapSceneId, SceneEmbedding>
  private readonly outgoingEmbeddings = new Map<MapSceneId, readonly SceneEmbedding[]>()
  private readonly sceneTransforms = new Map<MapSceneId, SceneWorldTransform>()
  private readonly nodeHitAreas = new Map<MapSceneId, readonly SceneNodeHitArea[]>()
  private readonly lodPolicy: Readonly<LodPolicy>
  private readonly portalFocusRadiusRatio: number
  private readonly parentFadeStart: number
  private state: MapRenderKernelState
  private pendingScopeEventKey: string | null = null
  private lastFrame: MapRenderFrame | null = null

  constructor(options: MapRenderKernelOptions = {}) {
    this.scenes = options.scenes ?? defaultSceneCatalog
    this.sceneList = Object.values(this.scenes)
    this.embeddings = options.embeddings ?? defaultSceneEmbeddings
    this.lodPolicy = options.lodPolicy ?? DEFAULT_LOD_POLICY
    this.portalFocusRadiusRatio = clamp01(
      options.portalFocusRadiusRatio ?? DEFAULT_PORTAL_FOCUS_RADIUS_RATIO,
    )
    this.parentFadeStart = clamp01(options.parentFadeStart ?? DEFAULT_PARENT_FADE_START)

    const initial = options.initialState
    this.state = {
      camera: this.normalizeCamera(initial?.camera ?? DEFAULT_CAMERA),
      viewport: this.normalizeViewport(initial?.viewport ?? DEFAULT_VIEWPORT),
      panel: this.normalizePanel(initial?.panel ?? DEFAULT_PANEL),
      activeSceneId: initial?.activeSceneId ?? 'root',
      pinnedChildSceneId: initial?.pinnedChildSceneId ?? null,
    }
    this.assertSceneExists(this.state.activeSceneId)

    this.buildEmbeddingIndexes()
    this.buildSceneTransforms()
    this.buildHitAreaIndex(options.resolveNodeHitAreas ?? defaultNodeHitAreas)
  }

  getState(): Readonly<MapRenderKernelState> {
    return {
      ...this.state,
      camera: { ...this.state.camera },
      viewport: { ...this.state.viewport },
      panel: { ...this.state.panel },
    }
  }

  update(update: MapRenderKernelUpdate): void {
    if (update.camera) this.state.camera = this.normalizeCamera(update.camera)
    if (update.viewport) this.state.viewport = this.normalizeViewport(update.viewport)
    if (update.panel) this.state.panel = this.normalizePanel(update.panel)
    if (update.activeSceneId !== undefined) this.setActiveScene(update.activeSceneId)
    if (update.pinnedChildSceneId !== undefined) this.setPinnedChildScene(update.pinnedChildSceneId)
  }

  setCamera(camera: CameraTransform): void {
    this.state.camera = this.normalizeCamera(camera)
  }

  setViewport(viewport: MapViewport): void {
    this.state.viewport = this.normalizeViewport(viewport)
  }

  setPanel(panel: MapPanelState): void {
    this.state.panel = this.normalizePanel(panel)
  }

  setActiveScene(sceneId: MapSceneId): void {
    this.assertSceneExists(sceneId)
    if (this.state.activeSceneId === sceneId) return
    this.state.activeSceneId = sceneId
    this.pendingScopeEventKey = null
  }

  setPinnedChildScene(sceneId: MapSceneId | null): void {
    if (sceneId !== null) this.assertSceneExists(sceneId)
    this.state.pinnedChildSceneId = sceneId
  }

  /** Resolve a renderer-ready snapshot from the live camera state. */
  resolveFrame(): MapRenderFrame {
    const activeScene = this.scenes[this.state.activeSceneId]
    const resolvedTransition = this.resolveTransition(activeScene)
    const transition = resolvedTransition?.transition ?? null
    const scopeEvent = this.resolveScopeEvent(transition)
    const scenes = this.sceneList.map((scene) => this.resolveSceneFrame(scene, resolvedTransition))
    const renderOrder = this.resolveRenderOrder(resolvedTransition)
    const residentSceneIds = this.resolveResidentSceneIds(activeScene, resolvedTransition)

    const frame: MapRenderFrame = {
      camera: { ...this.state.camera },
      viewport: { ...this.state.viewport },
      activeSceneId: this.state.activeSceneId,
      transition,
      scopeEvent,
      scenes,
      renderOrder,
      residentSceneIds,
    }
    this.lastFrame = frame
    return frame
  }

  /**
   * Hit-test topmost interactive scene nodes using the same frame that was
   * rendered. A caller may additionally reject fogged or locked nodes.
   */
  hitTest(
    screenPoint: Readonly<{ x: number; y: number }>,
    frame: MapRenderFrame = this.lastFrame ?? this.resolveFrame(),
    options: MapHitTestOptions = {},
  ): MapHitResult | null {
    const camera = frame.camera
    const rootPoint = {
      x: (screenPoint.x - camera.x) / camera.scale,
      y: (screenPoint.y - camera.y) / camera.scale,
    }
    const frameByScene = new Map(frame.scenes.map((scene) => [scene.sceneId, scene]))

    for (const sceneId of [...frame.renderOrder].reverse()) {
      const sceneFrame = frameByScene.get(sceneId)
      if (!sceneFrame?.interactive || sceneFrame.alpha <= VISIBLE_ALPHA_EPSILON) continue
      const scene = this.scenes[sceneId]
      const transform = sceneFrame.worldTransform
      const scenePoint = {
        x: (rootPoint.x - transform.x) / transform.scale,
        y: (rootPoint.y - transform.y) / transform.scale,
      }
      const areas = this.nodeHitAreas.get(sceneId) ?? []

      for (let index = areas.length - 1; index >= 0; index -= 1) {
        const area = areas[index]
        if (
          scenePoint.x < area.x ||
          scenePoint.x > area.x + area.width ||
          scenePoint.y < area.y ||
          scenePoint.y > area.y + area.height ||
          (options.isNodeInteractive && !options.isNodeInteractive(scene, area.node))
        ) {
          continue
        }
        return {
          scene,
          node: area.node,
          screenPoint: { ...screenPoint },
          rootPoint,
          scenePoint,
        }
      }
    }
    return null
  }

  getSceneWorldTransform(sceneId: MapSceneId): SceneWorldTransform {
    this.assertSceneExists(sceneId)
    return { ...this.sceneTransforms.get(sceneId)! }
  }

  private resolveTransition(activeScene: MapScene): ResolvedTransition | null {
    const outgoing = this.resolveOutgoingTransition(activeScene)
    if (outgoing) return outgoing

    const incomingEmbedding = this.embeddings.get(activeScene.id)
    if (!incomingEmbedding) return null
    const parentScene = this.scenes[incomingEmbedding.parentSceneId]
    const measurement = this.measureReveal(parentScene, incomingEmbedding, 'child')
    const revealProgress = this.state.pinnedChildSceneId === activeScene.id
      ? 1
      : measurement.revealProgress
    return this.makeResolvedTransition(
      parentScene,
      activeScene,
      incomingEmbedding,
      'exit',
      revealProgress,
    )
  }

  private resolveOutgoingTransition(activeScene: MapScene): ResolvedTransition | null {
    const outgoing = this.outgoingEmbeddings.get(activeScene.id) ?? []
    let best: { embedding: SceneEmbedding; revealProgress: number } | null = null

    for (const embedding of outgoing) {
      const pinned = this.state.pinnedChildSceneId === embedding.childSceneId
      const revealProgress = pinned
        ? 1
        : this.measureReveal(activeScene, embedding, 'parent').revealProgress
      if (revealProgress <= VISIBLE_ALPHA_EPSILON) continue
      if (
        !best ||
        revealProgress > best.revealProgress ||
        (revealProgress === best.revealProgress && pinned)
      ) {
        best = { embedding, revealProgress }
      }
    }

    if (!best) return null
    return this.makeResolvedTransition(
      activeScene,
      this.scenes[best.embedding.childSceneId],
      best.embedding,
      'enter',
      best.revealProgress,
    )
  }

  private makeResolvedTransition(
    parentScene: MapScene,
    childScene: MapScene,
    embedding: SceneEmbedding,
    direction: 'enter' | 'exit',
    revealProgress: number,
  ): ResolvedTransition {
    const childAlpha = clamp01(revealProgress)
    const parentAlpha = childAlpha >= 0.999
      ? 0
      : 1 - smoothstep(this.parentFadeStart, 1, childAlpha)
    return {
      parentScene,
      childScene,
      transition: {
        embedding,
        direction,
        revealProgress: childAlpha,
        parentAlpha,
        childAlpha,
      },
    }
  }

  private measureReveal(
    parentScene: MapScene,
    embedding: SceneEmbedding,
    currentScope: 'parent' | 'child',
  ): RevealMeasurement {
    const ownerPosition = parentScene.layout.positions[embedding.ownerNodeId]
    const parentTransform = this.sceneTransforms.get(parentScene.id)!
    const camera = this.state.camera
    const ownerOrigin = {
      x: parentTransform.x + ownerPosition.x * parentTransform.scale,
      y: parentTransform.y + ownerPosition.y * parentTransform.scale,
    }
    const ownerScreenRect = {
      left: camera.x + ownerOrigin.x * camera.scale,
      top: camera.y + ownerOrigin.y * camera.scale,
      right: camera.x + (ownerOrigin.x + parentScene.nodeWidth * parentTransform.scale) * camera.scale,
      bottom: camera.y + (ownerOrigin.y + parentScene.nodeHeight * parentTransform.scale) * camera.scale,
    }
    const contentWidth = this.contentViewportWidth()
    const portalDistance = distanceFromPointToRect(
      contentWidth / 2,
      this.state.viewport.height / 2,
      ownerScreenRect,
    )
    const portalFocusRadius = Math.min(contentWidth, this.state.viewport.height) * this.portalFocusRadiusRatio
    const portalFocus = 1 - smoothstep(0, portalFocusRadius, portalDistance)
    const effectiveScale = camera.scale * parentTransform.scale * parentScene.cardScale
    const sizeProgress = smoothstep(
      this.lodPolicy.revealStartScale,
      this.lodPolicy.revealEndScale,
      effectiveScale,
    )
    return {
      portalFocus,
      sizeProgress,
      revealProgress: resolveRevealProgress(sizeProgress, portalFocus, currentScope),
    }
  }

  private resolveSceneFrame(
    scene: MapScene,
    resolvedTransition: ResolvedTransition | null,
  ): SceneFrameState {
    const worldTransform = this.sceneTransforms.get(scene.id)!
    const projectedNodeHeightPx = this.state.camera.scale * worldTransform.scale * scene.nodeHeight
    const cardAlpha = smoothstep(
      this.lodPolicy.cardExitPx,
      this.lodPolicy.cardEnterPx,
      projectedNodeHeightPx,
    )
    const markerAlpha = 1 - cardAlpha
    let role: SceneFrameRole = scene.id === this.state.activeSceneId ? 'active' : 'hidden'
    let alpha = role === 'active' ? 1 : 0

    if (resolvedTransition) {
      const { transition, parentScene, childScene } = resolvedTransition
      if (scene.id === parentScene.id) {
        role = 'parent'
        alpha = transition.parentAlpha
      } else if (scene.id === childScene.id) {
        role = 'child'
        alpha = transition.childAlpha
      }
    }

    const isActive = scene.id === this.state.activeSceneId
    const transitionInteractive = resolvedTransition && (
      (scene.id === resolvedTransition.childScene.id && resolvedTransition.transition.childAlpha >= this.lodPolicy.scopeExitOpacity) ||
      (scene.id === resolvedTransition.parentScene.id && resolvedTransition.transition.parentAlpha >= this.lodPolicy.scopeExitOpacity)
    )

    return {
      sceneId: scene.id,
      role,
      worldTransform,
      alpha,
      markerAlpha,
      cardAlpha,
      projectedNodeHeightPx,
      interactive: alpha > VISIBLE_ALPHA_EPSILON && (isActive || Boolean(transitionInteractive)),
    }
  }

  private resolveScopeEvent(transition: MapScopeTransition | null): MapScopeEvent | null {
    if (!transition) {
      this.pendingScopeEventKey = null
      return null
    }

    const currentScope = transition.direction === 'enter' ? 'parent' : 'child'
    const nextScope = resolveRevealScope(currentScope, transition.revealProgress, this.lodPolicy)
    if (currentScope === nextScope) {
      this.pendingScopeEventKey = null
      return null
    }

    const fromSceneId = transition.direction === 'enter'
      ? transition.embedding.parentSceneId
      : transition.embedding.childSceneId
    const toSceneId = transition.direction === 'enter'
      ? transition.embedding.childSceneId
      : transition.embedding.parentSceneId
    const key = `${transition.direction}:${fromSceneId}:${toSceneId}`
    if (this.pendingScopeEventKey === key) return null
    this.pendingScopeEventKey = key
    return {
      type: transition.direction,
      fromSceneId,
      toSceneId,
      revealProgress: transition.revealProgress,
      embedding: transition.embedding,
    }
  }

  private resolveRenderOrder(resolvedTransition: ResolvedTransition | null): readonly MapSceneId[] {
    if (!resolvedTransition) return [this.state.activeSceneId]
    return [resolvedTransition.parentScene.id, resolvedTransition.childScene.id]
  }

  private resolveResidentSceneIds(
    activeScene: MapScene,
    resolvedTransition: ResolvedTransition | null,
  ): readonly MapSceneId[] {
    const resident = new Set<MapSceneId>([activeScene.id])
    const incoming = this.embeddings.get(activeScene.id)
    if (incoming) resident.add(incoming.parentSceneId)
    for (const embedding of this.outgoingEmbeddings.get(activeScene.id) ?? []) {
      resident.add(embedding.childSceneId)
    }
    if (resolvedTransition) {
      resident.add(resolvedTransition.parentScene.id)
      resident.add(resolvedTransition.childScene.id)
    }
    return [...resident]
  }

  private contentViewportWidth(): number {
    const viewportWidth = this.state.viewport.width
    if (!this.state.panel.open || viewportWidth <= 800) return viewportWidth
    return Math.max(1, viewportWidth - this.state.panel.width)
  }

  private buildEmbeddingIndexes(): void {
    const mutable = new Map<MapSceneId, SceneEmbedding[]>()
    for (const embedding of this.embeddings.values()) {
      const list = mutable.get(embedding.parentSceneId) ?? []
      list.push(embedding)
      mutable.set(embedding.parentSceneId, list)
    }
    for (const scene of this.sceneList) {
      this.outgoingEmbeddings.set(scene.id, mutable.get(scene.id) ?? [])
    }
  }

  private buildSceneTransforms(): void {
    const resolving = new Set<MapSceneId>()
    const resolve = (sceneId: MapSceneId): SceneWorldTransform => {
      const cached = this.sceneTransforms.get(sceneId)
      if (cached) return cached
      if (resolving.has(sceneId)) throw new Error(`场景“${sceneId}”的嵌入关系形成循环。`)
      resolving.add(sceneId)
      const embedding = this.embeddings.get(sceneId)
      const transform = embedding
        ? (() => {
            const parent = resolve(embedding.parentSceneId)
            return {
              x: parent.x + embedding.offsetX * parent.scale,
              y: parent.y + embedding.offsetY * parent.scale,
              scale: parent.scale * embedding.scale,
            }
          })()
        : { x: 0, y: 0, scale: 1 }
      resolving.delete(sceneId)
      this.sceneTransforms.set(sceneId, transform)
      return transform
    }
    for (const scene of this.sceneList) resolve(scene.id)
  }

  private buildHitAreaIndex(resolveAreas: SceneNodeHitAreaResolver): void {
    for (const scene of this.sceneList) {
      this.nodeHitAreas.set(scene.id, resolveAreas(scene))
    }
  }

  private assertSceneExists(sceneId: MapSceneId): void {
    if (!this.scenes[sceneId]) throw new Error(`地图渲染内核找不到场景“${sceneId}”。`)
  }

  private normalizeCamera(camera: CameraTransform): CameraTransform {
    return {
      x: finiteCoordinate(camera.x),
      y: finiteCoordinate(camera.y),
      scale: finitePositive(camera.scale, 1),
    }
  }

  private normalizeViewport(viewport: MapViewport): MapViewport {
    return {
      width: finitePositive(viewport.width, 1),
      height: finitePositive(viewport.height, 1),
    }
  }

  private normalizePanel(panel: MapPanelState): MapPanelState {
    return {
      open: Boolean(panel.open),
      width: finitePositive(panel.width, DEFAULT_PANEL.width),
    }
  }
}
