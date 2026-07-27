import { ArrowLeft, ChevronRight, Home } from 'lucide-react'
import { useEffect } from 'react'
import type { MapScene, MapSceneId } from '../sceneCatalog'
import './ScopeBreadcrumbs.css'

export interface ScopeBreadcrumbsProps {
  path: readonly MapScene[]
  onNavigate: (sceneId: MapSceneId) => void
  onExit: () => void
  onRoot: () => void
  listenForEscape?: boolean
  className?: string
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export const ScopeBreadcrumbs: React.FC<ScopeBreadcrumbsProps> = ({
  path,
  onNavigate,
  onExit,
  onRoot,
  listenForEscape = false,
  className,
}) => {
  const canExit = path.length > 1

  useEffect(() => {
    if (!listenForEscape || !canExit) return undefined

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || isEditableTarget(event.target)) return
      event.preventDefault()
      event.stopPropagation()
      onExit()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [canExit, listenForEscape, onExit])

  return (
    <nav className={['scope-breadcrumbs', className].filter(Boolean).join(' ')} aria-label="地图层级">
      <button
        className="scope-breadcrumbs__back"
        type="button"
        onClick={onExit}
        disabled={!canExit}
        aria-label="返回上一级地图"
        title={canExit ? '返回上一级地图（Esc）' : '当前位于根地图'}
      >
        <ArrowLeft size={15} aria-hidden="true" />
      </button>

      <button
        className="scope-breadcrumbs__home"
        type="button"
        onClick={onRoot}
        disabled={!canExit}
        aria-label="返回数学全景"
        title="返回数学全景"
      >
        <Home size={13} aria-hidden="true" />
      </button>

      <ol className="scope-breadcrumbs__path">
        {path.map((scene, index) => {
          const isCurrent = index === path.length - 1
          return (
            <li key={scene.id} className="scope-breadcrumbs__item">
              {index > 0 && <ChevronRight className="scope-breadcrumbs__separator" size={12} aria-hidden="true" />}
              {isCurrent ? (
                <span className="scope-breadcrumbs__current" aria-current="page">{scene.title}</span>
              ) : (
                <button type="button" onClick={() => onNavigate(scene.id)}>{scene.title}</button>
              )}
            </li>
          )
        })}
      </ol>

      <span className="scope-breadcrumbs__depth">第 {path.length} 层</span>
    </nav>
  )
}
