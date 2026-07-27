import { DERIVATIVE_TANGENT_WIDGET_ID } from './catalog'
import type { WidgetDefinition, WidgetInputBoundary } from './types'

export const DERIVATIVE_POINT_BOUNDARY = {
  key: 'point',
  label: '基准点 a',
  minimum: -2,
  maximum: 2,
  step: 0.1,
} as const satisfies WidgetInputBoundary

export const DERIVATIVE_INTERVAL_BOUNDARY = {
  key: 'interval',
  label: '两点间距 h',
  minimum: 0.1,
  maximum: 1,
  step: 0.1,
} as const satisfies WidgetInputBoundary

export const DERIVATIVE_COMPLETION_INTERVAL = 0.2

export const derivativeTangentMetadata = {
  id: DERIVATIVE_TANGENT_WIDGET_ID,
  version: 1,
  title: '切线与斜率探索器',
  learningObjective: '通过割线逼近切线，观察导数作为局部变化率的含义。',
  inputBoundaries: [DERIVATIVE_POINT_BOUNDARY, DERIVATIVE_INTERVAL_BOUNDARY],
  completionCriteria: '移动基准点，并将两点间距缩小到 0.2 或更小。',
  staticFallback: '对 f(x)=x²，点 x=a 处的切线斜率为 2a；割线斜率 2a+h 会在 h 缩小时接近它。',
} as const satisfies Omit<WidgetDefinition, 'Component'>
