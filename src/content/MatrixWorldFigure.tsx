import { useId, useState } from 'react'
import type { KnowledgeArticleVisual } from './types'
import './MatrixWorldFigure.css'

interface MatrixWorldFigureProps {
  visual: KnowledgeArticleVisual
}

type MatrixWorldView = 'families' | 'factorizations' | 'applications'

const MATRIX_WORLD_SOURCE_URL = 'https://github.com/kenjihiranabe/The-Art-of-Linear-Algebra'

const viewOptions: readonly {
  id: MatrixWorldView
  index: string
  label: string
  summary: string
}[] = [
  {
    id: 'families',
    index: '01',
    label: '类型关系',
    summary: '先看集合：矩阵性质从一般条件逐步收紧，部分家族彼此交叠。',
  },
  {
    id: 'factorizations',
    index: '02',
    label: '分解条件',
    summary: '再看方法：每种分解回答不同问题，也各有适用条件。',
  },
  {
    id: 'applications',
    index: '03',
    label: '应用线索',
    summary: '最后把半正定、奇异值与伪逆放回统计、图像和最小二乘问题。',
  },
]

const viewFacts: Readonly<Record<MatrixWorldView, readonly string[]>> = {
  families: [
    '“可逆 / 奇异”是方阵的二分；其余轮廓表达主要包含或交叠关系，面积不表示矩阵数量。',
    '实对称矩阵可以实正交对角化；一般实正规矩阵需要在复数域中用酉矩阵对角化。',
    'P²=P 只说明投影；再加 Pᵀ=P，才是图中位于半正定区域内的正交投影。',
    '半正定与正交矩阵只在 I 相交；0 属于半正定与正交投影，但不属于正定或正交矩阵。',
  ],
  factorizations: [
    '秩分解、SVD 与 Moore–Penrose 伪逆适用于任意有限维矩阵。',
    '完整 QR 可扩展到任意实矩阵；列线性无关时薄 QR 最自然，秩亏时需要补全或选主元。',
    'Jordan 形适用于复方阵；可对角化只是所有 Jordan 块都退化为一阶块的特殊情形。',
  ],
  applications: [
    '协方差矩阵总是半正定；只有不存在零方差的非零线性组合时，它才是正定的。',
    '截断 SVD 保留最大的奇异值，以较低秩矩阵近似原图；舍弃的方向对应较小能量。',
    '伪逆把不相容或解不唯一的线性方程统一为最小二乘、最小范数解。',
  ],
}

interface ViewSvgProps {
  titleId: string
  descriptionId: string
}

