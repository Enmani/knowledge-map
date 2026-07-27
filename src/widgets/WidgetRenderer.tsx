import type React from 'react'
import { getWidgetDefinition } from './registry'
import type { WidgetCompletionEvent } from './types'
import { UnknownWidget } from './UnknownWidget'

export interface WidgetRendererProps {
  widgetId: string
  conceptId: string
  className?: string
  onComplete?: (event: WidgetCompletionEvent) => void
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widgetId,
  conceptId,
  className,
  onComplete,
}) => {
  const definition = getWidgetDefinition(widgetId)
  const RegisteredComponent = definition?.Component

  return RegisteredComponent ? (
    <RegisteredComponent
      conceptId={conceptId}
      className={className}
      onComplete={onComplete}
    />
  ) : (
    <UnknownWidget widgetId={widgetId} className={className} />
  )
}
