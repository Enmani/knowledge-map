import { DerivativeTangentExplorer } from './DerivativeTangentExplorer'
import { DERIVATIVE_TANGENT_WIDGET_ID, isWidgetId, type WidgetId } from './catalog'
import { derivativeTangentMetadata } from './derivativeTangentSpec'
import type { WidgetDefinition } from './types'

const definitions = {
  [DERIVATIVE_TANGENT_WIDGET_ID]: {
    ...derivativeTangentMetadata,
    Component: DerivativeTangentExplorer,
  },
} satisfies Record<WidgetId, WidgetDefinition>

export const widgetRegistry: Readonly<Record<WidgetId, WidgetDefinition>> = definitions

export function getWidgetDefinition(widgetId: string): WidgetDefinition | undefined {
  return isWidgetId(widgetId) ? widgetRegistry[widgetId] : undefined
}