function MatrixFamiliesView({ titleId, descriptionId }: ViewSvgProps) {
  return (
    <svg
      className="matrix-world__svg matrix-world__svg--families"
      viewBox="0 0 640 560"
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <title id={titleId}>矩阵类型的包含与交叠关系</title>
      <desc id={descriptionId}>
        从任意实矩阵进入方阵，再展示在复数域可对角化的矩阵、正规矩阵、实对称矩阵、正交矩阵、半正定矩阵，以及正定、正交投影、置换和对角子类之间的主要关系。可逆与奇异是方阵的二分。
      </desc>

      <rect className="matrix-world__region matrix-world__region--all" x="16" y="14" width="608" height="532" rx="38" />
      <rect className="matrix-world__region matrix-world__region--square" x="42" y="84" width="556" height="438" rx="34" />
      <rect className="matrix-world__region matrix-world__region--diagonalizable" x="64" y="190" width="512" height="310" rx="145" />
      <ellipse className="matrix-world__region matrix-world__region--normal" cx="320" cy="360" rx="240" ry="135" />
      <ellipse className="matrix-world__region matrix-world__region--symmetric" cx="400" cy="375" rx="145" ry="100" />
      <ellipse className="matrix-world__region matrix-world__region--orthogonal" cx="230" cy="390" rx="125" ry="84" />
      <ellipse className="matrix-world__region matrix-world__region--psd" cx="435" cy="390" rx="80" ry="60" />

      <g className="matrix-world__scope-label">
        <text x="38" y="48">任意形状实矩阵</text>
        <text className="matrix-world__formula-text" x="38" y="72">A ∈ ℝᵐˣⁿ</text>
        <text className="matrix-world__side-note" x="602" y="49" textAnchor="end">CR · SVD · A⁺</text>
      </g>

      <g className="matrix-world__scope-label">
        <text x="64" y="118">方阵</text>
        <text className="matrix-world__formula-text" x="64" y="141">A ∈ ℝⁿˣⁿ</text>
      </g>

      <g className="matrix-world__condition matrix-world__condition--invertible">
        <rect x="170" y="104" width="174" height="58" rx="8" />
        <text x="187" y="128">可逆</text>
        <text className="matrix-world__formula-text" x="187" y="150">det(A) ≠ 0</text>
      </g>
      <g className="matrix-world__condition matrix-world__condition--singular">
        <rect x="360" y="104" width="174" height="58" rx="8" />
        <text x="377" y="128">奇异</text>
        <text className="matrix-world__formula-text" x="377" y="150">det(A) = 0</text>
      </g>
      <path className="matrix-world__split-mark" d="M352 112 v42" />

      <g className="matrix-world__region-label">
        <text x="84" y="220">在 ℂ 上可对角化</text>
        <text className="matrix-world__formula-text" x="84" y="244">A = XΛX⁻¹</text>
      </g>
      <g className="matrix-world__region-label matrix-world__region-label--center">
        <text x="320" y="254">正规</text>
        <text className="matrix-world__formula-text" x="320" y="277">AᵀA = AAᵀ</text>
        <text className="matrix-world__side-note" x="320" y="298">复数化后酉对角化</text>
      </g>
      <g className="matrix-world__region-label">
        <text x="126" y="344">正交</text>
        <text className="matrix-world__formula-text" x="126" y="367">QᵀQ = I</text>
      </g>
      <g className="matrix-world__region-label matrix-world__region-label--center">
        <text x="494" y="300">实对称</text>
        <text className="matrix-world__formula-text" x="494" y="322">S = Sᵀ</text>
      </g>

      <g className="matrix-world__class-chip matrix-world__class-chip--diagonal">
        <rect x="350" y="304" width="116" height="34" rx="7" />
        <text x="408" y="326" textAnchor="middle">对角 ⊂ 实对称</text>
      </g>
      <g className="matrix-world__class-chip matrix-world__class-chip--permutation">
        <rect x="210" y="408" width="112" height="32" rx="7" />
        <text x="266" y="429" textAnchor="middle">置换 ⊂ 正交</text>
      </g>
      <g className="matrix-world__class-chip matrix-world__class-chip--projection">
        <rect x="380" y="352" width="100" height="28" rx="7" />
        <text x="430" y="371" textAnchor="middle">正交投影</text>
      </g>
      <g className="matrix-world__class-chip matrix-world__class-chip--pd">
        <rect x="402" y="410" width="75" height="28" rx="7" />
        <text x="439.5" y="429" textAnchor="middle">正定</text>
      </g>
      <text className="matrix-world__small-region-label" x="482" y="397" textAnchor="middle">半正定</text>

      <g className="matrix-world__anchor matrix-world__anchor--identity">
        <circle cx="355" cy="390" r="13" />
        <text x="355" y="396" textAnchor="middle">I</text>
      </g>
      <g className="matrix-world__anchor matrix-world__anchor--zero">
        <circle cx="493" cy="365" r="12" />
        <text x="493" y="371" textAnchor="middle">0</text>
      </g>

      <text className="matrix-world__diagram-note" x="320" y="532" textAnchor="middle">
        轮廓表示主要集合关系 · 交叠位置不按比例
      </text>
    </svg>
  )
}

