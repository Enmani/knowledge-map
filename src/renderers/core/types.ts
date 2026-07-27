import type { MathNode } from '../../data/mathMap'
import type { LodPolicy } from '../../engine/lod/semanticLod'
import type { MapScene, MapSceneId } from '../../features/map/sceneCatalog'
import type { CameraTransform, SceneEmbedding } from '../../features/map/sceneEmbedding'

export interface MapViewport {
  width: number
  height: number
}

export interface MapPanelState {
  open: boolean
  width: number
}

export interface MapRenderKernelState {
  camera: CameraTransform
  viewport: MapViewport
  panel: MapPanelState
  activeSceneId: MapSceneId
  pinnedChildSceneId: MapSceneId | null
}

export type MapRenderKernelUpdate = Partial<MapRenderKernelState>

export interface SceneWorldTransform {
  x: number
  y: number
  scale: number
}

export type SceneFrameRole = 'active' | 'parent' | 'child' | 'hidden'

export interface SceneFrameState {
  sceneId: MapSceneId
  role: SceneFrameRole
  worldTransform: SceneWorldTransform
  alpha: number
  markerAlpha: number
  cardAlpha: number
  projectedNodeHeightPx: number
  interactive: boolean
}

export type ScopeTransitionDirection = 'enter' | 'exit'

export interface MapScopeTransition {
  embedding: SceneEmbedding
  direction: ScopeTransitionDirection
  revealProgress: number
  parentAlpha: number
  childAlpha: number
}

export interface MapScopeEvent {
  type: ScopeTransitionDirection
  fromSceneId: MapSceneId
  toSceneId: MapSceneId
  revealProgress: number
  embedding: SceneEmbedding
}

export interface MapRenderFrame {
  camera: CameraTransform
  viewport: MapViewport
  activeSceneId: MapSceneId
  transition: MapScopeTransition | null
  scopeEvent: MapScopeEvent | null
  scenes: readonly SceneFrameState[]
  renderOrder: readonly MapSceneId[]
  residentSceneIds: readonly MapSceneId[]
}

export interface SceneNodeHitArea {
  node: MathNode
  x: number
  y: number
  width: number
  height: number
}

export type SceneNodeHitAreaResolver = (scene: MapScene) => readonly SceneNodeHitArea[]

export interface MapHitTestOptions {
  isNodeInteractive?: (scene: MapScene, node: MathNode) => boolean
}

export interface MapHitResult {
  scene: MapScene
  node: MathNode
  screenPoint: Readonly<{ x: number; y: number }>
  rootPoint: Readonly<{ x: number; y: number }>
  scenePoint: Readonly<{ x: number; y: number }>
}

export interface MapRenderKernelOptions {
  scenes?: Readonly<Record<MapSceneId, MapScene>>
  embeddings?: ReadonlyMap<MapSceneId, SceneEmbedding>
  lodPolicy?: Readonly<LodPolicy>
  initialState?: Partial<MapRenderKernelState>
  resolveNodeHitAreas?: SceneNodeHitAreaResolver
  portalFocusRadiusRatio?: number
  parentFadeStart?: number
}
