export type SemanticLodLevel = 'marker' | 'card' | 'children'

export interface LodPolicy {
  cardEnterPx: number
  cardExitPx: number
  childrenEnterPx: number
  childrenExitPx: number
  enterViewportRatio: number
  exitViewportRatio: number
  maximumCenterDistanceRatio: number
  lodDwellMs: number
  enterDwellMs: number
  revealStartScale: number
  revealEndScale: number
  scopeEnterOpacity: number
  scopeExitOpacity: number
  portalButtonZoomMultiplier: number
}

export interface ProjectedNodeMetrics {
  widthPx: number
  heightPx: number
  viewportWidthPx: number
  viewportHeightPx: number
  centerDistancePx: number
}

export interface SemanticLodInput {
  metrics: ProjectedNodeMetrics
  nowMs: number
  canEnter: boolean
  interactionActive?: boolean
  transitionActive?: boolean
  viewportResizeActive?: boolean
}

export interface SemanticLodState {
  level: SemanticLodLevel
  pendingLevel?: SemanticLodLevel
  pendingLevelSinceMs?: number
  enterCandidateSinceMs?: number
  portalArmed: boolean
}

export interface SemanticLodUpdate {
  state: SemanticLodState
  enterRequested: boolean
}

export interface WorldRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Camera2D {
  centerX: number
  centerY: number
  zoom: number
}

export interface ViewportSize {
  width: number
  height: number
}

export const DEFAULT_LOD_POLICY: Readonly<LodPolicy> = {
  cardEnterPx: 30,
  cardExitPx: 24,
  childrenEnterPx: 104,
  childrenExitPx: 76,
  enterViewportRatio: 0.28,
  exitViewportRatio: 0.2,
  maximumCenterDistanceRatio: 0.22,
  lodDwellMs: 70,
  enterDwellMs: 110,
  revealStartScale: 1.8,
  revealEndScale: 2.6,
  scopeEnterOpacity: 0.8,
  scopeExitOpacity: 0.2,
  portalButtonZoomMultiplier: 2,
}

export const INITIAL_SEMANTIC_LOD_STATE: Readonly<SemanticLodState> = {
  level: 'marker',
  portalArmed: false,
}

function validatePolicy(policy: LodPolicy) {
  if (
    policy.cardExitPx > policy.cardEnterPx ||
    policy.childrenExitPx > policy.childrenEnterPx ||
    policy.cardEnterPx > policy.childrenEnterPx ||
    policy.exitViewportRatio > policy.enterViewportRatio ||
    policy.revealStartScale >= policy.revealEndScale ||
    policy.scopeExitOpacity >= policy.scopeEnterOpacity ||
    policy.scopeExitOpacity < 0 ||
    policy.scopeEnterOpacity > 1 ||
    policy.portalButtonZoomMultiplier < 1
  ) {
    throw new Error('LOD 阈值无效：退出阈值必须低于进入阈值，且子节点阈值必须高于卡片阈值。')
  }
}

export type RevealScope = 'parent' | 'child'

export function resolveRevealProgress(
  sizeProgress: number,
  portalFocus: number,
  currentScope: RevealScope,
): number {
  const clampedSizeProgress = Math.min(1, Math.max(0, sizeProgress))
  const clampedPortalFocus = Math.min(1, Math.max(0, portalFocus))
  return currentScope === 'child'
    ? clampedSizeProgress
    : clampedSizeProgress * clampedPortalFocus
}

export function resolveRevealScope(
  currentScope: RevealScope,
  revealProgress: number,
  policy: LodPolicy = DEFAULT_LOD_POLICY,
): RevealScope {
  validatePolicy(policy)
  if (currentScope === 'parent' && revealProgress > policy.scopeEnterOpacity) return 'child'
  if (currentScope === 'child' && revealProgress < policy.scopeExitOpacity) return 'parent'
  return currentScope
}

function shortSidePx(metrics: ProjectedNodeMetrics) {
  return Math.min(metrics.widthPx, metrics.heightPx)
}

export function projectedViewportRatio(metrics: ProjectedNodeMetrics) {
  if (metrics.viewportWidthPx <= 0 || metrics.viewportHeightPx <= 0) return 0
  return Math.min(
    metrics.widthPx / metrics.viewportWidthPx,
    metrics.heightPx / metrics.viewportHeightPx,
  )
}

