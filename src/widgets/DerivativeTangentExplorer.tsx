import type React from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { DERIVATIVE_TANGENT_WIDGET_ID } from './catalog'
import {
  DERIVATIVE_COMPLETION_INTERVAL,
  DERIVATIVE_INTERVAL_BOUNDARY,
  DERIVATIVE_POINT_BOUNDARY,
  derivativeTangentMetadata,
} from './derivativeTangentSpec'
import type { RegisteredWidgetProps } from './types'
import './DerivativeTangentExplorer.css'

const POINT_MIN = DERIVATIVE_POINT_BOUNDARY.minimum
const POINT_MAX = DERIVATIVE_POINT_BOUNDARY.maximum
const POINT_STEP = DERIVATIVE_POINT_BOUNDARY.step
const INTERVAL_MIN = DERIVATIVE_INTERVAL_BOUNDARY.minimum
const INTERVAL_MAX = DERIVATIVE_INTERVAL_BOUNDARY.maximum
const INTERVAL_STEP = DERIVATIVE_INTERVAL_BOUNDARY.step

const VIEW_WIDTH = 560
const VIEW_HEIGHT = 300
const PADDING = 34
const X_MIN = -3
const X_MAX = 3
const Y_MIN = -1
const Y_MAX = 9
const PLOT_WIDTH = VIEW_WIDTH - PADDING * 2
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING * 2

const plotX = (value: number): number =>
  PADDING + ((value - X_MIN) / (X_MAX - X_MIN)) * PLOT_WIDTH

const plotY = (value: number): number =>
  PADDING + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT

function normalizeInput(
  value: number,
  minimum: number,
  maximum: number,
  step: number,
): number {
  const finiteValue = Number.isFinite(value) ? value : minimum
  const clamped = Math.min(maximum, Math.max(minimum, finiteValue))
  const stepped = minimum + Math.round((clamped - minimum) / step) * step
  return Number(stepped.toFixed(6))
}

