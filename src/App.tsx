import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Focus,
  LockKeyhole,
  Map as MapIcon,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { interpolateZoom, type ZoomView } from 'd3-interpolate'
import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { frontierStatusLabels, getKnowledgeContentForConcept } from './content'
import {
  domainById,
  domains,
  levelNames,
  tagFields,
  type DomainId,
  type FieldTagId,
  type MathNode,
} from './data/mathMap'
import {
  DEFAULT_LOD_POLICY,
  resolveRevealScope,
} from './engine/lod/semanticLod'
import {
  completeInteraction,
  createProgressStore,
  advanceConceptProgress,
  getConceptProgress,
  setProgressMode,
  type ProgressStoreState,
} from './engine/progression/progressStore'
import { getFogVisibility } from './engine/progression/fogVisibility'
import { evaluateConceptUnlock, getRequiredPrerequisiteIds } from './engine/progression/unlock'
import {
  getChildScene,
  mapScenePointToRoot,
  ScopeBreadcrumbs,
  knowledgeAtlas,
  knownConceptIds,
  sceneBoundsInRoot,
  sceneCatalog,
  sceneScaleInRoot,
  sceneTransformInRoot,
  type MapScene,
  type MapSceneId,
  type SceneEmbedding,
  useScopeNavigation,
} from './features/map'
import {
  PixiMapSurface,
  type PixiMapSurfaceHandle,
} from './features/map/components/PixiMapSurface'
import { fieldColor } from './lib/tagLayout'
import { loadProgressFromStorage, saveProgressToStorage } from './persistence/progressStorage'
import type { PixiHitTestResult, PixiVisualState } from './renderers/pixi'
import { WidgetRenderer } from './widgets'
import {
  completeWheelZoom,
  createWheelZoomGesture,
  createZoomTarget,
  dampWheelZoom,
  isWheelZoomSettled,
  MINIMUM_SCALE,
  wheelScaleFactor,
  type WheelZoomGesture,
} from './features/map/wheelZoom'

type Transform = { x: number; y: number; scale: number }
type LearningStatus = 'mastered' | 'available' | 'locked'
type SceneSelectionContext = {
  upstream: ReadonlySet<string>
  nextUnlockIds: ReadonlySet<string>
}
type PanPointer = {
  id: number
  startX: number
  startY: number
  lastX: number
  lastY: number
  dragged: boolean
  captureTarget: Element
  previousCursor: string | null
}

const PAN_THRESHOLD = 5
const STARTER_PROGRESS = ['numbers', 'logic', 'sets', 'proof', 'functions', 'elementary-algebra']
const EMPTY_ID_SET: ReadonlySet<string> = new Set<string>()
const atlasNodeIndex: Readonly<Record<string, MathNode>> = Object.fromEntries(
  Object.values(sceneCatalog).flatMap((scene) => scene.nodes.map((node) => [node.id, node])),
)

function getInitialProgress(): ProgressStoreState {
  return loadProgressFromStorage(window.localStorage, knownConceptIds, {
    fallbackMode: 'free',
    fallbackProgress: STARTER_PROGRESS.map((conceptId) => ({ conceptId, level: 'mastered' as const })),
  }).state
}

function getPrerequisiteClosure(id: string, nodeIndex: Readonly<Record<string, MathNode>>, result = new Set<string>()) {
  const node = nodeIndex[id]
  if (!node) return result
  node.prerequisites.forEach((prerequisite) => {
    if (result.has(prerequisite)) return
    result.add(prerequisite)
    getPrerequisiteClosure(prerequisite, nodeIndex, result)
  })
  return result
}

function buildSceneSelectionContext(scene: MapScene, selectedId: string | null): SceneSelectionContext {
  if (!selectedId || !scene.nodeIndex[selectedId]) {
    return {
      upstream: EMPTY_ID_SET,
      nextUnlockIds: EMPTY_ID_SET,
    }
  }

  const upstream = getPrerequisiteClosure(selectedId, scene.nodeIndex)
  const nextUnlockIds = new Set(
    scene.nodes.filter((node) => node.prerequisites.includes(selectedId)).map((node) => node.id),
  )
  return { upstream, nextUnlockIds }
}

function cameraForNode(scene: MapScene, nodeId: string, viewport: { width: number; height: number }, scale = 0.92): Transform {
  const position = scene.layout.positions[nodeId]
  const sceneScale = sceneScaleInRoot(scene.id)
  const center = mapScenePointToRoot(scene.id, {
    x: position.x + scene.nodeWidth / 2,
    y: position.y + scene.nodeHeight / 2,
  })
  const rootScale = scale / sceneScale
  const panelWidth = viewport.width > 800 ? 390 : 0
  return {
    scale: rootScale,
    x: (viewport.width - panelWidth) / 2 - center.x * rootScale,
    y: viewport.height / 2 - center.y * rootScale,
  }
}

function cameraViewportSize(viewport: { width: number; height: number }, panelOpen: boolean) {
  return {
    width: viewport.width > 800 && panelOpen ? viewport.width - 390 : viewport.width,
    height: viewport.height,
  }
}

function transformToZoomView(transform: Transform, viewport: { width: number; height: number }): ZoomView {
  return [
    (viewport.width / 2 - transform.x) / transform.scale,
    (viewport.height / 2 - transform.y) / transform.scale,
    viewport.width / transform.scale,
  ]
}

function zoomViewToTransform(view: ZoomView, viewport: { width: number; height: number }): Transform {
  const scale = viewport.width / view[2]
  return {
    scale,
    x: viewport.width / 2 - view[0] * scale,
    y: viewport.height / 2 - view[1] * scale,
  }
}