export function projectedCenterDistanceRatio(metrics: ProjectedNodeMetrics) {
  const viewportDiagonal = Math.hypot(metrics.viewportWidthPx, metrics.viewportHeightPx)
  return viewportDiagonal > 0 ? metrics.centerDistancePx / viewportDiagonal : Number.POSITIVE_INFINITY
}

function desiredLevel(
  current: SemanticLodLevel,
  metrics: ProjectedNodeMetrics,
  policy: LodPolicy,
): SemanticLodLevel {
  const size = shortSidePx(metrics)

  if (size >= policy.childrenEnterPx) return 'children'
  if (current === 'children' && size >= policy.childrenExitPx) return 'children'
  if (size >= policy.cardEnterPx) return 'card'
  if (current === 'card' && size >= policy.cardExitPx) return 'card'
  return 'marker'
}

function updateLevel(
  state: SemanticLodState,
  desired: SemanticLodLevel,
  nowMs: number,
  dwellMs: number,
): SemanticLodState {
  if (desired === state.level) {
    if (!state.pendingLevel) return state
    return { ...state, pendingLevel: undefined, pendingLevelSinceMs: undefined }
  }

  if (state.pendingLevel !== desired || state.pendingLevelSinceMs === undefined) {
    return { ...state, pendingLevel: desired, pendingLevelSinceMs: nowMs }
  }

  if (nowMs - state.pendingLevelSinceMs < dwellMs) return state
  return {
    ...state,
    level: desired,
    pendingLevel: undefined,
    pendingLevelSinceMs: undefined,
  }
}

function mayArmPortal(input: SemanticLodInput, state: SemanticLodState, policy: LodPolicy) {
  return (
    state.level === 'children' &&
    input.canEnter &&
    !input.interactionActive &&
    !input.transitionActive &&
    !input.viewportResizeActive &&
    projectedViewportRatio(input.metrics) >= policy.enterViewportRatio &&
    projectedCenterDistanceRatio(input.metrics) <= policy.maximumCenterDistanceRatio
  )
}

/** Advance one node's semantic LOD state. enterRequested is a one-frame pulse. */
export function advanceSemanticLod(
  previous: SemanticLodState,
  input: SemanticLodInput,
  policy: LodPolicy = DEFAULT_LOD_POLICY,
): SemanticLodUpdate {
  validatePolicy(policy)

  let state = updateLevel(
    previous,
    desiredLevel(previous.level, input.metrics, policy),
    input.nowMs,
    policy.lodDwellMs,
  )
  let enterRequested = false

  const shouldDisarm =
    !input.canEnter ||
    state.level !== 'children' ||
    projectedViewportRatio(input.metrics) < policy.exitViewportRatio

  if (shouldDisarm) {
    state = {
      ...state,
      portalArmed: false,
      enterCandidateSinceMs: undefined,
    }
  } else if (mayArmPortal(input, state, policy)) {
    if (state.enterCandidateSinceMs === undefined) {
      state = { ...state, enterCandidateSinceMs: input.nowMs }
    } else if (
      !state.portalArmed &&
      input.nowMs - state.enterCandidateSinceMs >= policy.enterDwellMs
    ) {
      state = { ...state, portalArmed: true }
      enterRequested = true
    }
  } else if (!state.portalArmed && state.enterCandidateSinceMs !== undefined) {
    state = { ...state, enterCandidateSinceMs: undefined }
  }

  return { state, enterRequested }
}

export function measureProjectedNode(
  bounds: WorldRect,
  camera: Camera2D,
  viewport: ViewportSize,
): ProjectedNodeMetrics {
  const zoom = Math.max(0, camera.zoom)
  const nodeCenterX = bounds.x + bounds.width / 2
  const nodeCenterY = bounds.y + bounds.height / 2
  const screenCenterX = (nodeCenterX - camera.centerX) * zoom + viewport.width / 2
  const screenCenterY = (nodeCenterY - camera.centerY) * zoom + viewport.height / 2

  return {
    widthPx: Math.max(0, bounds.width * zoom),
    heightPx: Math.max(0, bounds.height * zoom),
    viewportWidthPx: Math.max(0, viewport.width),
    viewportHeightPx: Math.max(0, viewport.height),
    centerDistancePx: Math.hypot(
      screenCenterX - viewport.width / 2,
      screenCenterY - viewport.height / 2,
    ),
  }
}
