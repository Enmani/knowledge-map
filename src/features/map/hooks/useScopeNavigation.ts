import { useCallback, useMemo, useState } from 'react'
import {
  getMapScene,
  sceneCatalog,
  type MapScene,
  type MapSceneId,
} from '../sceneCatalog'

export interface ScopeCameraSnapshot {
  x: number
  y: number
  scale: number
}

export interface ScopeNavigationTransition {
  scene: MapScene
  camera: ScopeCameraSnapshot | null
}

export interface UseScopeNavigationOptions {
  initialSceneId?: MapSceneId
  initialCamera?: ScopeCameraSnapshot
}

export interface ScopeNavigationResult {
  activeScene: MapScene
  activeSceneId: MapSceneId
  path: readonly MapScene[]
  depth: number
  canExit: boolean
  cameraSnapshots: Readonly<Partial<Record<MapSceneId, ScopeCameraSnapshot>>>
  saveCamera: (camera: ScopeCameraSnapshot) => void
  enter: (sceneId: MapSceneId, currentCamera: ScopeCameraSnapshot) => ScopeNavigationTransition | null
  exit: (currentCamera: ScopeCameraSnapshot) => ScopeNavigationTransition | null
  root: (currentCamera: ScopeCameraSnapshot) => ScopeNavigationTransition
  navigateTo: (sceneId: MapSceneId, currentCamera: ScopeCameraSnapshot) => ScopeNavigationTransition | null
}

function assertCamera(camera: ScopeCameraSnapshot): void {
  if (
    !Number.isFinite(camera.x) ||
    !Number.isFinite(camera.y) ||
    !Number.isFinite(camera.scale) ||
    camera.scale <= 0
  ) {
    throw new Error('相机快照包含无效坐标或缩放比例。')
  }
}

function copyCamera(camera: ScopeCameraSnapshot): ScopeCameraSnapshot {
  assertCamera(camera)
  return { ...camera }
}

function buildInitialPath(sceneId: MapSceneId): MapSceneId[] {
  const path: MapSceneId[] = []
  const visited = new Set<MapSceneId>()
  let current: MapScene | undefined = sceneCatalog[sceneId]

  while (current && !visited.has(current.id)) {
    path.push(current.id)
    visited.add(current.id)
    current = current.parentSceneId ? sceneCatalog[current.parentSceneId] : undefined
  }

  return path.reverse()
}

export function useScopeNavigation(
  options: UseScopeNavigationOptions = {},
): ScopeNavigationResult {
  const initialSceneId = options.initialSceneId ?? 'root'
  const [scopePath, setScopePath] = useState<readonly MapSceneId[]>(() => buildInitialPath(initialSceneId))
  const [cameraSnapshots, setCameraSnapshots] = useState<Partial<Record<MapSceneId, ScopeCameraSnapshot>>>(() => (
    options.initialCamera ? { [initialSceneId]: copyCamera(options.initialCamera) } : {}
  ))

  const activeSceneId = scopePath[scopePath.length - 1] ?? 'root'
  const activeScene = sceneCatalog[activeSceneId]
  const path = useMemo(() => scopePath.map((sceneId) => sceneCatalog[sceneId]), [scopePath])

  const storeCamera = useCallback((sceneId: MapSceneId, camera: ScopeCameraSnapshot): void => {
    const snapshot = copyCamera(camera)
    setCameraSnapshots((current) => ({ ...current, [sceneId]: snapshot }))
  }, [])

  const saveCamera = useCallback((camera: ScopeCameraSnapshot): void => {
    storeCamera(activeSceneId, camera)
  }, [activeSceneId, storeCamera])

  const enter = useCallback((
    sceneId: MapSceneId,
    currentCamera: ScopeCameraSnapshot,
  ): ScopeNavigationTransition | null => {
    const target = getMapScene(sceneId)
    if (!target || target.parentSceneId !== activeSceneId) return null

    storeCamera(activeSceneId, currentCamera)
    setScopePath((current) => [...current, sceneId])
    return { scene: target, camera: cameraSnapshots[sceneId] ? copyCamera(cameraSnapshots[sceneId]) : null }
  }, [activeSceneId, cameraSnapshots, storeCamera])

  const navigateTo = useCallback((
    sceneId: MapSceneId,
    currentCamera: ScopeCameraSnapshot,
  ): ScopeNavigationTransition | null => {
    const targetIndex = scopePath.indexOf(sceneId)
    if (targetIndex < 0) return null

    const target = sceneCatalog[sceneId]
    storeCamera(activeSceneId, currentCamera)
    setScopePath((current) => current.slice(0, targetIndex + 1))
    return { scene: target, camera: cameraSnapshots[sceneId] ? copyCamera(cameraSnapshots[sceneId]) : null }
  }, [activeSceneId, cameraSnapshots, scopePath, storeCamera])

  const exit = useCallback((currentCamera: ScopeCameraSnapshot): ScopeNavigationTransition | null => {
    if (scopePath.length <= 1) return null
    return navigateTo(scopePath[scopePath.length - 2], currentCamera)
  }, [navigateTo, scopePath])

  const root = useCallback((currentCamera: ScopeCameraSnapshot): ScopeNavigationTransition => {
    const transition = navigateTo('root', currentCamera)
    return transition ?? { scene: sceneCatalog.root, camera: null }
  }, [navigateTo])

  return {
    activeScene,
    activeSceneId,
    path,
    depth: scopePath.length - 1,
    canExit: scopePath.length > 1,
    cameraSnapshots,
    saveCamera,
    enter,
    exit,
    root,
    navigateTo,
  }
}
