import type { SpaceVector3 } from '../../knowledge/space3d/types'

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

/** Ambient parent fields dissolve before cards so the camera appears to pass through the color volume. */
export function parentFieldScopeWeight(childProgress: number): number {
  return 1 - smoothstep(childProgress, 0.05, 0.72)
}

/** Child fields rise before the parent field is gone, avoiding a dark gap between semantic scales. */
export function childFieldScopeWeight(childProgress: number): number {
  return smoothstep(childProgress, 0.18, 0.82)
}

export function subspaceCardCenter(
  positions: readonly SpaceVector3[],
  fallback: SpaceVector3,
): SpaceVector3 {
  if (positions.length === 0) return [...fallback]
  const sum = positions.reduce<SpaceVector3>((center, position) => [
    center[0] + position[0],
    center[1] + position[1],
    center[2] + position[2],
  ], [0, 0, 0])
  return [
    sum[0] / positions.length,
    sum[1] / positions.length,
    sum[2] / positions.length,
  ]
}

export function subspaceEntryZoom(
  currentZoom: number,
  projectedOwnerHeight: number,
  revealEndPx: number,
  minimumEntryZoom: number,
  maximumZoom: number,
): number {
  if (projectedOwnerHeight <= 0 || revealEndPx <= 0) return currentZoom
  const targetHeight = revealEndPx * 1.02
  return Math.min(
    maximumZoom,
    Math.max(currentZoom, minimumEntryZoom, currentZoom * targetHeight / projectedOwnerHeight),
  )
}

export function shouldEnterSubspaceScope(
  cameraZoom: number,
  childProgress: number,
  entryZoom: number,
): boolean {
  return cameraZoom >= entryZoom && childProgress >= SUBSPACE_SCOPE_ENTER_PROGRESS
}

export function shouldExitSubspaceScope(cameraZoom: number, exitZoom: number): boolean {
  return cameraZoom <= exitZoom
}
