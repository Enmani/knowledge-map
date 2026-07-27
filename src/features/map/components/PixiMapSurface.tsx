import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react'
import type { CameraTransform } from '../sceneEmbedding'
import type { MapSceneId } from '../sceneCatalog'
import {
  MapRenderKernel,
  type MapRenderFrame,
  type MapScopeEvent,
} from '../../../renderers/core'
import {
  PixiMapRenderer,
  type PixiHitTestResult,
  type PixiMapFrame,
  type PixiVisualState,
} from '../../../renderers/pixi'

export interface PixiMapSurfaceHandle {
  paintCamera: (camera: CameraTransform) => MapRenderFrame
  hitTest: (viewportX: number, viewportY: number) => PixiHitTestResult | null
  refresh: () => MapRenderFrame
}

export interface PixiMapSurfaceProps {
  camera: CameraTransform
  viewport: { width: number; height: number }
  panelOpen: boolean
  activeSceneId: MapSceneId
  pinnedChildSceneId: MapSceneId | null
  visualState: PixiVisualState
  onScopeEvent: (event: MapScopeEvent) => void
  onReady?: () => void
  onError?: (error: Error) => void
}

function toPixiFrame(frame: MapRenderFrame): PixiMapFrame {
  return {
    scenes: Object.fromEntries(frame.scenes.map((scene) => [scene.sceneId, {
      alpha: scene.alpha,
      markerAlpha: scene.markerAlpha,
      cardAlpha: scene.cardAlpha,
      interactive: scene.interactive,
      x: scene.worldTransform.x,
      y: scene.worldTransform.y,
      scale: scene.worldTransform.scale,
    }])) as PixiMapFrame['scenes'],
  }
}

export const PixiMapSurface = forwardRef<PixiMapSurfaceHandle, PixiMapSurfaceProps>(function PixiMapSurface({
  camera,
  viewport,
  panelOpen,
  activeSceneId,
  pinnedChildSceneId,
  visualState,
  onScopeEvent,
  onReady,
  onError,
}, ref) {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<PixiMapRenderer | null>(null)
  const lastFrameRef = useRef<MapRenderFrame | null>(null)
  const callbacksRef = useRef({ onScopeEvent, onReady, onError })
  callbacksRef.current = { onScopeEvent, onReady, onError }
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const visualStateRef = useRef(visualState)
  visualStateRef.current = visualState
  const kernelRef = useRef<MapRenderKernel | null>(null)

  if (!kernelRef.current) {
    kernelRef.current = new MapRenderKernel({
      initialState: {
        camera,
        viewport,
        panel: { open: panelOpen, width: 390 },
        activeSceneId,
        pinnedChildSceneId,
      },
    })
  }

  const presentFrame = useCallback(() => {
    const kernel = kernelRef.current!
    const frame = kernel.resolveFrame()
    lastFrameRef.current = frame
    const renderer = rendererRef.current
    if (renderer) {
      renderer.setCamera(frame.camera)
      renderer.applyFrame(toPixiFrame(frame))
    }
    if (frame.scopeEvent) callbacksRef.current.onScopeEvent(frame.scopeEvent)
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__MATH_ATLAS_RENDER__ = frame
    }
    return frame
  }, [])

  const measuredViewport = useCallback(() => {
    const bounds = hostRef.current?.getBoundingClientRect()
    return {
      width: Math.max(1, bounds?.width || viewportRef.current.width),
      height: Math.max(1, bounds?.height || viewportRef.current.height),
    }
  }, [])

  useImperativeHandle(ref, () => ({
    paintCamera(nextCamera) {
      kernelRef.current!.setCamera(nextCamera)
      return presentFrame()
    },
    hitTest(viewportX, viewportY) {
      return rendererRef.current?.hitTest(viewportX, viewportY) ?? null
    },
    refresh: presentFrame,
  }), [presentFrame])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    let disposed = false
    const abortController = new AbortController()
    const surfaceViewport = measuredViewport()

    void PixiMapRenderer.create({
      host,
      width: surfaceViewport.width,
      height: surfaceViewport.height,
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      backgroundAlpha: 0,
      signal: abortController.signal,
    }).then((renderer) => {
      if (disposed) {
        renderer.destroy()
        return
      }
      rendererRef.current = renderer
      renderer.updateVisualState(visualStateRef.current)
      presentFrame()
      callbacksRef.current.onReady?.()
    }).catch((cause: unknown) => {
      if (disposed) return
      const error = cause instanceof Error ? cause : new Error(String(cause))
      callbacksRef.current.onError?.(error)
    })

    return () => {
      disposed = true
      abortController.abort()
      rendererRef.current?.destroy()
      rendererRef.current = null
      if (import.meta.env.DEV) {
        delete (window as unknown as Record<string, unknown>).__MATH_ATLAS_RENDER__
      }
    }
  }, [measuredViewport, presentFrame])

  useLayoutEffect(() => {
    const surfaceViewport = measuredViewport()
    kernelRef.current!.update({
      viewport: surfaceViewport,
      panel: { open: panelOpen, width: 390 },
      activeSceneId,
      pinnedChildSceneId,
    })
    rendererRef.current?.resize(surfaceViewport.width, surfaceViewport.height)
    presentFrame()
  }, [activeSceneId, measuredViewport, panelOpen, pinnedChildSceneId, presentFrame, viewport])

  useLayoutEffect(() => {
    rendererRef.current?.updateVisualState(visualState)
  }, [visualState])

  return <div ref={hostRef} className="pixi-map-surface" data-renderer="pixi-webgl" />
})
