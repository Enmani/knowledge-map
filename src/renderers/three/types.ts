import type {
  KnowledgeSpaceEdge,
  KnowledgeSpaceNode,
  KnowledgeSpaceProjection,
  ScienceDomainId,
  SpaceVector3,
} from '../../knowledge/space3d/types'
import type { CardFocusState } from '../core/cardFocus'

export type SpaceColorTheme = 'light' | 'dark'

export interface ThreeKnowledgeCameraState {
  distance: number
  zoomPercent: number
}

export interface ThreeKnowledgeSubspaceNode {
  node: KnowledgeSpaceNode
  localPosition: SpaceVector3
  scale: number
}

export interface ThreeKnowledgeSubspaceFieldLobe {
  nodeId: string
  localPosition: SpaceVector3
  radius: number
  opacity: number
}

export interface ThreeKnowledgeSubspaceField {
  id: string
  kind: 'domain' | 'tag'
  label: string
  color: string
  domainId?: ScienceDomainId
  tag?: string
  opacity: number
  lobes: readonly ThreeKnowledgeSubspaceFieldLobe[]
}

export interface ThreeKnowledgeSubspace {
  id: string
  title: string
  ownerNodeId: string
  nodes: readonly ThreeKnowledgeSubspaceNode[]
  edges: readonly KnowledgeSpaceEdge[]
  /** Optional for backward-compatible scene definitions; absent fields render as an empty local layer. */
  fields?: readonly ThreeKnowledgeSubspaceField[]
  revealStartPx: number
  revealEndPx: number
  scopeEnterZoom: number
  scopeExitZoom: number
}

export interface ThreeKnowledgeRendererCallbacks {
  onSelectNode?: (nodeId: string) => void
  onBlankClick?: () => void
  onCameraChange?: (state: ThreeKnowledgeCameraState) => void
  onScopeChange?: (subspaceId: string | null) => void
}

export interface ThreeKnowledgeRendererOptions extends ThreeKnowledgeRendererCallbacks {
  host: HTMLElement
  projection: KnowledgeSpaceProjection
  cardFocus: CardFocusState
  selectedNodeId?: string | null
  walkingMode?: boolean
  fieldsVisible?: boolean
  colorTheme?: SpaceColorTheme
  subspaces?: readonly ThreeKnowledgeSubspace[]
  maxPixelRatio?: number
}
