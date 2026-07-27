import type React from 'react'

export interface UnknownWidgetProps {
  widgetId: string
  className?: string
  fallbackText?: string
}

export const UnknownWidget: React.FC<UnknownWidgetProps> = ({
  widgetId,
  className,
  fallbackText = '该互动暂时无法加载。你仍可以阅读本卡片中的文字说明。',
}) => (
  <section className={className} role="status" aria-label="互动组件不可用">
    <strong>互动组件不可用</strong>
    <p>{fallbackText}</p>
    <small>组件 ID：<code>{widgetId}</code></small>
  </section>
)
