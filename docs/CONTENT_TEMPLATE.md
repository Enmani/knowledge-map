# 内容条目模板

内容条目以稳定概念 ID 关联知识图谱。新增条目时复制以下结构，并在构建前通过内容校验。

```ts
import type { KnowledgeCardContent } from '../src/content/types'

export const exampleContent = {
  id: 'content:concept-id',
  conceptId: 'concept-id',
  summary: '概念摘要。',
  storyParagraphs: [
    { id: 'story-id', text: '经过来源核验的故事正文。' },
  ],
  sources: [
    {
      id: 'source-id',
      kind: 'textbook',
      title: '来源标题',
      creators: ['作者'],
      publishedYear: 2026,
      locator: '章节或页码',
    },
  ],
  frontierStatus: 'established',
  reviewedAt: '2026-07-25',
  reviewDue: '2027-07-25',
  widgetIds: [],
} satisfies KnowledgeCardContent
```

条目需要加入 `src/content/index.ts` 的目录。来源类型、研究状态和日期格式以 `src/content/types.ts` 为准。互动组件 ID 需要先在 `src/widgets/registry.ts` 登记。
