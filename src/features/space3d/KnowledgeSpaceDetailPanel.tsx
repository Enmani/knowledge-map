import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from 'react'
import { X } from 'lucide-react'
import { LinearAlgebraIcon } from '../concept-icons'
import type {
  KnowledgeSpaceNode,
  ScienceDomainDefinition,
} from '../../knowledge/space3d'

const HEADER_COLLAPSE_DISTANCE = 176

export function resolveDetailHeaderCollapseProgress(scrollTop: number): number {
  return Math.min(1, Math.max(0, scrollTop / HEADER_COLLAPSE_DISTANCE))
}

interface KnowledgeSpaceDetailPanelProps {
  node: KnowledgeSpaceNode
  domain: ScienceDomainDefinition
  relatedDomains: readonly ScienceDomainDefinition[]
  levelLabel: string
  onClose: () => void
  children: ReactNode
}

export function KnowledgeSpaceDetailPanel({
  node,
  domain,
  relatedDomains,
  levelLabel,
  onClose,
  children,
}: KnowledgeSpaceDetailPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const [collapseProgress, setCollapseProgress] = useState(0)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setCollapseProgress(0)
  }, [node.id])

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
  }, [])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      setCollapseProgress(resolveDetailHeaderCollapseProgress(scrollTop))
      frameRef.current = null
    })
  }

  const barProgress = Math.max(0, (collapseProgress - 0.28) / 0.72)
  const panelStyle = {
    '--panel-color': domain.color,
    '--detail-collapse': collapseProgress,
    '--detail-bar-progress': barProgress,
  } as CSSProperties

  const renderMark = (compact = false) => node.id === 'linear-algebra' ? (
    <LinearAlgebraIcon durationSeconds={2} repeatCount={1} />
  ) : (
    <span className={`knowledge-space-detail__domain-mark${compact ? ' is-compact' : ''}`}>
      {domain.shortLabel}
    </span>
  )

  return (
    <aside
      className="detail-panel knowledge-space-detail knowledge-space-detail--editorial"
      style={panelStyle}
    >
      <div className="knowledge-space-detail__topbar">
        <div className="knowledge-space-detail__compact-identity" aria-hidden="true">
          <div className="knowledge-space-detail__compact-mark">{renderMark(true)}</div>
          <strong>{node.title}</strong>
        </div>
        <button
          type="button"
          className="panel-close knowledge-space-detail__close"
          onClick={onClose}
          aria-label="关闭详情"
        >
          <X size={20} />
        </button>
      </div>

      <div className="knowledge-space-detail__viewport">
        <div
          ref={scrollRef}
          className="knowledge-space-detail__scroll"
          onScroll={handleScroll}
        >
          <header className="knowledge-space-detail__hero">
            <div className="knowledge-space-detail__hero-mark">
              {renderMark()}
            </div>
            <div className="knowledge-space-detail__hero-copy">
              <h1>{node.title}</h1>
              <p className="english-name">{node.englishTitle}</p>
              <div className="tag-cloud knowledge-space-detail__tags" aria-label="知识标签">
                {relatedDomains.map((relatedDomain) => (
                  <span
                    key={relatedDomain.id}
                    style={{ '--tag-color': relatedDomain.color } as CSSProperties}
                  >
                    {relatedDomain.label}
                  </span>
                ))}
                {node.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
              <p className="node-summary">{node.summary}</p>
            </div>
          </header>

          <div className="knowledge-space-detail__body">
            {children}
          </div>
        </div>
      </div>

      <footer className="knowledge-space-detail__footer" aria-label="知识卡片分类">
        <div className="knowledge-space-detail__footer-rule" aria-hidden="true" />
        <div className="knowledge-space-detail__corner-labels">
          <span>{domain.label}</span>
          <span>{levelLabel}</span>
        </div>
      </footer>
    </aside>
  )
}
