export const MIN_GLOBAL_ZOOM = 0.1
export const MAX_GLOBAL_ZOOM = 128

const WHEEL_RESPONSE_MS = 90

export function wheelGlobalZoomFactor(
  deltaY: number,
  deltaMode: number,
  ctrlKey: boolean,
): number {
  const wheelDelta = -deltaY
    * (deltaMode === 1 ? 0.05 : deltaMode ? 1 : 0.002)
    * (ctrlKey ? 10 : 1)
  return Math.pow(2, Math.max(-0.24, Math.min(0.24, wheelDelta)))
}

export function nextGlobalZoom(
  targetZoom: number,
  deltaY: number,
  deltaMode = 0,
  ctrlKey = false,
): number {
  const factor = wheelGlobalZoomFactor(deltaY, deltaMode, ctrlKey)
  return Math.max(MIN_GLOBAL_ZOOM, Math.min(MAX_GLOBAL_ZOOM, targetZoom * factor))
}

export function dampGlobalZoom(
  currentZoom: number,
  targetZoom: number,
  elapsedSeconds: number,
): number {
  const progress = 1 - Math.exp(-Math.max(0, elapsedSeconds) * 1000 / WHEEL_RESPONSE_MS)
  return currentZoom * Math.pow(targetZoom / currentZoom, progress)
}

export function isGlobalZoomSettled(currentZoom: number, targetZoom: number): boolean {
  return Math.abs(Math.log(currentZoom / targetZoom)) < 0.0002
}

export function zoomPanCompensation(
  cameraSpaceX: number,
  cameraSpaceY: number,
  previousZoom: number,
  nextZoom: number,
): { x: number; y: number } {
  const safePreviousZoom = Math.max(Number.EPSILON, previousZoom)
  const safeNextZoom = Math.max(Number.EPSILON, nextZoom)
  const compensation = 1 - safePreviousZoom / safeNextZoom
  return {
    x: cameraSpaceX * compensation,
    y: cameraSpaceY * compensation,
  }
}

export function globalZoomPercent(zoom: number): number {
  return Math.round(Math.max(0, zoom) * 100)
}
