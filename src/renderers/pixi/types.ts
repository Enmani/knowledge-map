import type { DomainId, FieldTagId, MathNode } from '../../data/mathMap'
import type { MapSceneId } from '../../features/map/sceneCatalog'
import type { CardFocusState } from '../core/cardFocus'

export interface PixiMapRendererOptions {
  host: HTMLElement
  width: number
  height: number
  resolution?: number
  backgroundAlpha?: number
  signal?: AbortSignal
}

export interface PixiCameraTransform {
  x: number
  y: number
  scale: number
}

export interface PixiSceneFrameState {
  alpha: number
  markerAlpha: number
  cardAlpha: number
  interactive: boolean
  x?: number
  y?: number
  scale?: number
}

export interface PixiMapFrame {
  scenes: Partial<Record<MapSceneId, PixiSceneFrameState>>
}

export type PixiNodeStatus = 'mastered' | 'available' | 'locked'

/**
 * Discrete node state. LOD opacity and transforms belong in applyFrame so the
 * animation hot path never recreates text, graphics, or scene objects.
 */
export interface PixiVisualState {
  selectedSceneId?: MapSceneId | null
  selectedNodeId?: string | null
  hiddenNodeIds?: ReadonlySet<string>
  silhouetteNodeIds?: ReadonlySet<string>
  pathNodeIds?: ReadonlySet<string>
  contextNodeIds?: ReadonlySet<string>
  nextUnlockNodeIds?: ReadonlySet<string>
  mutedNodeIds?: ReadonlySet<string>
  nonInteractiveNodeIds?: ReadonlySet<string>
  highlightedNodeIds?: ReadonlySet<string>
  cardFocus?: CardFocusState
  statuses?: Readonly<Record<string, PixiNodeStatus>>
  activeDomains?: ReadonlySet<DomainId>
  activeFieldTag?: FieldTagId | null
  frontierNodeCounts?: Readonly<Record<string, number>>
}

export interface PixiHitTestResult {
  sceneId: MapSceneId
  nodeId: string
  node: MathNode
}