function MatrixFactorizationsView({ titleId, descriptionId }: ViewSvgProps) {
  return (
    <svg
      className="matrix-world__svg matrix-world__svg--factorizations"
      viewBox="0 0 640 560"
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <title id={titleId}>常见矩阵分解的适用条件</title>
      <desc id={descriptionId}>
        图中按适用条件列出任意矩阵的秩分解、奇异值分解和伪逆，列满秩矩阵的经典薄 QR，带主元交换的 LU，复方阵的对角化与 Jordan 形，以及实对称和复正规矩阵的谱定理。
      </desc>

      <text className="matrix-world__kicker" x="24" y="36">条件决定方法</text>
      <text className="matrix-world__diagram-note" x="616" y="36" textAnchor="end">每一行独立阅读，不表示集合嵌套</text>
      <path className="matrix-world__method-spine" d="M178 72 V532" />

      <g className="matrix-world__method-row matrix-world__method-row--universal">
        <circle cx="178" cy="126" r="7" />
        <text className="matrix-world__method-condition" x="24" y="111">任意 m×n 矩阵</text>
        <text className="matrix-world__method-hint" x="24" y="135">不要求方阵或满秩</text>
        <rect x="198" y="72" width="418" height="108" rx="7" />
        <text className="matrix-world__method-purpose" x="220" y="99">秩结构</text>
        <text className="matrix-world__method-formula" x="324" y="100">A = CR</text>
        <text className="matrix-world__method-purpose" x="220" y="130">正交伸缩</text>
        <text className="matrix-world__method-formula" x="324" y="131">A = UΣVᵀ</text>
        <text className="matrix-world__method-purpose" x="220" y="161">最小范数</text>
        <text className="matrix-world__method-formula" x="324" y="162">A⁺ = VΣ⁺Uᵀ</text>
      </g>

      <g className="matrix-world__method-row">
        <circle cx="178" cy="222" r="7" />
        <text className="matrix-world__method-condition" x="24" y="213">列线性无关</text>
        <text className="matrix-world__method-hint" x="24" y="237">经典薄 QR</text>
        <rect x="198" y="193" width="418" height="58" rx="7" />
        <text className="matrix-world__method-purpose" x="220" y="228">正交化 / 最小二乘</text>
        <text className="matrix-world__method-formula" x="445" y="229">A = QR</text>
      </g>

      <g className="matrix-world__method-row">
        <circle cx="178" cy="298" r="7" />
        <text className="matrix-world__method-condition" x="24" y="289">方阵</text>
        <text className="matrix-world__method-hint" x="24" y="313">允许主元交换</text>
        <rect x="198" y="269" width="418" height="58" rx="7" />
        <text className="matrix-world__method-purpose" x="220" y="304">高斯消元</text>
        <text className="matrix-world__method-formula" x="445" y="305">PA = LU</text>
      </g>

      <g className="matrix-world__method-row">
        <circle cx="178" cy="386" r="7" />
        <text className="matrix-world__method-condition" x="24" y="368">复方阵</text>
        <text className="matrix-world__method-hint" x="24" y="392">按特征向量数量分流</text>
        <rect x="198" y="341" width="418" height="90" rx="7" />
        <text className="matrix-world__method-purpose" x="220" y="373">n 个线性无关特征向量</text>
        <text className="matrix-world__method-formula" x="449" y="374">A = XΛX⁻¹</text>
        <text className="matrix-world__method-purpose" x="220" y="407">任意复方阵 · Jordan 形</text>
        <text className="matrix-world__method-formula" x="449" y="408">A = XJX⁻¹</text>
      </g>

      <g className="matrix-world__method-row matrix-world__method-row--spectral">
        <circle cx="178" cy="490" r="7" />
        <text className="matrix-world__method-condition" x="24" y="472">谱定理</text>
        <text className="matrix-world__method-hint" x="24" y="496">额外结构带来正交性</text>
        <rect x="198" y="448" width="418" height="84" rx="7" />
        <text className="matrix-world__method-purpose" x="220" y="480">实对称</text>
        <text className="matrix-world__method-formula" x="350" y="481">S = QΛQᵀ</text>
        <text className="matrix-world__method-purpose" x="220" y="515">复正规</text>
        <text className="matrix-world__method-formula" x="350" y="516">A = UΛU*</text>
      </g>
    </svg>
  )
}

const compressionCells = Array.from({ length: 16 }, (_, index) => ({
  x: 350 + (index % 4) * 20,
  y: 130 + Math.floor(index / 4) * 20,
  tone: (index * 7 + Math.floor(index / 4) * 3) % 5,
}))