function formatNumber(value: number): string {
  const normalized = Math.abs(value) < 0.000001 ? 0 : value
  return normalized.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function createLinePath(slope: number, intercept: number): string {
  return `M ${plotX(X_MIN)} ${plotY(slope * X_MIN + intercept)} L ${plotX(X_MAX)} ${plotY(slope * X_MAX + intercept)}`
}

const parabolaPath = Array.from({ length: 121 }, (_, index) => {
  const x = X_MIN + (index / 120) * (X_MAX - X_MIN)
  return `${index === 0 ? 'M' : 'L'} ${plotX(x)} ${plotY(x * x)}`
}).join(' ')

const xGridValues = [-3, -2, -1, 0, 1, 2, 3]
const yGridValues = [0, 2, 4, 6, 8]

export interface DerivativeTangentExplorerProps extends RegisteredWidgetProps {
  initialPoint?: number
  initialInterval?: number
}

export const DerivativeTangentExplorer: React.FC<DerivativeTangentExplorerProps> = ({
  conceptId,
  className,
  initialPoint = 1,
  initialInterval = 0.8,
  onComplete,
}) => {
  const initialPointValue = normalizeInput(initialPoint, POINT_MIN, POINT_MAX, POINT_STEP)
  const initialIntervalValue = normalizeInput(
    initialInterval,
    INTERVAL_MIN,
    INTERVAL_MAX,
    INTERVAL_STEP,
  )
  const [point, setPoint] = useState(initialPointValue)
  const [interval, setInterval] = useState(initialIntervalValue)
  const [hasMovedPoint, setHasMovedPoint] = useState(false)
  const [completed, setCompleted] = useState(false)
  const completionSentRef = useRef(false)
  const instanceId = useId().replace(/:/g, '')
  const pointInputId = `${instanceId}-point`
  const intervalInputId = `${instanceId}-interval`
  const helpId = `${instanceId}-help`
  const graphTitleId = `${instanceId}-graph-title`
  const graphDescriptionId = `${instanceId}-graph-description`
  const clipPathId = `${instanceId}-plot-clip`

  const tangentSlope = 2 * point
  const secantSlope = 2 * point + interval
  const pointY = point * point
  const secondPoint = point + interval
  const secondPointY = secondPoint * secondPoint
  const tangentPath = useMemo(
    () => createLinePath(tangentSlope, -point * point),
    [point, tangentSlope],
  )
  const secantPath = useMemo(
    () => createLinePath(secantSlope, pointY - secantSlope * point),
    [point, pointY, secantSlope],
  )

  useEffect(() => {
    if (
      completionSentRef.current ||
      !hasMovedPoint ||
      interval > DERIVATIVE_COMPLETION_INTERVAL
    ) {
      return
    }

    completionSentRef.current = true
    setCompleted(true)
    onComplete?.({
      conceptId,
      widgetId: DERIVATIVE_TANGENT_WIDGET_ID,
      widgetVersion: derivativeTangentMetadata.version,
      completedAt: new Date().toISOString(),
      values: {
        point,
        interval,
        tangentSlope,
        secantSlope,
      },
    })
  }, [conceptId, hasMovedPoint, interval, onComplete, point, secantSlope, tangentSlope])

  const handlePointChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextPoint = normalizeInput(Number(event.target.value), POINT_MIN, POINT_MAX, POINT_STEP)
    setPoint(nextPoint)
    setHasMovedPoint(true)
  }, [])

  const handleIntervalChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInterval(normalizeInput(
      Number(event.target.value),
      INTERVAL_MIN,
      INTERVAL_MAX,
      INTERVAL_STEP,
    ))
  }, [])

  const handleReset = useCallback(() => {
    setPoint(initialPointValue)
    setInterval(initialIntervalValue)
    setHasMovedPoint(false)
  }, [initialIntervalValue, initialPointValue])

  return (
    <section className={`derivative-explorer ${className ?? ''}`.trim()} aria-labelledby={`${instanceId}-title`}>
      <div className="derivative-explorer__heading">
        <div>
          <p className="derivative-explorer__eyebrow">互动 · 导数</p>
          <h3 id={`${instanceId}-title`}>切线与斜率探索器</h3>
        </div>
        {completed && <span className="derivative-explorer__complete" role="status">探索完成</span>}
      </div>

      <p id={helpId} className="derivative-explorer__intro">
        改变曲线上的基准点，再缩小两点间距。观察割线斜率如何接近切线斜率。
      </p>

      <svg
        className="derivative-explorer__graph"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-labelledby={graphTitleId}
        aria-describedby={graphDescriptionId}
      >
        <title id={graphTitleId}>函数 f(x)=x² 的切线和割线图</title>
        <desc id={graphDescriptionId}>
          基准点位于 x={formatNumber(point)}，切线斜率为 {formatNumber(tangentSlope)}，
          割线斜率为 {formatNumber(secantSlope)}。
        </desc>
        <defs>
          <clipPath id={clipPathId}>
            <rect x={PADDING} y={PADDING} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
          </clipPath>
        </defs>

        <g className="derivative-explorer__grid" aria-hidden="true">
          {xGridValues.map((value) => (
            <line key={`x-${value}`} x1={plotX(value)} x2={plotX(value)} y1={PADDING} y2={VIEW_HEIGHT - PADDING} />
          ))}
          {yGridValues.map((value) => (
            <line key={`y-${value}`} x1={PADDING} x2={VIEW_WIDTH - PADDING} y1={plotY(value)} y2={plotY(value)} />
          ))}
        </g>

        <g className="derivative-explorer__axes" aria-hidden="true">
          <line x1={PADDING} x2={VIEW_WIDTH - PADDING} y1={plotY(0)} y2={plotY(0)} />
          <line x1={plotX(0)} x2={plotX(0)} y1={PADDING} y2={VIEW_HEIGHT - PADDING} />
          <text x={VIEW_WIDTH - PADDING + 8} y={plotY(0) + 4}>x</text>
          <text x={plotX(0) + 7} y={PADDING - 8}>y</text>
        </g>

        <g clipPath={`url(#${clipPathId})`}>
          <path className="derivative-explorer__curve" d={parabolaPath} />
          <path className="derivative-explorer__tangent" d={tangentPath} />
          <path className="derivative-explorer__secant" d={secantPath} />
          <circle className="derivative-explorer__point" cx={plotX(point)} cy={plotY(pointY)} r="6" />
          <circle className="derivative-explorer__second-point" cx={plotX(secondPoint)} cy={plotY(secondPointY)} r="5" />
        </g>
      </svg>

      <div className="derivative-explorer__legend" aria-hidden="true">
        <span><i className="curve" />f(x)=x²</span>
        <span><i className="tangent" />切线</span>
        <span><i className="secant" />割线</span>
      </div>

      <fieldset className="derivative-explorer__controls" aria-describedby={helpId}>
        <legend>调整参数</legend>
        <label htmlFor={pointInputId}>
          <span>基准点 a</span>
          <output htmlFor={pointInputId}>{formatNumber(point)}</output>
        </label>
        <input
          id={pointInputId}
          type="range"
          min={POINT_MIN}
          max={POINT_MAX}
          step={POINT_STEP}
          value={point}
          onChange={handlePointChange}
          aria-valuetext={`a 等于 ${formatNumber(point)}`}
        />

        <label htmlFor={intervalInputId}>
          <span>两点间距 h</span>
          <output htmlFor={intervalInputId}>{formatNumber(interval)}</output>
        </label>
        <input
          id={intervalInputId}
          type="range"
          min={INTERVAL_MIN}
          max={INTERVAL_MAX}
          step={INTERVAL_STEP}
          value={interval}
          onChange={handleIntervalChange}
          aria-valuetext={`h 等于 ${formatNumber(interval)}`}
        />
      </fieldset>

      <dl className="derivative-explorer__readout" aria-live="polite" aria-atomic="true">
        <div><dt>切线斜率 f′(a)</dt><dd>{formatNumber(tangentSlope)}</dd></div>
        <div><dt>割线斜率</dt><dd>{formatNumber(secantSlope)}</dd></div>
        <div><dt>斜率差</dt><dd>{formatNumber(Math.abs(secantSlope - tangentSlope))}</dd></div>
      </dl>

      <div className="derivative-explorer__footer">
        <p>完成条件：移动基准点，并将 h 缩小到 {DERIVATIVE_COMPLETION_INTERVAL} 或更小。</p>
        <button type="button" onClick={handleReset}>重置参数</button>
      </div>
    </section>
  )
}
