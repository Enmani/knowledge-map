import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Radar,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  frontierCatalog,
  getFrontierSourcesForEntry,
  getLatestBreakthroughEntries,
  isDefaultFrontierEntry,
  isPublicFrontierEntry,
  prepareFrontierEntries,
  type FrontierDiscipline,
  type FrontierEntryKind,
} from '../../frontier'

const latestBreakthroughKind = 'latest-breakthrough' as const
type RadarKind = 'all' | FrontierEntryKind | typeof latestBreakthroughKind

type FrontierRadarProps = {
  open: boolean
  focusConceptId?: string | null
  focusConceptLabel?: string | null
  conceptLabels: Readonly<Record<string, string>>
  dark?: boolean
  onClose: () => void
  onClearFocus: () => void
  onLocateConcept: (conceptId: string) => void
  onVisibleConceptIdsChange: (conceptIds: readonly string[]) => void
}

const kindLabels: Readonly<Record<string, string>> = {
  'research-update': '研究进展',
  'open-problem': '开放问题',
  'historical-milestone': '历史已解决问题',
  [latestBreakthroughKind]: '最新进展',
  'award-overview': '奖项观察',
  'award-research': '获奖研究',
}

const kindColors: Readonly<Record<string, string>> = {
  'research-update': '#a64032',
  'open-problem': '#4d598a',
  'historical-milestone': '#8b6742',
  [latestBreakthroughKind]: '#a86324',
  'award-overview': '#9a6b24',
  'award-research': '#9a6b24',
}

const disciplineOrder: readonly FrontierDiscipline[] = [
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'interdisciplinary',
]

const disciplineLabels: Readonly<Record<FrontierDiscipline, string>> = {
  mathematics: '数学',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  interdisciplinary: '交叉学科',
}

const disciplineColors: Readonly<Record<FrontierDiscipline, string>> = {
  mathematics: '#496f9a',
  physics: '#8c5b8d',
  chemistry: '#a66c48',
  biology: '#507d6b',
  interdisciplinary: '#8a7445',
}

function formatFrontierDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

function tagLabel(tag: string): string {
  return tag === '菲尔兹奖' || tag === '诺贝尔奖' ? `🏅 ${tag}` : tag
}

