import type { CameraTransform } from './sceneEmbedding'

export const MINIMUM_SCALE = 0.1
const MAXIMUM_SCALE = 128
const WHEEL_RESPONSE_MS = 90

export interface WheelZoomGesture {
  scale: number
  screenX: number
  screenY: number
  worldX: number
  worldY: number
}

export function createZoomTarget(
  current: CameraTransform,
  factor: number,
  screenX: number,
  screenY: number,
): CameraTransform {
  const scale = Math.min(MAXIMUM_SCALE, Math.max(MINIMUM_SCALE, current.scale * factor))
  const worldX = (screenX - current.x) / current.scale
  const worldY = (screenY - current.y) / current.scale
  return {
    x: screenX - worldX * scale,
    y: screenY - worldY * scale,
    scale,
  }
}

export function wheelScaleFactor(deltaY: number, deltaMode: number, ctrlKey: boolean): number {
  const wheelDelta = -deltaY * (deltaMode === 1 ? 0.05 : deltaMode ? 1 : 0.002) * (ctrlKey ? 10 : 1)
  return Math.pow(2, Math.max(-0.24, Math.min(0.24, wheelDelta)))
}

export function createWheelZoomGesture(
  current: CameraTransform,
  previous: WheelZoomGesture | null,
  factor: number,
  screenX: number,
  screenY: number,
): WheelZoomGesture {
  const samePointer = previous?.screenX === screenX && previous.screenY === screenY
  const scaleBase = previous?.scale ?? current.scale
  return {
    scale: Math.min(MAXIMUM_SCALE, Math.max(MINIMUM_SCALE, scaleBase * factor)),
    screenX,
    screenY,
    worldX: samePointer && previous ? previous.worldX : (screenX - current.x) / current.scale,
    worldY: samePointer && previous ? previous.worldY : (screenY - current.y) / current.scale,
  }
}

export function dampWheelZoom(
  current: CameraTransform,
  target: WheelZoomGesture,
  elapsedMs: number,
): CameraTransform {
  const progress = 1 - Math.exp(-Math.max(0, elapsedMs) / WHEEL_RESPONSE_MS)
  const scaleRatio = target.scale / current.scale
  const scale = current.scale * Math.pow(scaleRatio, progress)
  return {
    x: target.screenX - target.worldX * scale,
    y: target.screenY - target.worldY * scale,
    scale,
  }
}

export function completeWheelZoom(target: WheelZoomGesture): CameraTransform {
  return {
    x: target.screenX - target.worldX * target.scale,
    y: target.screenY - target.worldY * target.scale,
    scale: target.scale,
  }
}

export function isWheelZoomSettled(current: CameraTransform, target: WheelZoomGesture): boolean {
  return Math.abs(Math.log(current.scale / target.scale)) < 0.0002
}
