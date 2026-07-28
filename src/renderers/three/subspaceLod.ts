export const SUBSPACE_SCOPE_ENTER_PROGRESS = 0.8
export const SUBSPACE_SCOPE_EXIT_PROGRESS = 0.2

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (maximum <= minimum) return value >= maximum ? 1 : 0
  const normalized = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)))
  return normalized * normalized * (3 - 2 * normalized)
}

export function createSubspaceRevealRange(
  projectedOwnerHeight: number,
  defaultStartPx: number,
  defaultEndPx: number,
): { startPx: number; endPx: number } {
  const startPx = Math.max(defaultStartPx, projectedOwnerHeight)
  return {
    startPx,
    endPx: Math.max(defaultEndPx, startPx * 1.65),
  }
}

export function subspaceRevealProgress(
  projectedOwnerHeight: number,
  startPx: number,
  endPx: number,
): number {
  return smoothstep(projectedOwnerHeight, startPx, endPx)
}

export function parentScopeWeight(childProgress: number): number {
  return 1 - smoothstep(childProgress, 0.18, 1)
}
