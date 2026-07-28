import type {
  KnowledgeSpaceEdge,
  KnowledgeSpaceNode,
  KnowledgeSpaceProjection,
  SpaceVector3,
} from '../../knowledge/space3d/types'

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

export interface ThreeKnowledgeSubspace {
  id: string
  title: string
  ownerNodeId: string
  nodes: readonly ThreeKnowledgeSubspaceNode[]
  edges: readonly KnowledgeSpaceEdge[]
  revealStartPx: number
  revealEndPx: number
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
  selectedNodeId?: string | null
  walkingMode?: boolean
  fieldsVisible?: boolean
  colorTheme?: SpaceColorTheme
  subspaces?: readonly ThreeKnowledgeSubspace[]
  maxPixelRatio?: number
}