function MatrixApplicationsView({ titleId, descriptionId }: ViewSvgProps) {
  return (
    <svg
      className="matrix-world__svg matrix-world__svg--applications"
      viewBox="0 0 640 560"
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <title id={titleId}>半正定、奇异值和伪逆的应用</title>
      <desc id={descriptionId}>
        左侧说明协方差矩阵总是半正定并在满秩时正定；右侧展示截断奇异值分解保留最大的奇异值进行图像压缩；底部展示伪逆给出最小二乘和最小范数解。
      </desc>

      <g className="matrix-world__application-panel matrix-world__application-panel--covariance">
        <path d="M22 50 H294 V372 H22" />
        <text className="matrix-world__kicker" x="38" y="82">统计 · 协方差</text>
        <text className="matrix-world__application-title" x="38" y="113">变化能否沿某个方向消失？</text>
        <line className="matrix-world__mini-axis" x1="55" x2="252" y1="241" y2="241" />
        <line className="matrix-world__mini-axis" x1="87" x2="87" y1="143" y2="264" />
        <ellipse className="matrix-world__covariance-ellipse" cx="153" cy="201" rx="82" ry="34" transform="rotate(-24 153 201)" />
        <g className="matrix-world__samples">
          <circle cx="91" cy="228" r="4" />
          <circle cx="108" cy="217" r="4" />
          <circle cx="126" cy="211" r="4" />
          <circle cx="142" cy="199" r="4" />
          <circle cx="157" cy="198" r="4" />
          <circle cx="174" cy="188" r="4" />
          <circle cx="193" cy="181" r="4" />
          <circle cx="213" cy="169" r="4" />
        </g>
        <text className="matrix-world__application-formula" x="38" y="302">Σ = E[(X−μ)(X−μ)ᵀ]</text>
        <text className="matrix-world__application-result" x="38" y="334">总是 Σ ⪰ 0</text>
        <text className="matrix-world__application-note" x="38" y="357">无零方差方向时，Σ ≻ 0</text>
      </g>

      <g className="matrix-world__application-panel matrix-world__application-panel--compression">
        <path d="M318 50 H618 V372 H318" />
        <text className="matrix-world__kicker" x="336" y="82">图像 · 截断 SVD</text>
        <text className="matrix-world__application-title" x="336" y="113">哪些方向携带最多信息？</text>
        <g className="matrix-world__pixel-grid">
          {compressionCells.map((cell) => (
            <rect
              key={`${cell.x}-${cell.y}`}
              className={`matrix-world__pixel matrix-world__pixel--${cell.tone}`}
              x={cell.x}
              y={cell.y}
              width="17"
              height="17"
              rx="1"
            />
          ))}
        </g>
        <path className="matrix-world__application-arrow" d="M442 169 H478" />
        <g className="matrix-world__singular-bars">
          <rect x="492" y="134" width="78" height="12" rx="2" />
          <rect x="492" y="154" width="56" height="12" rx="2" />
          <rect x="492" y="174" width="38" height="12" rx="2" />
          <rect className="is-discarded" x="492" y="194" width="24" height="12" rx="2" />
          <rect className="is-discarded" x="492" y="214" width="13" height="12" rx="2" />
        </g>
        <text className="matrix-world__application-note" x="492" y="248">σ₁ ≥ σ₂ ≥ ···</text>
        <text className="matrix-world__application-formula" x="336" y="302">Aₖ = UₖΣₖVₖᵀ</text>
        <text className="matrix-world__application-result" x="336" y="334">保留最大的 k 个奇异值</text>
        <text className="matrix-world__application-note" x="336" y="357">低秩近似减少存储与噪声</text>
      </g>

      <g className="matrix-world__application-bridge">
        <path d="M22 404 H618 V536 H22 Z" />
        <text className="matrix-world__kicker" x="38" y="435">方程 · 伪逆</text>
        <text className="matrix-world__application-title" x="38" y="468">当 Ax=b 无解或有许多解</text>
        <text className="matrix-world__application-formula" x="336" y="461">x* = A⁺b</text>
        <text className="matrix-world__application-result" x="336" y="491">最小二乘 · 最小范数</text>
        <text className="matrix-world__application-note" x="38" y="515">SVD 同时说明哪些方向可恢复，哪些方向落在零空间中。</text>
      </g>
    </svg>
  )
}

export function MatrixWorldFigure({ visual }: MatrixWorldFigureProps) {
  const [activeView, setActiveView] = useState<MatrixWorldView>('families')
  const instanceId = useId().replace(/:/g, '')
  const activeOption = viewOptions.find((option) => option.id === activeView) ?? viewOptions[0]
  const titleId = `${instanceId}-${activeView}-title`
  const descriptionId = `${instanceId}-${activeView}-description`
  const panelId = `${instanceId}-panel`

  return (
    <figure className="knowledge-article__visual matrix-world">
      <div className="knowledge-article__visual-heading matrix-world__heading">
        <small>概念图解 · 可切换视图</small>
        <strong>{visual.title}</strong>
      </div>

      <div className="matrix-world__view-switcher" aria-label="切换矩阵世界图解视图">
        {viewOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            className={activeView === option.id ? 'is-active' : undefined}
            aria-pressed={activeView === option.id}
            aria-controls={panelId}
            onClick={() => setActiveView(option.id)}
          >
            <span>{option.index}</span>
            {option.label}
          </button>
        ))}
      </div>

      <p className="matrix-world__view-summary" aria-live="polite">{activeOption.summary}</p>

      <div
        className="matrix-world__stage"
        id={panelId}
        role="group"
        tabIndex={0}
        aria-label={`${activeOption.label}图解；窄屏时可横向滚动`}
      >
        {activeView === 'families' && (
          <MatrixFamiliesView titleId={titleId} descriptionId={descriptionId} />
        )}
        {activeView === 'factorizations' && (
          <MatrixFactorizationsView titleId={titleId} descriptionId={descriptionId} />
        )}
        {activeView === 'applications' && (
          <MatrixApplicationsView titleId={titleId} descriptionId={descriptionId} />
        )}
      </div>

      <ol className="matrix-world__facts" aria-label={`${activeOption.label}阅读提示`}>
        {viewFacts[activeView].map((fact, index) => (
          <li key={fact}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <p>{fact}</p>
          </li>
        ))}
      </ol>

      <figcaption>
        <span>{visual.caption}</span>
        <span className="matrix-world__credit">
          基于 Kenji Hiranabe 与 Gilbert Strang 的“Matrix World”重新组织，并修订适用条件与域的约定。
          {' '}
          <a href={MATRIX_WORLD_SOURCE_URL} target="_blank" rel="noreferrer">查看 CC0 原作</a>
        </span>
      </figcaption>
    </figure>
  )
}

export default MatrixWorldFigure
