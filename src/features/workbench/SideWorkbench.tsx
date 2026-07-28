import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'

export const DEFAULT_WORKBENCH_WIDTH = 430
export const MIN_WORKBENCH_WIDTH = 340
export const MAX_WORKBENCH_WIDTH = 720
const MAP_MINIMUM_WIDTH = 360
const DESKTOP_BREAKPOINT = 900
const RESIZE_STEP = 24

type SideWorkbenchProps = {
  width: number
  label: string
  variant: 'detail' | 'frontier'
  dark?: boolean
  onWidthChange: (width: number) => void
  children: ReactNode
}

export function clampWorkbenchWidth(width: number, viewportWidth = window.innerWidth): number {
  const viewportMaximum = Math.max(MIN_WORKBENCH_WIDTH, viewportWidth - MAP_MINIMUM_WIDTH)
  return Math.round(Math.min(MAX_WORKBENCH_WIDTH, viewportMaximum, Math.max(MIN_WORKBENCH_WIDTH, width)))
}

export function SideWorkbench({
  width,
  label,
  variant,
  dark = false,
  onWidthChange,
  children,
}: SideWorkbenchProps) {
  const [resizing, setResizing] = useState(false)
  const resizingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const minimum = MIN_WORKBENCH_WIDTH
  const maximum = clampWorkbenchWidth(MAX_WORKBENCH_WIDTH)

  const updateFromPointer = useCallback((clientX: number) => {
    onWidthChange(clampWorkbenchWidth(window.innerWidth - clientX - 12))
  }, [onWidthChange])

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth <= DESKTOP_BREAKPOINT) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizingRef.current = true
    pointerIdRef.current = event.pointerId
    setResizing(true)
    updateFromPointer(event.clientX)
  }, [updateFromPointer])

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!resizingRef.current) return
    event.preventDefault()
    event.stopPropagation()
    updateFromPointer(event.clientX)
  }, [updateFromPointer])

  const stopResizing = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    resizingRef.current = false
    pointerIdRef.current = null
    setResizing(false)
  }, [])

  useEffect(() => {
    if (!resizing) return undefined
    const move = (event: globalThis.PointerEvent) => {
      if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return
      event.preventDefault()
      updateFromPointer(event.clientX)
    }
    const finish = (event: globalThis.PointerEvent) => {
      if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return
      resizingRef.current = false
      pointerIdRef.current = null
      setResizing(false)
    }
    window.addEventListener('pointermove', move, { capture: true, passive: false })
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', finish, true)
    return () => {
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', finish, true)
      window.removeEventListener('pointercancel', finish, true)
    }
  }, [resizing, updateFromPointer])

  const onResizeKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    let nextWidth: number | null = null
    if (event.key === 'ArrowLeft') nextWidth = width + RESIZE_STEP
    if (event.key === 'ArrowRight') nextWidth = width - RESIZE_STEP
    if (event.key === 'Home') nextWidth = minimum
    if (event.key === 'End') nextWidth = maximum
    if (nextWidth === null) return
    event.preventDefault()
    event.stopPropagation()
    onWidthChange(clampWorkbenchWidth(nextWidth))
  }, [maximum, minimum, onWidthChange, width])

  return (
    <div
      className={`side-workbench side-workbench--${variant} ${dark ? 'side-workbench--dark' : ''} ${resizing ? 'is-resizing' : ''}`}
      style={{ '--workbench-width': `${width}px` } as CSSProperties}
      aria-label={label}
    >
      <div
        className="side-workbench__resize"
        role="separator"
        aria-label="调整右侧卡片宽度"
        aria-orientation="vertical"
        aria-valuemin={minimum}
        aria-valuemax={maximum}
        aria-valuenow={width}
        tabIndex={0}
        title="拖拽调整宽度；也可使用左右方向键"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopResizing}
        onPointerCancel={stopResizing}
        onLostPointerCapture={() => {
          resizingRef.current = false
          pointerIdRef.current = null
          setResizing(false)
        }}
        onKeyDown={onResizeKeyDown}
      >
        <span aria-hidden="true" />
      </div>
      {children}
    </div>
  )
}
