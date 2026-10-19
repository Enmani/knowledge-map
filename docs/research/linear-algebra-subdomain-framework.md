# 线性代数子域框架

本文记录线性代数子域的入门顺序、节点边界、学习依赖、内容宿主和二维/三维复用方式。运行时代码以 `src/domain/conceptIdentity.ts`、`src/features/map/linearAlgebraSceneContent.ts`、`src/features/map/sceneCatalog.ts`、`src/features/space3d/linearAlgebraSubspace.ts` 与 `src/features/space3d/subspaceRegistry.ts` 为准。

## 设计结论

- 线性代数保持为一个可下钻子域，不为基础章节增加额外导航层。
- 18 个内部节点按“直观基础、方程计算、空间结构、几何与谱、进阶工具”五个学习场域渐进显示。
- 公共 `vectors-coordinates` 是“向量与坐标”的唯一规范概念；子域中的 `linear-algebra:vectors-coordinates` 是共享内容与学习进度的上下文投影。
- 公共 `linear-algebra` 的严格前置为初等代数与向量；证明方法降为建议前置。
- 二维与三维复用同一组 18 个子域运行时 ID、文字、严格前置和内容解析规则。
- Matrix World 继续只挂载在终端综合节点“矩阵性质图谱”。

这一顺序参考了 MIT 18.06SC、Georgia Tech *Interactive Linear Algebra* 和 Gilbert Strang *Introduction to Linear Algebra* 的首门课程路线。以向量空间和线性映射直接开篇的抽象路线仍然有效，但更接近 Sheldon Axler 明确定位为第二门线性代数课程的组织方式，不作为本项目的公共入口。

## 五个学习场域与内容宿主

| 场域 | 稳定概念 ID | 节点 | 唯一内容职责 |
| --- | --- | --- | --- |
| 直观基础 | `linear-algebra:vectors-coordinates` | 向量与坐标 | 投影到公共 `vectors-coordinates`；分量、方向、加法、数乘、点与向量 |
| 直观基础 | `linear-algebra:linear-combinations-span` | 线性组合与张成 | 组合系数、张成的直线/平面直观、`Ax=b` 的列组合入口 |
| 直观基础 | `linear-algebra:matrix-basics-operations` | 矩阵的形状与基本运算 | 行、列、尺寸、元素、转置、加法、数乘 |
| 方程计算 | `linear-algebra:linear-systems-elimination` | 线性方程组与高斯消元 | `Ax=b`、增广矩阵、行变换、阶梯形、参数解与 LU 来源 |
| 方程计算 | `linear-algebra:linear-maps-matrix-representations` | 矩阵乘法、线性变换与逆 | 矩阵乘向量、复合、逆矩阵、换基与相似 |
| 空间结构 | `linear-algebra:vector-spaces-bases` | 向量空间、基与维数 | 向量空间推广、线性无关、基、坐标、维数 |
| 空间结构 | `linear-algebra:fundamental-subspaces-rank` | 基本子空间、秩与零化度 | 列/行/零空间、秩—零化度、CR 分解 |
| 空间结构 | `linear-algebra:determinants-invertibility` | 行列式、可逆性与体积 | 方阵限定、面积/体积缩放、可逆矩阵定理 |
| 几何与谱 | `linear-algebra:inner-products-orthogonality-projections` | 内积、长度、正交与投影 | 范数、夹角、正交基、一般/正交投影 |
| 几何与谱 | `linear-algebra:least-squares-qr` | 投影、最小二乘与 QR | 最近点、残差、正规方程、Gram–Schmidt、薄 QR 条件 |
| 几何与谱 | `linear-algebra:eigenvalues-diagonalization` | 特征值、特征向量与对角化 | 特征方向、特征多项式、完整特征向量基与对角化 |
| 几何与谱 | `linear-algebra:normal-symmetric-definite-matrices` | 对称矩阵、二次型与正定性 | 实对称谱定理、二次型、PSD/PD、协方差 |
| 进阶工具 | `linear-algebra:matrix-factorizations` | 矩阵分解路线图 | 比较 CR、LU、QR、特征分解和 SVD；不重复各自推导 |
| 进阶工具 | `linear-algebra:singular-values-low-rank` | 奇异值、SVD 与低秩近似 | 完整/紧致 SVD、截断 SVD、PCA 与图像压缩 |
| 进阶工具 | `linear-algebra:pseudoinverse-minimum-norm` | 伪逆与最小范数解 | SVD 伪逆、秩亏与欠定系统、最小范数选择 |
| 进阶工具 | `linear-algebra:normal-unitary-matrices` | 复内积、正规与酉矩阵 | 共轭转置、酉矩阵、复正规谱定理、数域边界 |
| 进阶工具 | `linear-algebra:jordan-generalized-eigenvectors` | Jordan 形与广义特征向量 | 缺陷矩阵、广义特征向量链、Jordan 块与数值边界 |
| 进阶工具 | `linear-algebra:matrix-properties-atlas` | 矩阵性质图谱 | 类型包含与交叠、性质与分解区别、Matrix World 图解 |

