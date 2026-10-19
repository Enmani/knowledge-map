export const RELATED_NODE_LODS = ['card', 'title'] as const
export const RELATED_NODE_MIN_OPACITY = 0.88
export const RELATED_NODE_RENDER_ORDER = 20
export const SELECTED_NODE_STAR_SCALE = 2

export type NodeDisplayPriority = 'default' | 'selected' | 'hovered'

export const NODE_DISPLAY_RENDER_ORDER: Readonly<Record<NodeDisplayPriority, number>> = {
  default: 3,
  selected: 30,
  hovered: 40,
}

export const HOVERED_NODE_VISUAL_SCALE = 1.06

export function resolveNodeDisplayPriority(
  selected: boolean,
  hovered: boolean,
): NodeDisplayPriority {
  if (hovered) return 'hovered'
  return selected ? 'selected' : 'default'
}

export function relatedNodeDepthRenderOrder(cameraDepth: number): number {
  return RELATED_NODE_RENDER_ORDER + 1 / (1 + Math.max(0, cameraDepth))
}
