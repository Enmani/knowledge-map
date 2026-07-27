export const DERIVATIVE_TANGENT_WIDGET_ID = 'derivative-tangent-explorer' as const

export const WIDGET_IDS = [DERIVATIVE_TANGENT_WIDGET_ID] as const

export type WidgetId = (typeof WIDGET_IDS)[number]

const widgetIdSet = new Set<string>(WIDGET_IDS)

export function isWidgetId(value: string): value is WidgetId {
  return widgetIdSet.has(value)
}
