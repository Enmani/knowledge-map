# 数域 · 互动数学知识地图

[![CI](https://github.com/Enmani/knowledge-map/actions/workflows/ci.yml/badge.svg)](https://github.com/Enmani/knowledge-map/actions/workflows/ci.yml)
[![Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-blue.svg)](./LICENSE)
[![CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-lightgrey.svg)](./LICENSE-CONTENT.md)

一个可缩放、可拖拽的开源数学知识白板，用前置关系展示知识如何逐层解锁。项目正在从数学地图扩展为连接数学、物理、化学和生物的理科知识空间。

## 已实现

- 46 个数学全景主节点，覆盖数学基础、代数、几何与拓扑、分析、离散数学、概率统计、应用数学
- 15 个主图可钻取子空间和 1 个嵌套子空间投影，包含 69 个子节点投影
- 每个知识点同时拥有共享场域标签与具体主题标签
- 共享标签通过确定性引力布局自动聚集，不依赖手绘区域
- 自动布局包含矩形防碰撞投影，节点之间始终保留安全间距
- 标签成员自动生成模糊气泡场；相邻场域使用颜料式混合形成新的叠加色
- 每个模糊场域先合并为一张低分辨率纹理，拖拽与缩放时只更新 WebGL 图层矩阵
- 无限画布式拖拽与滚轮缩放
- 单次按住空白或节点都可拖动画布；移动不足 5px 的节点操作识别为普通单击
- 点击节点高亮完整前置路径
- 显示“已掌握 / 可以学习 / 尚未解锁”三种学习状态
- 搜索、领域筛选、“下一站”推荐与小地图导航
- 学习进度保存在浏览器本地
- 自由浏览和迷雾探索两种模式，进度使用版本化格式保存
- 微积分、实分析、复分析、泛函分析、测度论、傅里叶分析、变分法、微分方程、数值分析等节点包含依赖推进式内部地图
- 根场景与全部子场景使用同一台相机，内部节点随缩放连续显现和消失
- 节点按屏幕投影尺寸切换 LOD，居中放大可钻取节点后自动进入内部地图
- 微积分卡片包含故事、来源和可操作的导数切线组件
- 前沿研究与奖项条目具备来源、发布日期、复核日期、校验和查询基础
- 主画布使用 PixiJS WebGL 保留式渲染，相机、LOD 和父子场景过渡在连续帧中更新
- 桌面与手机响应式布局

## 本地运行

需要 Node.js `^20.19.0` 或 `>=22.12.0`。

```bash
npm ci
npm run dev
```

然后打开终端显示的本地地址。

生产构建：

```bash
npm run build
npm run test:smoke
```

## 扩展地图

主地图知识点集中在 `src/data/mathMap.ts`，分析学子地图内容集中在 `src/features/map/analysisSceneContent.ts`。新增节点时填写领域、简介、`prerequisites` 前置节点 ID、`fieldTags` 共享场域标签和 `tags` 具体标签；布局、气泡场与连线会自动更新。

这张图表达一条通用学习路径。不同专业和学习目标可以使用不同路线。

## 项目结构

- `src/domain`：概念、关系与校验规则
- `src/engine`：场景、进度、LOD 与迷雾逻辑
- `src/renderers`：PixiJS 地图渲染器与渲染内核
- `src/features`：地图场景、导航与交互
- `src/content`、`src/frontier`：故事内容、来源与前沿条目
- `功能手册维基百科`：面向用户和开发者的产品手册

## 参与贡献

欢迎提交问题报告、内容修正和功能改进。开始前请阅读[贡献指南](./CONTRIBUTING.md)和[内容条目模板](./docs/CONTENT_TEMPLATE.md)。产品与开发说明位于[功能手册维基百科](./功能手册维基百科/README.md)。

## 许可

程序代码采用 [Apache License 2.0](./LICENSE)。原创知识内容与文档采用 [CC BY 4.0](./LICENSE-CONTENT.md)。第三方依赖和字体说明见[第三方许可说明](./THIRD_PARTY_NOTICES.md)。
