# Repository Instructions

## 功能手册同步

产品功能、交互行为、视觉状态、数据约束、架构边界或参数阈值发生变化时，在同一轮修改中同步更新 `功能手册维基百科` 内对应页面。代码、测试和手册应描述一致的当前行为。新增跨页面规则时同时更新相关页面的验收标准。

## 知识卡片写作前置

新增或重写任何知识卡片介绍以前，必须完整阅读 `docs/CONTENT_TEMPLATE.md`，并阅读该规范“参考案例”链接指向的 `src/content/calculus.ts` 实际版本。不得只依据旧卡片摘要、标签或二手摘录开始写作；段落格式、行文风格、来源和互动说明均以规范及参考案例为准。

## 动态知识图标设计前置

新增、重制或实现任何知识卡片动态图标以前，必须完整阅读 `docs/ICON_DESIGN.md`，并参考 `?demo=concept-icons` 示例页及其实现 `src/features/concept-icons/ConceptIconLab.tsx`、`src/features/concept-icons/ConceptIconLab.css` 的视觉语言与完成度。设计规则、几何关系、固定 4 秒周期和循环策略以 `docs/ICON_DESIGN.md` 为准；优先使用自然闭环，无法保持概念或几何正确时才考虑倒放回程。示例页只作为视觉参考，存在冲突时不得沿用示例中的旧参数或旧运动方式。
