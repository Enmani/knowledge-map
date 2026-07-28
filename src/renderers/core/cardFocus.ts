export type CardFocusRole = 'primary' | 'related' | 'context' | 'default'
export type CardFocusEdgeRole = 'connected' | 'context' | 'default'

export interface CardFocusState {
  active: boolean
  primaryNodeIds: ReadonlySet<string>
  relatedNodeIds: ReadonlySet<string>
  contextNodeIds: ReadonlySet<string>
}

export interface ResolveCardFocusInput {
  allNodeIds: Iterable<string>
  primaryNodeIds?: Iterable<string>
  relatedNodeIds?: Iterable<string>
}

export const CARD_FOCUS_CONTEXT_OPACITY = 0.46

const EMPTY_NODE_IDS: ReadonlySet<string> = new Set<string>()

export const EMPTY_CARD_FOCUS: CardFocusState = {
  active: false,
  primaryNodeIds: EMPTY_NODE_IDS,
  relatedNodeIds: EMPTY_NODE_IDS,
  contextNodeIds: EMPTY_NODE_IDS,
}

export function resolveCardFocusState({
  allNodeIds,
  primaryNodeIds = EMPTY_NODE_IDS,
  relatedNodeIds = EMPTY_NODE_IDS,
}: ResolveCardFocusInput): CardFocusState {
  const availableNodeIds = new Set(allNodeIds)
  const primary = new Set(
    [...primaryNodeIds].filter((nodeId) => availableNodeIds.has(nodeId)),
  )
  const related = new Set(
    [...relatedNodeIds].filter((nodeId) => availableNodeIds.has(nodeId) && !primary.has(nodeId)),
  )

  if (primary.size === 0 && related.size === 0) return EMPTY_CARD_FOCUS

  const context = new Set(
    [...availableNodeIds].filter((nodeId) => !primary.has(nodeId) && !related.has(nodeId)),
  )
  return {
    active: true,
    primaryNodeIds: primary,
    relatedNodeIds: related,
    contextNodeIds: context,
  }
}

export function getCardFocusRole(state: CardFocusState, nodeId: string): CardFocusRole {
  if (!state.active) return 'default'
  if (state.primaryNodeIds.has(nodeId)) return 'primary'
  if (state.relatedNodeIds.has(nodeId)) return 'related'
  return state.contextNodeIds.has(nodeId) ? 'context' : 'default'
}

export function getCardFocusEdgeRole(
  state: CardFocusState,
  sourceId: string,
  targetId: string,
): CardFocusEdgeRole {
  if (!state.active) return 'default'
  const sourceRole = getCardFocusRole(state, sourceId)
  const targetRole = getCardFocusRole(state, targetId)
  const sourceFocused = sourceRole === 'primary' || sourceRole === 'related'
  const targetFocused = targetRole === 'primary' || targetRole === 'related'
  return sourceFocused && targetFocused ? 'connected' : 'context'
}