## 规范概念与上下文投影

`vectors-coordinates` 位于公共数学基础区域，并同时具有数学、物理和计算机科学领域归属。线性代数内部仍显示“向量与坐标”，但该节点通过 `canonicalConceptId` 指向公共概念。`resolveCanonicalConceptId` 在内容查询和进度存储前解析这一身份，因此：

- 两个入口读取同一张正式卡片；
- 在任一入口发现或掌握向量，另一入口立即读取同一进度；
- 三维运行时仍使用唯一的 `linear-algebra:vectors-coordinates` 图元 ID，不与公共图元冲突；
- 子域注册表校验所有规范概念引用必须存在于公共知识空间。

公共概念还承担跨学科连接：以“位移与力的分解”应用于经典力学，以“坐标与空间变换”应用于计算机图形学，并通过“特征向量表示”与机器学习共享模型。这三条关系用于揭示迁移方向，不作为严格前置，因此不会把物理或计算机方向强加给线性代数初学者。

现有“向量几何”不是基础向量的别名。它继续负责内积、外积、投影和空间变换，并以公共向量与解析几何为严格前置、线性代数为建议前置。

## 关系事实

子域共有 38 条关系：31 条严格前置、2 条建议前置、2 条共享模型和 3 条应用。

### 严格前置

1. 向量与坐标 → 线性组合与张成。
2. 向量与坐标 → 矩阵的形状与基本运算。
3. 线性组合与张成 → 线性方程组与高斯消元。
4. 矩阵的形状与基本运算 → 线性方程组与高斯消元。
5. 线性组合与张成 → 矩阵乘法、线性变换与逆。
6. 矩阵的形状与基本运算 → 矩阵乘法、线性变换与逆。
7. 线性组合与张成 → 向量空间、基与维数。
8. 线性方程组与高斯消元 → 向量空间、基与维数。
9. 线性方程组与高斯消元 → 基本子空间、秩与零化度。
10. 向量空间、基与维数 → 基本子空间、秩与零化度。
11. 矩阵乘法、线性变换与逆 → 行列式、可逆性与体积。
12. 基本子空间、秩与零化度 → 行列式、可逆性与体积。
13. 向量空间、基与维数 → 内积、长度、正交与投影。
14. 线性方程组与高斯消元 → 投影、最小二乘与 QR。
15. 内积、长度、正交与投影 → 投影、最小二乘与 QR。
16. 矩阵乘法、线性变换与逆 → 特征值、特征向量与对角化。
17. 行列式、可逆性与体积 → 特征值、特征向量与对角化。
18. 内积、长度、正交与投影 → 对称矩阵、二次型与正定性。
19. 特征值、特征向量与对角化 → 对称矩阵、二次型与正定性。
20. 投影、最小二乘与 QR → 矩阵分解路线图。
21. 特征值、特征向量与对角化 → 矩阵分解路线图。
22. 基本子空间、秩与零化度 → 奇异值、SVD 与低秩近似。
23. 对称矩阵、二次型与正定性 → 奇异值、SVD 与低秩近似。
24. 投影、最小二乘与 QR → 伪逆与最小范数解。
25. 奇异值、SVD 与低秩近似 → 伪逆与最小范数解。
26. 内积、长度、正交与投影 → 复内积、正规与酉矩阵。
27. 特征值、特征向量与对角化 → 复内积、正规与酉矩阵。
28. 特征值、特征向量与对角化 → Jordan 形与广义特征向量。
29. 行列式、可逆性与体积 → 矩阵性质图谱。
30. 对称矩阵、二次型与正定性 → 矩阵性质图谱。
31. 矩阵分解路线图 → 矩阵性质图谱。

