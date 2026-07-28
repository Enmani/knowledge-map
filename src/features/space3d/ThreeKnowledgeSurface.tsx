import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react'
import type { KnowledgeSpaceProjection } from '../../knowledge/space3d/types'
import {
  ThreeKnowledgeRenderer,
  type SpaceColorTheme,
  type ThreeKnowledgeCameraState,
  type ThreeKnowledgeSubspace,
} from '../../renderers/three'

export interface ThreeKnowledgeSurfaceHandle {
  resetCamera: (immediate?: boolean) => void
  focus: () => void
}

export interface ThreeKnowledgeSurfaceProps {
  projection: KnowledgeSpaceProjection
  selectedNodeId: string | null
  walkingMode?: boolean
  fieldsVisible?: boolean
  colorTheme?: SpaceColorTheme
  subspaces?: readonly ThreeKnowledgeSubspace[]
  onSelectNode: (nodeId: string) => void
  onBlankClick: () => void
  onCameraChange?: (state: ThreeKnowledgeCameraState) => void
  onScopeChange?: (subspaceId: string | null) => void
  onReady?: () => void
  onError?: (error: Error) => void
  className?: string
}

export const ThreeKnowledgeSurface = forwardRef<
  ThreeKnowledgeSurfaceHandle,
  ThreeKnowledgeSurfaceProps
>(function ThreeKnowledgeSurface({
  projection,
  selectedNodeId,
  walkingMode = false,
  fieldsVisible = true,
  colorTheme = 'light',
  subspaces = [],
  onSelectNode,
  onBlankClick,
  onCameraChange,
  onScopeChange,
  onReady,
  onError,
  className,
}, ref) {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<ThreeKnowledgeRenderer | null>(null)
  const callbacksRef = useRef({ onSelectNode, onBlankClick, onCameraChange, onScopeChange, onReady, onError })
  callbacksRef.current = { onSelectNode, onBlankClick, onCameraChange, onScopeChange, onReady, onError }

  useImperativeHandle(ref, () => ({
    resetCamera(immediate) {
      rendererRef.current?.resetCamera(immediate)
    },
    focus() {
      rendererRef.current?.focus()
    },
  }), [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    try {
      const renderer = new ThreeKnowledgeRenderer({
        host,
        projection,
        selectedNodeId,
        walkingMode,
        fieldsVisible,
        colorTheme,
        subspaces,
        onSelectNode: (nodeId) => callbacksRef.current.onSelectNode(nodeId),
        onBlankClick: () => callbacksRef.current.onBlankClick(),
        onCameraChange: (state) => callbacksRef.current.onCameraChange?.(state),
        onScopeChange: (subspaceId) => callbacksRef.current.onScopeChange?.(subspaceId),
      })
      rendererRef.current = renderer
      callbacksRef.current.onReady?.()
    } catch (cause: unknown) {
      const error = cause instanceof Error ? cause : new Error(String(cause))
      callbacksRef.current.onError?.(error)
    }

    return () => {
      rendererRef.current?.destroy()
      rendererRef.current = null
    }
    // The renderer owns the retained scene. Prop changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    rendererRef.current?.setProjection(projection)
  }, [projection])

  useLayoutEffect(() => {
    rendererRef.current?.setSelectedNodeId(selectedNodeId)
  }, [selectedNodeId])

  useLayoutEffect(() => {
    rendererRef.current?.setWalkingMode(walkingMode)
  }, [walkingMode])

  useLayoutEffect(() => {
    rendererRef.current?.setFieldsVisible(fieldsVisible)
  }, [fieldsVisible])

  useLayoutEffect(() => {
    rendererRef.current?.setColorTheme(colorTheme)
  }, [colorTheme])

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const resize = () => {
      const bounds = host.getBoundingClientRect()
      rendererRef.current?.resize(bounds.width, bounds.height)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    return () => observer.disconnect()
  }, [])

  const classes = ['three-knowledge-surface', className].filter(Boolean).join(' ')
  return <div ref={hostRef} className={classes} data-renderer="three-webgl" />
})
