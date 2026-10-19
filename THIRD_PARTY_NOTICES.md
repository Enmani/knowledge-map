# 第三方许可说明

项目通过 npm 使用下列直接依赖。完整版本与传递依赖记录在 `package-lock.json`。

| 软件 | 许可 |
| --- | --- |
| React、React DOM、PixiJS、Three.js、Vite、@vitejs/plugin-react | MIT |
| TypeScript | Apache-2.0 |
| Lucide React、d3-interpolate | ISC |

界面运行时从 Google Fonts 加载 DM Sans 与 Noto Serif SC，两者采用 SIL Open Font License 1.1。字体文件当前不保存在本仓库中。

## 图解来源

线性代数子域“矩阵性质图谱”卡片中的“矩阵世界：性质关系与分解入口”参考 Kenji Hiranabe 在 Gilbert Strang 协助下绘制的 **Matrix World**。项目没有打包上游图片文件，而是依据原作重新组织中文信息层级，并修订正规矩阵、QR、带主元 LU、Jordan 形、正交投影与协方差矩阵的适用条件。

- 原作仓库：<https://github.com/kenjihiranabe/The-Art-of-Linear-Algebra>
- 原作作者：Kenji Hiranabe；with the help of Prof. Gilbert Strang
- 原作许可：CC0 1.0 Universal
- 本项目修改：拆分为“类型关系、分解条件、应用线索”三个视图，重绘全部图形与文字，并加入中文说明、明暗主题和可访问文本。

第三方软件和字体仍受各自许可约束。依赖源码、版权声明和完整许可文本可从对应软件包与上游项目获取。