export function FrontierRadar({
  open,
  focusConceptId = null,
  focusConceptLabel = null,
  conceptLabels,
  dark = false,
  onClose,
  onClearFocus,
  onLocateConcept,
  onVisibleConceptIdsChange,
}: FrontierRadarProps) {
  const [activeKind, setActiveKind] = useState<RadarKind>('all')
  const [activeDiscipline, setActiveDiscipline] = useState<FrontierDiscipline | 'all'>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setActiveKind('all')
    setActiveDiscipline('all')
    setActiveTag(null)
  }, [focusConceptId, open])

  const publicEntries = useMemo(
    () => prepareFrontierEntries(frontierCatalog.entries.filter(isPublicFrontierEntry)),
    [],
  )
  const scopedEntries = useMemo(
    () => focusConceptId
      ? publicEntries.filter((entry) => entry.relatedConceptIds.includes(focusConceptId))
      : publicEntries,
    [focusConceptId, publicEntries],
  )
  const latestBreakthroughEntries = useMemo(
    () => getLatestBreakthroughEntries(publicEntries),
    [publicEntries],
  )
  const latestBreakthroughIds = useMemo(
    () => new Set(latestBreakthroughEntries.map((entry) => entry.id)),
    [latestBreakthroughEntries],
  )
  const scopedLatestBreakthroughEntries = useMemo(
    () => scopedEntries.filter((entry) => latestBreakthroughIds.has(entry.id)),
    [latestBreakthroughIds, scopedEntries],
  )
  const availableKinds = useMemo(
    () => [...new Set(scopedEntries.map((entry) => entry.kind))],
    [scopedEntries],
  )
  const kindEntries = useMemo(
    () => activeKind === latestBreakthroughKind
      ? scopedLatestBreakthroughEntries
      : scopedEntries.filter((entry) => (
        activeKind === 'all' ? isDefaultFrontierEntry(entry) : entry.kind === activeKind
      )),
    [activeKind, scopedEntries, scopedLatestBreakthroughEntries],
  )
  const availableDisciplines = useMemo(() => {
    const counts = new Map<FrontierDiscipline, number>()
    kindEntries.forEach((entry) => (
      counts.set(entry.discipline, (counts.get(entry.discipline) ?? 0) + 1)
    ))
    return disciplineOrder.flatMap((discipline) => {
      const count = counts.get(discipline)
      return count ? [[discipline, count] as const] : []
    })
  }, [kindEntries])
  const disciplineEntries = useMemo(
    () => activeDiscipline === 'all'
      ? kindEntries
      : kindEntries.filter((entry) => entry.discipline === activeDiscipline),
    [activeDiscipline, kindEntries],
  )
  const availableTags = useMemo(() => {
    const counts = new Map<string, number>()
    disciplineEntries.forEach((entry) => (
      entry.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    ))
    return [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'))
  }, [disciplineEntries])
  const visibleEntries = useMemo(
    () => disciplineEntries.filter((entry) => !activeTag || entry.tags.includes(activeTag)),
    [activeTag, disciplineEntries],
  )
  const conceptCount = useMemo(
    () => new Set(visibleEntries.flatMap((entry) => entry.relatedConceptIds)).size,
    [visibleEntries],
  )
  const visibleConceptIds = useMemo(
    () => [...new Set(visibleEntries.flatMap((entry) => entry.relatedConceptIds))].sort(),
    [visibleEntries],
  )
  const scopedHistoricalCount = useMemo(
    () => scopedEntries.filter((entry) => entry.kind === 'historical-milestone').length,
    [scopedEntries],
  )

  useEffect(() => {
    if (!open) return
    onVisibleConceptIdsChange(visibleConceptIds)
  }, [onVisibleConceptIdsChange, open, visibleConceptIds])

  if (!open) return null

  return (
    <aside
      id="frontier-radar"
      className={`frontier-radar ${dark ? 'frontier-radar--dark' : ''}`}
      aria-label="前沿雷达"
    >
      <header className="frontier-radar__header">
        <div className="frontier-radar__signal" aria-hidden="true">
          <Radar size={25} strokeWidth={1.45} />
          <span />
        </div>
        <div className="frontier-radar__title">
          <small>FRONTIER SIGNALS INDEX · 已审核内容</small>
          <h2>前沿雷达</h2>
          <p>沿着稳定知识坐标，追踪未解问题与各路线最近的已解决突破。</p>
        </div>
        <button className="frontier-radar__close" onClick={onClose} aria-label="关闭前沿雷达">
          <X size={19} />
        </button>
      </header>

      <div className="frontier-radar__scope">
        <span>
          <strong>{visibleEntries.length}</strong>
          {activeKind === 'all'
            ? ' 条开放讨论'
            : activeKind === latestBreakthroughKind
              ? ' 条最新进展'
              : ' 条记录'}
        </span>
        <i />
        <span><strong>{conceptCount}</strong> 个知识锚点</span>
        {focusConceptId && (
          <button onClick={onClearFocus}>
            当前：{focusConceptLabel ?? conceptLabels[focusConceptId] ?? focusConceptId}
            <X size={12} />
          </button>
        )}
      </div>

      <nav className="frontier-radar__filters" aria-label="前沿内容类型">
        <button
          className={activeKind === 'all' ? 'active' : ''}
          onClick={() => {
            setActiveKind('all')
            setActiveDiscipline('all')
            setActiveTag(null)
          }}
        >
          全部
        </button>
        {!!scopedLatestBreakthroughEntries.length && (
          <button
            className={activeKind === latestBreakthroughKind ? 'active' : ''}
            style={{ '--kind-color': kindColors[latestBreakthroughKind] } as CSSProperties}
            onClick={() => {
              setActiveKind(latestBreakthroughKind)
              setActiveDiscipline('all')
              setActiveTag(null)
            }}
          >
            最新进展
          </button>
        )}
        {availableKinds.map((kind) => (
          <button
            key={kind}
            className={activeKind === kind ? 'active' : ''}
            style={{ '--kind-color': kindColors[kind] ?? '#6d5842' } as CSSProperties}
            onClick={() => {
              setActiveKind(kind)
              setActiveDiscipline('all')
              setActiveTag(null)
            }}
          >
            {kindLabels[kind] ?? kind}
          </button>
        ))}
      </nav>

      <div className="frontier-radar__discipline-row">
        <span>按学科</span>
        <nav className="frontier-radar__disciplines" aria-label="按学科筛选">
          <button
            className={activeDiscipline === 'all' ? 'active' : ''}
            aria-pressed={activeDiscipline === 'all'}
            onClick={() => {
              setActiveDiscipline('all')
              setActiveTag(null)
            }}
          >
            全部学科 <small>{kindEntries.length}</small>
          </button>
          {availableDisciplines.map(([discipline, count]) => (
            <button
              key={discipline}
              className={activeDiscipline === discipline ? 'active' : ''}
              style={{ '--discipline-color': disciplineColors[discipline] } as CSSProperties}
              aria-pressed={activeDiscipline === discipline}
              onClick={() => {
                setActiveDiscipline(discipline)
                setActiveTag(null)
              }}
            >
              <i aria-hidden="true" />
              {disciplineLabels[discipline]} <small>{count}</small>
            </button>
          ))}
        </nav>
      </div>

      <div className="frontier-radar__tags" aria-label="前沿标签筛选">
        {availableTags.map(([tag, count]) => (
          <button
            key={tag}
            className={activeTag === tag ? 'active' : ''}
            aria-pressed={activeTag === tag}
            onClick={() => setActiveTag((current) => current === tag ? null : tag)}
          >
            {tagLabel(tag)} <small>{count}</small>
          </button>
        ))}
      </div>

      <div className="frontier-radar__timeline" aria-live="polite">
        {visibleEntries.length ? visibleEntries.map((entry) => {
          const sources = getFrontierSourcesForEntry(frontierCatalog, entry)
          const isLatestBreakthrough = latestBreakthroughIds.has(entry.id)
          const accent = isLatestBreakthrough
            ? kindColors[latestBreakthroughKind]
            : kindColors[entry.kind] ?? '#6d5842'
          return (
            <article
              className="frontier-entry"
              key={entry.id}
              style={{ '--frontier-accent': accent } as CSSProperties}
            >
              <div className="frontier-entry__date">
                <span />
                <time dateTime={entry.publishedAt}>{formatFrontierDate(entry.publishedAt)}</time>
              </div>
              <div className="frontier-entry__body">
                <div className="frontier-entry__meta">
                  <div className="frontier-entry__classification">
                    <span>
                      {disciplineLabels[entry.discipline]} · {kindLabels[entry.kind] ?? entry.kind}
                    </span>
                    {isLatestBreakthrough && <em>最新进展</em>}
                  </div>
                  <small><Clock3 size={11} /> 复核于 {entry.reviewedAt}</small>
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>

                <div className="frontier-entry__tags">
                  {entry.tags.map((tag) => <span key={tag}>{tagLabel(tag)}</span>)}
                </div>

                {!!entry.relatedConceptIds.length && (
                  <div className="frontier-entry__concepts" aria-label="相关知识点">
                    <BookOpen size={13} />
                    {entry.relatedConceptIds.map((conceptId) => (
                      <button key={conceptId} onClick={() => onLocateConcept(conceptId)}>
                        {conceptLabels[conceptId] ?? conceptId}<ChevronRight size={12} />
                      </button>
                    ))}
                  </div>
                )}

                {!!sources.length && (
                  <details className="frontier-entry__sources">
                    <summary><CalendarDays size={13} /> 查看 {sources.length} 项来源与复核信息</summary>
                    <ul>
                      {sources.map((source) => (
                        <li key={source.id}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            <span>{source.title}</span><ArrowUpRight size={12} />
                          </a>
                          <small>{source.publisher}{source.publishedAt ? ` · ${source.publishedAt}` : ''}</small>
                        </li>
                      ))}
                    </ul>
                    <p>下次复核：{entry.reviewDue}</p>
                  </details>
                )}
              </div>
            </article>
          )
        }) : (
          <div className="frontier-radar__empty">
            <Radar size={27} />
            <strong>{activeKind === 'all' ? '这里暂时没有开放讨论' : '这个范围暂时没有信号'}</strong>
            <p>
              {activeKind === 'all' && scopedHistoricalCount
                ? '这个知识范围只有已经解决的问题，可切换到历史分类查看。'
                : '清除学科与标签筛选，回到当前范围的默认开放问题。'}
            </p>
            {activeKind === 'all' && scopedHistoricalCount ? (
              <button onClick={() => {
                setActiveKind('historical-milestone')
                setActiveDiscipline('all')
                setActiveTag(null)
              }}>
                查看历史已解决问题
              </button>
            ) : (
              <button onClick={() => {
                setActiveKind('all')
                setActiveDiscipline('all')
                setActiveTag(null)
              }}>
                显示全部开放问题
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