### 补充语义关系

- 基本子空间、秩与零化度 → 矩阵分解路线图：建议前置“CR 分解与秩”。
- 矩阵分解路线图 → 奇异值、SVD 与低秩近似：建议前置“分解方法全景”。
- 线性方程组与高斯消元 → 矩阵分解路线图：应用“LU 保存消元步骤”。
- 内积、长度、正交与投影 → 矩阵分解路线图：应用“正交化产生 QR”。
- 矩阵分解路线图 → 伪逆与最小范数解：应用“QR/SVD 求解”。
- 复内积、正规与酉矩阵 → 矩阵性质图谱：共享模型“正规类别的复数框架”。
- Jordan 形与广义特征向量 → 矩阵性质图谱：共享模型“不可对角化分支”。

## 内容迁移规则

公共父卡只保留领域定义和五阶段下钻路线。18 个子域节点中，向量投影读取公共向量卡，另外 17 个节点分别拥有正式内容记录：

- 线性组合与张成不再塞进“向量空间、基与维数”。
- 矩阵的行列、尺寸、转置、加法和数乘不再假定为已知。
- 最小二乘与 QR 从一般投影和伪逆中独立出来。
- Jordan 形不再与初次特征值学习绑定。
- 复正规与酉矩阵不再和实对称、PSD/PD、协方差混写。
- 矩阵分解路线图只负责比较；CR、LU、QR、特征分解和 SVD 的推导分别留在秩、消元、最小二乘、特征值和 SVD 节点。

Matrix World 的三个视图仍只挂载在“矩阵性质图谱”：类型关系比较矩阵性质，分解条件导航到实际内容宿主，应用线索分别通往协方差、低秩近似和伪逆。

## 数学边界

- 基础向量、向量空间元素、向量几何和向量场是相关但不同的概念。
- 矩阵是选定基后的线性映射表示，不把二者写成同一个对象。
- 行列式和通常意义下的特征值只用于方阵；秩、SVD 与伪逆适用于矩形矩阵。
- 对角化要求完整的线性无关特征向量基；Jordan 形明确采用复数域，实数域可使用 2×2 实块。
- 复正规矩阵满足 `A*A=AA*` 并可酉对角化；一般实正规矩阵不保证存在实 `QΛQᵀ`。
- `P²=P` 定义一般投影；再加 `Pᵀ=P` 才是正交投影。
- PSD/PD 采用实对称约定。协方差总是 PSD，只有非退化且满秩时才 PD。
- 经典薄 QR 明确要求 `m≥n` 且满列秩；一般消元分解写成 `PA=LU`。
- SVD 不要求方阵、满秩或可对角化。伪逆不是普通逆的无条件替代。

## 数据与视图复用

二维与三维从同一 `linearAlgebraSceneNodes` 生成节点。三维适配器移除一次 `linear-algebra:` 前缀，公共工厂再添加相同前缀，因此两种视图保持完全相同的 18 个运行时 ID。五个学习阶段同时作为二维场域和三维局部标签场，三维另增加一个数学领域场，共 6 个局部场。

二维渲染 31 条严格前置以保持推进布局清晰。三维在同一严格图上增加 7 条补充语义关系，并由公共工厂验证重复节点、域外引用、自指、重复关系和严格前置环。

## 资料来源

- Gilbert Strang, *Introduction to Linear Algebra*, Sixth Edition, Wellesley-Cambridge Press, 2023. <https://math.mit.edu/~gs/linearalgebra/ila6/indexila6.html>
- Gilbert Strang and MIT OpenCourseWare, *18.06SC Linear Algebra: Syllabus*, 2011. <https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/syllabus/>
- Dan Margalit and Joseph Rabinoff, *Interactive Linear Algebra*, Georgia Institute of Technology, 2019. <https://textbooks.math.gatech.edu/ila/>
- Sheldon Axler, *Linear Algebra Done Right*, Fourth Edition. <https://linear.axler.net/>
- Kenji Hiranabe, *The Art of Linear Algebra: Matrix World*, CC0-1.0. <https://github.com/kenjihiranabe/The-Art-of-Linear-Algebra>

以上网页于 2026-08-03 访问。Matrix World 的项目内重绘继续在 `THIRD_PARTY_NOTICES.md` 保留原作与许可说明。
