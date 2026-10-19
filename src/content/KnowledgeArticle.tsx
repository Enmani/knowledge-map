import type React from 'react'
import { CalculusChangeAccumulationFigure } from './CalculusChangeAccumulationFigure'
import { MatrixWorldFigure } from './MatrixWorldFigure'
import type {
  KnowledgeArticleVisual,
  KnowledgeArticleVisualKind,
  KnowledgeCardContent,
} from './types'
import './KnowledgeArticle.css'

interface KnowledgeArticleProps {
  content: KnowledgeCardContent
  statusLabel?: string
}

interface KnowledgeArticleVisualProps {
  visual: KnowledgeArticleVisual
}

const visualRegistry: Readonly<Record<
  KnowledgeArticleVisualKind,
  React.ComponentType<KnowledgeArticleVisualProps>
>> = {
  'calculus-change-and-accumulation': CalculusChangeAccumulationFigure,
  'matrix-world': MatrixWorldFigure,
}

export const KnowledgeArticle: React.FC<KnowledgeArticleProps> = ({
  content,
  statusLabel,
}) => (
  <article className="knowledge-article" aria-label={`${content.conceptId}知识介绍`}>
    {statusLabel && (
      <div className="knowledge-article__status">
        <span>内容状态</span>
        <small>{statusLabel}</small>
      </div>
    )}

    {content.sections.map((section) => {
      const Visual = section.visual ? visualRegistry[section.visual.kind] : null

      return (
        <section className="knowledge-article__section" key={section.id}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.id}-paragraph-${index + 1}`}>{paragraph}</p>
          ))}
          {section.formulas?.map((formula) => (
            <div className="knowledge-article__formula" key={formula.id}>
              <code>{formula.expression}</code>
              {formula.explanation && <small>{formula.explanation}</small>}
            </div>
          ))}
          {Visual && section.visual && <Visual visual={section.visual} />}
        </section>
      )
    })}

    <details className="knowledge-article__sources">
      <summary>参考资料与复核信息</summary>
      <ul>
        {content.sources.map((source) => (
          <li key={source.id}>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
            ) : (
              <span>{source.title}</span>
            )}
            <small>
              {source.creators.join('、')}
              {source.publishedYear ? ` · ${source.publishedYear}` : ''}
              {source.locator ? ` · ${source.locator}` : ''}
              {source.license ? ` · ${source.license}` : ''}
            </small>
          </li>
        ))}
      </ul>
      <p>最近复核 {content.reviewedAt} · 下次复核 {content.reviewDue}</p>
    </details>
  </article>
)

export default KnowledgeArticle
