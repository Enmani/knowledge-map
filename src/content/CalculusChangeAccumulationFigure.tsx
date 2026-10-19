import type React from 'react'
import { useId } from 'react'
import type { KnowledgeArticleVisual } from './types'

interface CalculusChangeAccumulationFigureProps {
  visual: KnowledgeArticleVisual
}

export const CalculusChangeAccumulationFigure: React.FC<CalculusChangeAccumulationFigureProps> = ({
  visual,
}) => {
  const instanceId = useId().replace(/:/g, '')
  const titleId = `${instanceId}-title`
  const descriptionId = `${instanceId}-description`
  const areaGradientId = `${instanceId}-area-gradient`

  return (
    <figure className="knowledge-article__visual">
      <div className="knowledge-article__visual-heading">
        <small>概念图解</small>
        <strong>{visual.title}</strong>
      </div>
      <svg
        viewBox="0 0 640 280"
        role="img"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <title id={titleId}>{visual.title}</title>
        <desc id={descriptionId}>{visual.description}</desc>
        <defs>
          <linearGradient id={areaGradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.38" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        <g className="knowledge-article__visual-panel">
          <rect x="18" y="18" width="286" height="226" rx="8" />
          <text className="knowledge-article__visual-label" x="38" y="49">导数 · 当前位置怎样变化</text>
          <line className="knowledge-article__visual-axis" x1="42" x2="279" y1="213" y2="213" />
          <line className="knowledge-article__visual-axis" x1="68" x2="68" y1="70" y2="222" />
          <path className="knowledge-article__visual-curve" d="M 48 205 C 98 201, 137 185, 166 151 C 198 114, 227 83, 282 72" />
          <line className="knowledge-article__visual-tangent" x1="122" x2="252" y1="205" y2="76" />
          <circle className="knowledge-article__visual-point" cx="185" cy="139" r="6" />
          <text className="knowledge-article__visual-note" x="194" y="130">切线斜率</text>
          <text className="knowledge-article__visual-symbol" x="195" y="188">f′(x)</text>
        </g>

        <g className="knowledge-article__visual-panel">
          <rect x="336" y="18" width="286" height="226" rx="8" />
          <text className="knowledge-article__visual-label" x="356" y="49">积分 · 到当前位置累积多少</text>
          <line className="knowledge-article__visual-axis" x1="360" x2="597" y1="213" y2="213" />
          <line className="knowledge-article__visual-axis" x1="386" x2="386" y1="70" y2="222" />
          <path
            className="knowledge-article__visual-area"
            fill={`url(#${areaGradientId})`}
            d="M 386 213 L 386 205 C 436 201, 475 185, 504 151 C 525 126, 544 104, 566 89 L 566 213 Z"
          />
          <path className="knowledge-article__visual-curve" d="M 366 205 C 416 201, 455 185, 484 151 C 516 114, 545 83, 600 72" />
          <line className="knowledge-article__visual-boundary" x1="566" x2="566" y1="89" y2="213" />
          <text className="knowledge-article__visual-note" x="448" y="196">累积面积</text>
          <text className="knowledge-article__visual-symbol" x="438" y="111">∫ₐˣ f(t)dt</text>
        </g>

        <g className="knowledge-article__visual-bridge" aria-hidden="true">
          <line x1="275" x2="365" y1="262" y2="262" />
          <path d="M 275 262 l 10 -6 v 12 z" />
          <path d="M 365 262 l -10 -6 v 12 z" />
          <text x="320" y="267">微积分基本定理</text>
        </g>
      </svg>
      <figcaption>{visual.caption}</figcaption>
    </figure>
  )
}

export default CalculusChangeAccumulationFigure
