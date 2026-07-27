import type { ComponentType } from 'react'
import type { WidgetId } from './catalog'

export interface WidgetInputBoundary {
  key: string
  label: string
  minimum: number
  maximum: number
  step: number
  unit?: string
}

export interface WidgetCompletionEvent {
  conceptId: string
  widgetId: WidgetId
  widgetVersion: number
  completedAt: string
  values: Readonly<Record<string, number>>
}

export interface RegisteredWidgetProps {
  conceptId: string
  className?: string
  onComplete?: (event: WidgetCompletionEvent) => void
}

export interface WidgetDefinition {
  id: WidgetId
  version: number
  title: string
  learningObjective: string
  inputBoundaries: readonly WidgetInputBoundary[]
  completionCriteria: string
  staticFallback: string
  Component: ComponentType<RegisteredWidgetProps>
}