function cameraForPortal(
  parentScene: MapScene,
  ownerNodeId: string,
  scale: number,
  viewport: { width: number; height: number },
): Transform {
  const ownerPosition = parentScene.layout.positions[ownerNodeId]
  const parentScale = sceneScaleInRoot(parentScene.id)
  const ownerCenter = mapScenePointToRoot(parentScene.id, {
    x: ownerPosition.x + parentScene.nodeWidth / 2,
    y: ownerPosition.y + parentScene.nodeHeight / 2,
  })
  const contentViewportWidth = viewport.width > 800 ? viewport.width - 390 : viewport.width
  const rootScale = scale / parentScale
  return {
    scale: rootScale,
    x: contentViewportWidth / 2 - ownerCenter.x * rootScale,
    y: viewport.height / 2 - ownerCenter.y * rootScale,
  }
}

function App() {
  const pixiSurfaceRef = useRef<PixiMapSurfaceHandle>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const zoomValueRef = useRef<HTMLSpanElement>(null)
  const lastZoomPercentRef = useRef<number | null>(null)
  const pointerRef = useRef<PanPointer | null>(null)
  const panDeltaRef = useRef({ x: 0, y: 0 })
  const panFrameRef = useRef<number | null>(null)
  const clickResetTimerRef = useRef<number | null>(null)
  const cameraAnimationFrameRef = useRef<number | null>(null)
  const wheelZoomTargetRef = useRef<WheelZoomGesture | null>(null)
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 })
  const scopeTransitionHandlerRef = useRef<((revealProgress: number, embedding: SceneEmbedding) => void) | null>(null)
  const pendingScopeRequestRef = useRef<string | null>(null)
  const portalCooldownRef = useRef(false)
  const suppressNextCanvasClickRef = useRef(false)
  const navigation = useScopeNavigation()
  const { activeScene, activeSceneId } = navigation
  const [transform, setTransform] = useState<Transform>(() => {
    const initialTransform = cameraForNode(activeScene, activeScene.initialNodeId, {
      width: window.innerWidth,
      height: window.innerHeight + 66,
    }, 0.72)
    transformRef.current = initialTransform
    return initialTransform
  })
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [selectedId, setSelectedId] = useState<string | null>(activeScene.initialNodeId)
  const [progressStore, setProgressStore] = useState<ProgressStoreState>(getInitialProgress)
  const [activeDomains, setActiveDomains] = useState<Set<DomainId>>(() => new Set(domains.map((d) => d.id)))
  const [activeTag, setActiveTag] = useState<FieldTagId | null>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [showIntro, setShowIntro] = useState(() => localStorage.getItem('math-atlas-intro') !== 'seen')
  const [completedWidgets, setCompletedWidgets] = useState<Set<string>>(() => new Set())
  const [pinnedChildSceneId, setPinnedChildSceneId] = useState<MapSceneId | null>(null)
  const [pixiFailure, setPixiFailure] = useState<Error | null>(null)
  const selectedChildScene = selectedId ? getChildScene(activeSceneId, selectedId) : undefined

  const sceneNodes = activeScene.nodes
  const nodeIndex = activeScene.nodeIndex
  const selectedNode = selectedId ? nodeIndex[selectedId] ?? null : null
  const selectedVisibility = selectedNode ? getFogVisibility(knowledgeAtlas, progressStore, selectedNode.id) : null
  const selectedContent = selectedNode ? getKnowledgeContentForConcept(selectedNode.id) : undefined
  const mastered = useMemo(() => new Set(
    [...progressStore.byConcept.values()]
      .filter((entry) => entry.level === 'mastered')
      .map((entry) => entry.conceptId),
  ), [progressStore])
  const selectedPrerequisiteIds = useMemo(
    () => (selectedId ? getRequiredPrerequisiteIds(knowledgeAtlas, selectedId) : []),
    [selectedId],
  )
  const selectedMissingPrerequisiteIds = useMemo(
    () => selectedPrerequisiteIds.filter((id) => !mastered.has(id)),
    [mastered, selectedPrerequisiteIds],
  )
  const directUnlocks = useMemo(
    () => (selectedId ? sceneNodes.filter((node) => node.prerequisites.includes(selectedId)) : []),
    [sceneNodes, selectedId],
  )
  const statusOf = useCallback(
    (node: MathNode): LearningStatus => {
      if (getConceptProgress(progressStore, node.id).level === 'mastered') return 'mastered'
      return evaluateConceptUnlock(knowledgeAtlas, progressStore, node.id).unlocked ? 'available' : 'locked'
    },
    [progressStore],
  )

  const availableNodes = useMemo(
    () => sceneNodes.filter((node) => statusOf(node) === 'available').sort((a, b) => a.level - b.level || a.x - b.x),
    [sceneNodes, statusOf],
  )

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return sceneNodes
      .filter((node) => getFogVisibility(knowledgeAtlas, progressStore, node.id).revealIdentity)
      .filter((node) =>
        [node.title, node.english, node.summary, ...node.fieldTags, ...node.tags].some((value) => value.toLowerCase().includes(normalized)),
      )
      .slice(0, 7)
  }, [progressStore, query, sceneNodes])

  const activeSceneSelectionContext = useMemo(
    () => buildSceneSelectionContext(activeScene, selectedId),
    [activeScene, selectedId],
  )
  const pixiVisualState = useMemo<PixiVisualState>(() => {
    const hiddenNodeIds = new Set<string>()
    const silhouetteNodeIds = new Set<string>()
    const mutedNodeIds = new Set<string>()
    const nonInteractiveNodeIds = new Set<string>()
    const statuses: Record<string, LearningStatus> = {}
    const normalizedQuery = query.trim().toLowerCase()

    Object.values(atlasNodeIndex).forEach((node) => {
      const visibility = getFogVisibility(knowledgeAtlas, progressStore, node.id)
      if (!visibility.includeInScene) hiddenNodeIds.add(node.id)
      else if (visibility.level === 'silhouette') silhouetteNodeIds.add(node.id)
      statuses[node.id] = statusOf(node)

      const searchMatch = !normalizedQuery || (
        visibility.revealIdentity &&
        [node.title, node.english, node.summary, ...node.fieldTags, ...node.tags]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
      const tagMatch = !activeTag || node.fieldTags.includes(activeTag)
      const matchesFilter = activeDomains.has(node.domain) && searchMatch && tagMatch
      if (!matchesFilter) {
        mutedNodeIds.add(node.id)
        nonInteractiveNodeIds.add(node.id)
      }
      if (!visibility.interactive) nonInteractiveNodeIds.add(node.id)
    })

    const pathNodeIds = new Set(activeSceneSelectionContext.upstream)
    const nextUnlockNodeIds = new Set(activeSceneSelectionContext.nextUnlockIds)
    const contextNodeIds = new Set<string>()
    if (selectedId) {
      activeScene.nodes.forEach((node) => {
        if (node.id !== selectedId && !pathNodeIds.has(node.id) && !nextUnlockNodeIds.has(node.id)) {
          contextNodeIds.add(node.id)
        }
      })
    }

    return {
      selectedSceneId: activeSceneId,
      selectedNodeId: selectedId,
      hiddenNodeIds,
      silhouetteNodeIds,
      pathNodeIds,
      contextNodeIds,
      nextUnlockNodeIds,
      mutedNodeIds,
      nonInteractiveNodeIds,
      highlightedNodeIds: pathNodeIds,
      statuses,
      activeDomains,
      activeFieldTag: activeTag,
    }
  }, [
    activeDomains,
    activeScene,
    activeSceneId,
    activeSceneSelectionContext,
    activeTag,
    progressStore,
    query,
    selectedId,
    statusOf,
  ])

  useEffect(() => {
    saveProgressToStorage(window.localStorage, progressStore)
  }, [progressStore])

  useEffect(() => {
    if (progressStore.mode === 'free' || !selectedNode) return
    const visibility = getFogVisibility(knowledgeAtlas, progressStore, selectedNode.id)
    if (visibility.interactive) return
    const fallback = sceneNodes.find((node) => getFogVisibility(knowledgeAtlas, progressStore, node.id).revealIdentity)
    setSelectedId(fallback?.id ?? null)
  }, [progressStore, sceneNodes, selectedNode])

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => () => {
    if (panFrameRef.current !== null) window.cancelAnimationFrame(panFrameRef.current)
    if (clickResetTimerRef.current !== null) window.clearTimeout(clickResetTimerRef.current)
    if (cameraAnimationFrameRef.current !== null) window.cancelAnimationFrame(cameraAnimationFrameRef.current)
  }, [])

  const paintCamera = useCallback((next: Transform, forceReactSync = false) => {
    transformRef.current = next
    const zoomPercent = Math.round(next.scale * 100)
    if (lastZoomPercentRef.current !== zoomPercent) {
      lastZoomPercentRef.current = zoomPercent
      if (zoomValueRef.current) zoomValueRef.current.textContent = `${zoomPercent}%`
    }
    pixiSurfaceRef.current?.paintCamera(next)
    if (forceReactSync) setTransform(next)
  }, [])

  useLayoutEffect(() => {
    pixiSurfaceRef.current?.paintCamera(transformRef.current)
  }, [activeSceneId, pinnedChildSceneId])

  const cancelCameraAnimation = useCallback(() => {
    wheelZoomTargetRef.current = null
    if (cameraAnimationFrameRef.current === null) return
    window.cancelAnimationFrame(cameraAnimationFrameRef.current)
    cameraAnimationFrameRef.current = null
    setTransform({ ...transformRef.current })
  }, [])

  const animateCameraTo = useCallback((target: Transform, durationMs?: number) => {
    cancelCameraAnimation()
    const start = { ...transformRef.current }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || (durationMs !== undefined && durationMs <= 0)) {
      paintCamera(target, true)
      return
    }

    const cameraViewport = cameraViewportSize(viewport, selectedId !== null)
    const interpolateView = interpolateZoom(
      transformToZoomView(start, cameraViewport),
      transformToZoomView(target, cameraViewport),
    )
    const resolvedDuration = durationMs ?? Math.min(650, Math.max(280, interpolateView.duration * 0.72))
    const startedAt = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / resolvedDuration)
      const eased = 1 - Math.pow(1 - progress, 4)
      const next = progress >= 1
        ? target
        : zoomViewToTransform(interpolateView(eased), cameraViewport)
      paintCamera(next, progress >= 1)
      if (progress < 1) {
        cameraAnimationFrameRef.current = window.requestAnimationFrame(step)
      } else {
        cameraAnimationFrameRef.current = null
      }
    }

    cameraAnimationFrameRef.current = window.requestAnimationFrame(step)
  }, [cancelCameraAnimation, paintCamera, selectedId, viewport])

  const zoomAt = useCallback((nextScale: number, screenX = viewport.width / 2, screenY = viewport.height / 2) => {
    setPinnedChildSceneId(null)
    cancelCameraAnimation()
    const current = transformRef.current
    const next = createZoomTarget(current, nextScale / current.scale, screenX, screenY)
    paintCamera(next, true)
  }, [cancelCameraAnimation, paintCamera, viewport])

  const fitMap = useCallback(() => {
    setPinnedChildSceneId(null)
    const sideAllowance = selectedId && viewport.width > 800 ? 420 : 0
    const usableWidth = viewport.width - sideAllowance
    const bounds = sceneBoundsInRoot(activeScene)
    const sceneScale = sceneScaleInRoot(activeScene.id)
    const scale = Math.max(
      MINIMUM_SCALE,
      Math.min(
        (usableWidth - 72) / bounds.width,
        (viewport.height - 100) / bounds.height,
        0.78 / sceneScale,
      ),
    )
    const next = {
      scale,
      x: 36 + (usableWidth - bounds.width * scale) / 2 - bounds.x * scale,
      y: 66 + (viewport.height - 66 - bounds.height * scale) / 2 - bounds.y * scale,
    }
    cancelCameraAnimation()
    paintCamera(next, true)
  }, [activeScene, cancelCameraAnimation, paintCamera, selectedId, viewport])

  const selectNode = useCallback((node: MathNode) => {
    if (statusOf(node) !== 'locked') {
      setProgressStore((current) => advanceConceptProgress(current, node.id, 'discovered', new Date().toISOString()))
    }
    setSelectedId(node.id)
    if (activeSceneId !== 'root') setPinnedChildSceneId(activeSceneId)
    setSearchOpen(false)
    setQuery('')
  }, [activeSceneId, statusOf])

  const closeDetails = useCallback(() => {
    setSelectedId(null)
  }, [])

  const applyNavigationTransition = useCallback((transition: ReturnType<typeof navigation.enter>) => {
    if (!transition) return
    const target = transition.scene
    setSelectedId(target.initialNodeId)
    setActiveTag(null)
    setSearchOpen(false)
    setQuery('')
  }, [])

  const enterChildScene = useCallback((sceneId: MapSceneId, selectedChildId?: string) => {
    const childScene = getChildScene(activeSceneId, sceneCatalog[sceneId]?.ownerNodeId ?? '')
    if (!childScene || childScene.id !== sceneId) return
    portalCooldownRef.current = false
    startTransition(() => {
      const transition = navigation.enter(sceneId, transformRef.current)
      if (!transition) return
      applyNavigationTransition(transition)
      if (selectedChildId) setSelectedId(selectedChildId)
    })
  }, [activeSceneId, applyNavigationTransition, navigation.enter])

  const selectPixiNode = useCallback((hit: PixiHitTestResult) => {
    const hitScene = sceneCatalog[hit.sceneId]
    const visibility = getFogVisibility(knowledgeAtlas, progressStore, hit.node.id)
    if (!hitScene || !visibility.interactive || pixiVisualState.nonInteractiveNodeIds?.has(hit.node.id)) return

    if (hit.sceneId === activeSceneId) {
      selectNode(hit.node)
      return
    }

    if (hitScene.parentSceneId !== activeSceneId) return
    if (statusOf(hit.node) !== 'locked') {
      setProgressStore((current) => advanceConceptProgress(
        current,
        hit.node.id,
        'discovered',
        new Date().toISOString(),
      ))
    }
    enterChildScene(hitScene.id, hit.node.id)
    setPinnedChildSceneId(hitScene.id)
    setSearchOpen(false)
    setQuery('')
  }, [activeSceneId, enterChildScene, pixiVisualState.nonInteractiveNodeIds, progressStore, selectNode, statusOf])

  const leaveScope = useCallback((manual: boolean) => {
    if (manual) {
      setPinnedChildSceneId(null)
      cancelCameraAnimation()
    }
    const applyExit = () => {
      const transition = navigation.exit(transformRef.current)
      if (!transition) return
      portalCooldownRef.current = manual
      applyNavigationTransition(transition)
      setSelectedId(activeScene.ownerNodeId ?? transition.scene.initialNodeId)
    }
    if (manual) applyExit()
    else startTransition(applyExit)
  }, [activeScene.ownerNodeId, applyNavigationTransition, cancelCameraAnimation, navigation.exit])

  const exitScope = useCallback(() => leaveScope(true), [leaveScope])

  const handleRevealScopeChange = useCallback((revealProgress: number, embedding: SceneEmbedding) => {
    const childScene = sceneCatalog[embedding.childSceneId]
    if (!childScene) return
    const currentScope = activeSceneId === childScene.id ? 'child' : 'parent'
    const nextScope = resolveRevealScope(currentScope, revealProgress)
    if (currentScope === nextScope) {
      pendingScopeRequestRef.current = null
      if (currentScope === 'parent' && revealProgress < DEFAULT_LOD_POLICY.scopeExitOpacity) {
        portalCooldownRef.current = false
      }
      return
    }

    const requestKey = `${childScene.id}:${nextScope}`
    if (pendingScopeRequestRef.current === requestKey) return
    if (currentScope === 'parent' && portalCooldownRef.current) return
    pendingScopeRequestRef.current = requestKey
    if (nextScope === 'child') enterChildScene(childScene.id)
    else leaveScope(false)
  }, [activeSceneId, enterChildScene, leaveScope])

  scopeTransitionHandlerRef.current = handleRevealScopeChange

  useEffect(() => {
    pendingScopeRequestRef.current = null
  }, [activeSceneId])

  const goRoot = useCallback(() => {
    setPinnedChildSceneId(null)
    cancelCameraAnimation()
    const transition = navigation.root(transformRef.current)
    portalCooldownRef.current = true
    applyNavigationTransition(transition)
    setSelectedId(navigation.path[1]?.ownerNodeId ?? transition.scene.initialNodeId)
  }, [applyNavigationTransition, cancelCameraAnimation, navigation.path, navigation.root])

  const navigateScope = useCallback((sceneId: MapSceneId) => {
    setPinnedChildSceneId(null)
    cancelCameraAnimation()
    const transition = navigation.navigateTo(sceneId, transformRef.current)
    if (!transition) return
    if (transition.scene.id === 'root') portalCooldownRef.current = true
    applyNavigationTransition(transition)
    const targetIndex = navigation.path.findIndex((scene) => scene.id === sceneId)
    setSelectedId(navigation.path[targetIndex + 1]?.ownerNodeId ?? transition.scene.initialNodeId)
  }, [applyNavigationTransition, cancelCameraAnimation, navigation.navigateTo, navigation.path])

  const revealSelectedChild = useCallback(() => {
    if (!selectedChildScene || !selectedId) return
    setSelectedId(selectedId)
    const lodViewportWidth = viewport.width > 800 ? viewport.width - 390 : viewport.width
    const shortViewportSide = Math.min(lodViewportWidth, viewport.height)
    const entryScale = (shortViewportSide * (DEFAULT_LOD_POLICY.enterViewportRatio + 0.015)) / activeScene.nodeHeight
    const targetEffectiveScale = Math.max(
      transformRef.current.scale * sceneScaleInRoot(activeScene.id),
      entryScale * DEFAULT_LOD_POLICY.portalButtonZoomMultiplier,
      DEFAULT_LOD_POLICY.revealEndScale / activeScene.cardScale,
    )
    animateCameraTo(cameraForPortal(activeScene, selectedId, targetEffectiveScale, viewport))
  }, [activeScene, animateCameraTo, selectedChildScene, selectedId, viewport])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).tagName === 'INPUT') {
        if (event.key === 'Escape') {
          searchRef.current?.blur()
          setSearchOpen(false)
          setQuery('')
        }
        return
      }
      if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      } else if (event.key === 'Escape') {
        if (navigation.canExit) exitScope()
        else closeDetails()
      } else if (event.key === '+' || event.key === '=') {
        zoomAt(transformRef.current.scale * 1.2)
      } else if (event.key === '-') {
        zoomAt(transformRef.current.scale / 1.2)
      } else if (event.key === '0') {
        fitMap()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeDetails, exitScope, fitMap, navigation.canExit, zoomAt])

  const schedulePan = () => {
    if (panFrameRef.current !== null) return
    panFrameRef.current = window.requestAnimationFrame(() => {
      panFrameRef.current = null
      const delta = panDeltaRef.current
      if (!delta.x && !delta.y) return
      panDeltaRef.current = { x: 0, y: 0 }
      const current = transformRef.current
      paintCamera({ ...current, x: current.x + delta.x, y: current.y + delta.y })
    })
  }

  const onPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary || pointerRef.current) return
    cancelCameraAnimation()

    const captureTarget = event.currentTarget
    const previousCursor = captureTarget instanceof HTMLElement ? captureTarget.style.cursor : null

    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      dragged: false,
      captureTarget,
      previousCursor,
    }

    try {
      captureTarget.setPointerCapture(event.pointerId)
    } catch {
      // The pointer can end between pointerdown and capture in unusual browser/OS paths.
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return

    if (!pointer.dragged) {
      const distance = Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY)
      if (distance < PAN_THRESHOLD) return
      pointer.dragged = true
      event.currentTarget.classList.add('is-panning')
      if (pointer.captureTarget instanceof HTMLElement) pointer.captureTarget.style.cursor = 'grabbing'
    }

    event.preventDefault()
    panDeltaRef.current.x += event.clientX - pointer.lastX
    panDeltaRef.current.y += event.clientY - pointer.lastY
    pointer.lastX = event.clientX
    pointer.lastY = event.clientY
    schedulePan()
  }

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    pointerRef.current = null
    event.currentTarget.classList.remove('is-panning')

    if (pointer.captureTarget instanceof HTMLElement && pointer.previousCursor !== null) {
      pointer.captureTarget.style.cursor = pointer.previousCursor
    }

    try {
      if (pointer.captureTarget.hasPointerCapture(event.pointerId)) {
        pointer.captureTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Pointer capture may already have been released by the browser.
    }

    if (pointer.dragged) {
      if (panFrameRef.current !== null) {
        window.cancelAnimationFrame(panFrameRef.current)
        panFrameRef.current = null
      }
      const delta = panDeltaRef.current
      panDeltaRef.current = { x: 0, y: 0 }
      const current = transformRef.current
      paintCamera({ ...current, x: current.x + delta.x, y: current.y + delta.y }, true)
      suppressNextCanvasClickRef.current = true
      if (clickResetTimerRef.current !== null) window.clearTimeout(clickResetTimerRef.current)
      clickResetTimerRef.current = window.setTimeout(() => {
        suppressNextCanvasClickRef.current = false
        clickResetTimerRef.current = null
      }, 0)
    }
  }

  const onCanvasClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextCanvasClickRef.current) {
      suppressNextCanvasClickRef.current = false
      if (clickResetTimerRef.current !== null) {
        window.clearTimeout(clickResetTimerRef.current)
        clickResetTimerRef.current = null
      }
      event.preventDefault()
      event.stopPropagation()
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const hit = pixiSurfaceRef.current?.hitTest(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    )
    if (hit) {
      event.preventDefault()
      event.stopPropagation()
      selectPixiNode(hit)
      return
    }

    if (!selectedId) return
    const target = event.target instanceof Element ? event.target : null
    if (!target || target.closest('button, a, input, textarea, select, [role="button"], [role="slider"], [contenteditable="true"]')) return
    closeDetails()
  }

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    setPinnedChildSceneId(null)
    const factor = wheelScaleFactor(event.deltaY, event.deltaMode, event.ctrlKey)
    const bounds = event.currentTarget.getBoundingClientRect()
    const screenX = event.clientX - bounds.left
    const screenY = event.clientY - bounds.top
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      zoomAt(transformRef.current.scale * factor, screenX, screenY)
      return
    }

    if (wheelZoomTargetRef.current === null) cancelCameraAnimation()
    wheelZoomTargetRef.current = createWheelZoomGesture(
      transformRef.current,
      wheelZoomTargetRef.current,
      factor,
      screenX,
      screenY,
    )
    if (cameraAnimationFrameRef.current !== null) return

    let previousTime = performance.now()
    const step = (now: number) => {
      const target = wheelZoomTargetRef.current
      if (!target) {
        cameraAnimationFrameRef.current = null
        return
      }

      const next = dampWheelZoom(transformRef.current, target, Math.min(48, now - previousTime))
      previousTime = now
      if (isWheelZoomSettled(next, target)) {
        const completed = completeWheelZoom(target)
        wheelZoomTargetRef.current = null
        cameraAnimationFrameRef.current = null
        paintCamera(completed, true)
        return
      }

      paintCamera(next)
      cameraAnimationFrameRef.current = window.requestAnimationFrame(step)
    }

    cameraAnimationFrameRef.current = window.requestAnimationFrame(step)
  }

  const toggleDomain = (id: DomainId) => {
    setActiveDomains((current) => {
      const next = new Set(current)
      if (next.has(id) && next.size > 1) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleMastered = (node: MathNode) => {
    const status = statusOf(node)
    if (status === 'locked' || status === 'mastered') return
    setProgressStore((current) => advanceConceptProgress(current, node.id, 'mastered', new Date().toISOString()))
  }

  const resetProgress = () => {
    setProgressStore(createProgressStore(progressStore.mode, STARTER_PROGRESS.map((conceptId) => ({ conceptId, level: 'mastered' }))))
    if (activeSceneId === 'root') setSelectedId(sceneCatalog.root.initialNodeId)
    else goRoot()
  }

  const toggleProgressMode = () => {
    setProgressStore((current) => setProgressMode(current, current.mode === 'free' ? 'exploration' : 'free'))
    setActiveTag(null)
  }

  const goNext = () => {
    const next = availableNodes[0]
    if (next) selectNode(next)
  }

  const closeIntro = () => {
    setShowIntro(false)
    localStorage.setItem('math-atlas-intro', 'seen')
  }

  const sceneMasteredCount = sceneNodes.filter((node) => mastered.has(node.id)).length
  const progress = Math.round((sceneMasteredCount / sceneNodes.length) * 100)
  const activeSceneTransform = sceneTransformInRoot(activeSceneId)
  const minimapTransform = {
    x: transform.x + transform.scale * activeSceneTransform.x,
    y: transform.y + transform.scale * activeSceneTransform.y,
    scale: transform.scale * activeSceneTransform.scale,
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="数域数学地图">
          <div className="brand-mark">M</div>
          <div>
            <strong>数域</strong>
            <span>MATHEMATICAL ATLAS</span>
          </div>
        </div>

        <div className="search-wrap">
          <Search size={17} strokeWidth={1.8} />
          <input
            ref={searchRef}
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setSearchOpen(true) }}
            placeholder="寻找一个知识点…"
            aria-label={`搜索${activeScene.title}知识`}
          />
          <kbd>/</kbd>
          {searchOpen && query && (
            <div className="search-results">
              {searchResults.length ? searchResults.map((node) => (
                <button key={node.id} onClick={() => selectNode(node)}>
                  <span className="result-symbol" style={{ color: domainById[node.domain].color }}>
                    {domainById[node.domain].symbol}
                  </span>
                  <span><strong>{node.title}</strong><small>{domainById[node.domain].name} · {levelNames[node.level]}</small></span>
                  <ChevronRight size={15} />
                </button>
              )) : <p className="no-result">地图上还没有这个知识点</p>}
            </div>
          )}
        </div>

        <div className="top-actions">
          <button className="quiet-button desktop-only" onClick={() => setShowLegend((value) => !value)}>
            <CircleHelp size={17} /> 图例
          </button>
          <button className="next-button" onClick={goNext} disabled={!availableNodes.length}>
            <Compass size={17} /> 下一站
          </button>
        </div>
      </header>

      <ScopeBreadcrumbs
        path={navigation.path}
        onNavigate={navigateScope}
        onExit={exitScope}
        onRoot={goRoot}
      />

      <aside className="domain-rail" aria-label="数学领域筛选">
        <div className="rail-heading">
          <span>领域</span>
          <small>{activeDomains.size}/7</small>
        </div>
        {domains.map((domain) => (
          <button
            key={domain.id}
            className={activeDomains.has(domain.id) ? 'active' : ''}
            style={{ '--domain-color': domain.color } as React.CSSProperties}
            onClick={() => toggleDomain(domain.id)}
            title={`显示或隐藏${domain.name}`}
          >
            <span className="domain-symbol">{domain.symbol}</span>
            <span>{domain.name}</span>
          </button>
        ))}
        <div className="rail-progress">
          <div><span>探索进度</span><strong>{progress}%</strong></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <small>{sceneMasteredCount} / {sceneNodes.length} 个知识点</small>
        </div>
        <div className="field-status">
          <span className="field-status-icon"><Sparkles size={13} /></span>
          <span><strong>{activeTag ? `#${activeTag}` : activeScene.title}</strong><small>自动生成 · {activeScene.layout.fields.length} 个场</small></span>
          {activeTag && <button onClick={() => setActiveTag(null)} aria-label="显示全部标签场域"><X size={12} /></button>}
        </div>
        <button className="mode-toggle" onClick={toggleProgressMode}>
          <Compass size={13} /> {progressStore.mode === 'free' ? '切换到探索模式' : '切换到自由模式'}
        </button>
      </aside>

      <div
        className="canvas"
        style={{ userSelect: 'none' }}
        onPointerDownCapture={onPointerDownCapture}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onLostPointerCapture={endPan}
        onClickCapture={onCanvasClickCapture}
        onDragStart={(event) => event.preventDefault()}
        onWheel={onWheel}
      >
        <div className="paper-grain" />
        {pixiFailure ? (
          <section className="map-render-error" role="alert">
            <strong>地图无法启动</strong>
            <p>当前浏览器没有成功创建 WebGL 渲染器。</p>
            <small>{pixiFailure.message}</small>
            <button onClick={() => setPixiFailure(null)}>重新尝试</button>
          </section>
        ) : (
          <PixiMapSurface
            ref={pixiSurfaceRef}
            camera={transformRef.current}
            viewport={viewport}
            panelOpen={selectedId !== null}
            activeSceneId={activeSceneId}
            pinnedChildSceneId={pinnedChildSceneId}
            visualState={pixiVisualState}
            onScopeEvent={(event) => {
              scopeTransitionHandlerRef.current?.(event.revealProgress, event.embedding)
            }}
            onReady={() => pixiSurfaceRef.current?.paintCamera(transformRef.current)}
            onError={(error) => {
              console.error('PixiJS WebGL 地图初始化失败。', error)
              setPixiFailure(error)
            }}
          />
        )}
      </div>

      <div className="zoom-controls" aria-label="画布控制">
        <button onClick={() => zoomAt(transformRef.current.scale * 1.2)} title="放大"><Plus size={18} /></button>
        <span ref={zoomValueRef}>{Math.round(transform.scale * 100)}%</span>
        <button onClick={() => zoomAt(transformRef.current.scale / 1.2)} title="缩小"><Minus size={18} /></button>
        <i />
        <button onClick={fitMap} title="显示全部"><Focus size={18} /></button>
      </div>

      <MiniMap scene={activeScene} transform={minimapTransform} viewport={viewport} activeTag={activeTag} onNavigate={(x, y) => {
        const rootPoint = mapScenePointToRoot(activeSceneId, { x, y })
        cancelCameraAnimation()
        const current = transformRef.current
        paintCamera({
          ...current,
          x: viewport.width / 2 - rootPoint.x * current.scale,
          y: viewport.height / 2 - rootPoint.y * current.scale,
        }, true)
      }} />

      {selectedNode && selectedVisibility?.revealContent && (
        <aside className="detail-panel" style={{ '--panel-color': domainById[selectedNode.domain].color } as React.CSSProperties}>
          <div className="panel-ruler" />
          <button className="panel-close" onClick={closeDetails} aria-label="关闭详情"><X size={19} /></button>
          <div className="panel-domain">
            <span>{domainById[selectedNode.domain].symbol}</span>
            {domainById[selectedNode.domain].name} · {levelNames[selectedNode.level]}
          </div>
          <h1>{selectedNode.title}</h1>
          <p className="english-name">{selectedNode.english}</p>
          <p className="node-summary">{selectedNode.summary}</p>

          <div className="why-block">
            <Sparkles size={17} />
            <div><small>为什么学它</small><p>{selectedNode.why}</p></div>
          </div>

          {selectedChildScene && (
            <button className="enter-scope-button" onClick={revealSelectedChild}>
              放大查看{selectedNode.title}内部 <ChevronRight size={16} />
              <small>镜头会沿当前画布连续深入</small>
            </button>
          )}

          {selectedContent && (
            <section className="knowledge-story" aria-label="知识故事与内容来源">
              <div className="knowledge-story__heading">
                <span>知识故事</span>
                <small>{frontierStatusLabels[selectedContent.frontierStatus]}</small>
              </div>
              <p>{selectedContent.summary}</p>
              {selectedContent.storyParagraphs.map((paragraph) => <p key={paragraph.id}>{paragraph.text}</p>)}
              <details>
                <summary>内容来源与复核日期</summary>
                <ul>
                  {selectedContent.sources.map((source) => (
                    <li key={source.id}>
                      {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : <span>{source.title}</span>}
                      <small>{source.creators.join('、')}{source.publishedYear ? ` · ${source.publishedYear}` : ''}{source.locator ? ` · ${source.locator}` : ''}</small>
                    </li>
                  ))}
                </ul>
                <p>最近复核 {selectedContent.reviewedAt} · 下次复核 {selectedContent.reviewDue}</p>
              </details>
            </section>
          )}

          <div className="tag-cloud" aria-label="知识标签">
            {selectedNode.fieldTags.map((tag) => (
              <button
                key={tag}
                className={activeTag === tag ? 'active' : ''}
                style={{ '--tag-color': fieldColor(tag, tagFields) } as React.CSSProperties}
                onClick={() => setActiveTag((current) => current === tag ? null : tag)}
                title={`突出 #${tag} 场域`}
              >#{tag}</button>
            ))}
            {selectedNode.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>

          <section className="panel-section">
            <div className="section-heading">
              <span><ArrowLeft size={14} /> 前置知识</span>
              <small>{selectedPrerequisiteIds.length || '无'}</small>
            </div>
            {selectedPrerequisiteIds.length ? (
              <div className="relation-list">
                {selectedPrerequisiteIds.map((id) => {
                  const localPrerequisite = nodeIndex[id]
                  const prerequisite = localPrerequisite ?? atlasNodeIndex[id]
                  return (
                    <button
                      key={id}
                      onClick={() => localPrerequisite && selectNode(localPrerequisite)}
                      disabled={!localPrerequisite}
                      title={localPrerequisite ? undefined : '此前置知识位于其他子空间'}
                    >
                      <span className={`relation-state ${mastered.has(id) ? 'done' : ''}`}>
                        {mastered.has(id) ? <Check size={12} /> : <LockKeyhole size={11} />}
                      </span>
                      <span>{prerequisite?.title ?? id}<small>{prerequisite?.english ?? '其他子空间'}</small></span>
                      {localPrerequisite && <ChevronRight size={15} />}
                    </button>
                  )
                })}
              </div>
            ) : <p className="root-note">这是一个起点，不需要前置知识。</p>}
          </section>

          <section className="panel-section">
            <div className="section-heading">
              <span><ArrowRight size={14} /> 掌握后解锁</span>
              <small>{directUnlocks.length}</small>
            </div>
            {directUnlocks.length ? (
              <div className="unlock-chips">
                {directUnlocks.map((node) => <button key={node.id} onClick={() => selectNode(node)}>{node.title}</button>)}
              </div>
            ) : <p className="root-note">当前地图中的前沿终点。</p>}
          </section>

          {selectedContent?.widgetIds.map((widgetId) => (
            <section className="panel-section widget-section" key={widgetId}>
              <div className="section-heading">
                <span><Sparkles size={14} /> 互动讲解</span>
                <small>{completedWidgets.has(`${selectedNode.id}:${widgetId}`) ? '完成' : '进行中'}</small>
              </div>
              <WidgetRenderer
                widgetId={widgetId}
                conceptId={selectedNode.id}
                onComplete={(event) => {
                  setCompletedWidgets((current) => new Set(current).add(`${event.conceptId}:${event.widgetId}`))
                  setProgressStore((current) => completeInteraction(current, event.conceptId, event.widgetId, event.completedAt))
                }}
              />
            </section>
          ))}

          <div className="meta-row">
            <span>建议投入 <strong>{selectedNode.hours}h</strong></span>
            <span>{selectedNode.fieldTags.length} 个场域标签</span>
          </div>

          <button
            className={`master-button ${statusOf(selectedNode)}`}
            onClick={() => toggleMastered(selectedNode)}
            disabled={statusOf(selectedNode) !== 'available'}
          >
            {statusOf(selectedNode) === 'mastered' ? <><Check size={18} /> 已掌握</> :
              statusOf(selectedNode) === 'available' ? <><Compass size={18} /> 标记为已掌握</> :
                <><LockKeyhole size={17} /> 先完成 {selectedMissingPrerequisiteIds.length} 门前置</>}
          </button>
        </aside>
      )}

      {showLegend && (
        <div className="legend-popover">
          <div><span className="legend-node mastered"><Check size={11} /></span><p><strong>已掌握</strong><small>计入你的探索进度</small></p></div>
          <div><span className="legend-node available" /><p><strong>可以学习</strong><small>所有前置均已完成</small></p></div>
          <div><span className="legend-node locked"><LockKeyhole size={10} /></span><p><strong>尚未解锁</strong><small>沿连线补齐前置知识</small></p></div>
          <div><span className="legend-field" /><p><strong>自动标签场</strong><small>共享标签聚集，重叠颜色混合</small></p></div>
          <button onClick={resetProgress}><RotateCcw size={13} /> 重置示例进度</button>
        </div>
      )}

      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-card">
            <div className="intro-ornament">∴</div>
            <small>欢迎来到数域</small>
            <h2>从一处出发，<br />看见数学的全貌。</h2>
            <p>拖动画布探索各个领域。共享标签会聚成模糊场域；点开标签，可以看见它横跨数学的哪些分支。</p>
            <div className="intro-actions">
              <button onClick={closeIntro}>开始探索 <ArrowRight size={17} /></button>
              <span>滚轮缩放 · 拖拽移动 · / 搜索</span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function MiniMap({
  scene,
  transform,
  viewport,
  activeTag,
  onNavigate,
}: {
  scene: MapScene
  transform: Transform
  viewport: { width: number; height: number }
  activeTag: FieldTagId | null
  onNavigate: (x: number, y: number) => void
}) {
  const mapRef = useRef<SVGSVGElement>(null)
  const viewX = -transform.x / transform.scale
  const viewY = -transform.y / transform.scale
  const viewWidth = viewport.width / transform.scale
  const viewHeight = viewport.height / transform.scale

  return (
    <button
      className="minimap-wrap"
      title="点击小地图快速移动"
      onClick={(event) => {
        const rect = mapRef.current?.getBoundingClientRect()
        if (!rect) return
        onNavigate(((event.clientX - rect.left) / rect.width) * scene.worldWidth, ((event.clientY - rect.top) / rect.height) * scene.worldHeight)
      }}
    >
      <span><MapIcon size={12} /> {scene.title}</span>
      <svg ref={mapRef} viewBox={`0 0 ${scene.worldWidth} ${scene.worldHeight}`} preserveAspectRatio="none">
        <g className="minimap-fields">
          {scene.layout.fields.filter((field) => !activeTag || field.id === activeTag).flatMap((field) => [
            ...field.links.map((link, index) => (
              <line key={`${field.id}-link-${index}`} x1={link.from.x} y1={link.from.y} x2={link.to.x} y2={link.to.y} stroke={field.color} strokeWidth="180" strokeLinecap="round" />
            )),
            ...field.members.map((id) => {
              const position = scene.layout.positions[id]
              return <circle key={`${field.id}-${id}`} cx={position.x + scene.nodeWidth / 2} cy={position.y + scene.nodeHeight / 2} r="115" fill={field.color} />
            }),
          ])}
        </g>
        {scene.nodes.filter((node) => !activeTag || node.fieldTags.includes(activeTag)).map((node) => {
          const position = scene.layout.positions[node.id]
          return <circle key={node.id} cx={position.x + scene.nodeWidth / 2} cy={position.y + scene.nodeHeight / 2} r="24" fill={domainById[node.domain].color} />
        })}
        <rect className="minimap-viewport" x={viewX} y={viewY} width={viewWidth} height={viewHeight} />
      </svg>
    </button>
  )
}

export default App
