import type { ContentSource, KnowledgeCardContent } from './types'

const macTutorMatricesSource = {
  id: 'source:mactutor-matrices-determinants',
  kind: 'institution',
  title: 'Matrices and determinants',
  creators: ['J. J. O\'Connor', 'E. F. Robertson'],
  publisher: 'MacTutor History of Mathematics, University of St Andrews',
  publishedYear: 1996,
  url: 'https://mathshistory.st-andrews.ac.uk/HistTopics/Matrices_and_determinants/',
  accessedAt: '2026-08-03',
} satisfies ContentSource

const strangLinearAlgebraSource = {
  id: 'source:strang-introduction-linear-algebra-sixth',
  kind: 'textbook',
  title: 'Introduction to Linear Algebra, Sixth Edition',
  creators: ['Gilbert Strang'],
  publisher: 'Wellesley-Cambridge Press',
  publishedYear: 2023,
  locator: 'Chapters 1–9 and the matrix factorizations overview',
  url: 'https://math.mit.edu/~gs/linearalgebra/ila6/indexila6.html',
  accessedAt: '2026-08-03',
} satisfies ContentSource

const mitLinearAlgebraSyllabusSource = {
  id: 'source:mit-1806sc-linear-algebra-syllabus',
  kind: 'institution',
  title: '18.06SC Linear Algebra: Syllabus',
  creators: ['Gilbert Strang', 'MIT OpenCourseWare'],
  publisher: 'Massachusetts Institute of Technology',
  publishedYear: 2011,
  locator: 'Course sequence and learning goals',
  url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/syllabus/',
  accessedAt: '2026-08-03',
} satisfies ContentSource

const gatechInteractiveLinearAlgebraSource = {
  id: 'source:gatech-interactive-linear-algebra',
  kind: 'textbook',
  title: 'Interactive Linear Algebra',
  creators: ['Dan Margalit', 'Joseph Rabinoff'],
  publisher: 'School of Mathematics, Georgia Institute of Technology',
  publishedYear: 2019,
  locator: 'Chapters 1–6',
  url: 'https://textbooks.math.gatech.edu/ila/',
  accessedAt: '2026-08-03',
  license: 'GNU Free Documentation License 1.3',
} satisfies ContentSource

const mitMatrixFactorizationsSource = {
  id: 'source:mit-18065-matrix-factorizations',
  kind: 'institution',
  title: 'Lecture 2: Multiplying and Factoring Matrices',
  creators: ['Gilbert Strang'],
  publisher: 'MIT OpenCourseWare',
  publishedYear: 2018,
  locator: '18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning',
  url: 'https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/resources/lecture-2-multiplying-and-factoring-matrices/',
  accessedAt: '2026-08-03',
} satisfies ContentSource

const mitSvdSource = {
  id: 'source:mit-1806-singular-value-decomposition',
  kind: 'institution',
  title: 'Singular Value Decomposition',
  creators: ['Gilbert Strang', 'MIT OpenCourseWare'],
  publisher: 'Massachusetts Institute of Technology',
  publishedYear: 2011,
  locator: '18.06SC Linear Algebra, Unit III',
  url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/positive-definite-matrices-and-applications/singular-value-decomposition/',
  accessedAt: '2026-08-03',
} satisfies ContentSource

const mitLowRankSource = {
  id: 'source:mit-18065-low-rank-image-compression',
  kind: 'institution',
  title: 'Lecture 17: Rapidly Decreasing Singular Values',
  creators: ['Alex Townsend'],
  publisher: 'MIT OpenCourseWare',
  publishedYear: 2018,
  locator: 'Low-rank matrices and image compression',
  url: 'https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/resources/lecture-17-rapidly-decreasing-singular-values/',
  accessedAt: '2026-08-03',
} satisfies ContentSource

const stanfordGaussianSource = {
  id: 'source:stanford-cs229-multivariate-gaussian',
  kind: 'institution',
  title: 'The Multivariate Gaussian Distribution',
  creators: ['Chuong B. Do'],
  publisher: 'Stanford University CS229',
  publishedYear: 2008,
  locator: 'Section 2: The covariance matrix',
  url: 'https://cs229.stanford.edu/section/gaussians.pdf',
  accessedAt: '2026-08-03',
} satisfies ContentSource

const hiranabeMatrixWorldSource = {
  id: 'source:hiranabe-matrix-world',
  kind: 'archive',
  title: 'The Art of Linear Algebra: Matrix World',
  creators: ['Kenji Hiranabe'],
  publisher: 'GitHub',
  locator: 'MatrixWorld.png and MatrixWorld-zh-CN.png',
  url: 'https://github.com/kenjihiranabe/The-Art-of-Linear-Algebra',
  accessedAt: '2026-08-03',
  license: 'CC0-1.0',
} satisfies ContentSource

const reviewMetadata = {
  frontierStatus: 'established' as const,
  reviewedAt: '2026-08-03' as const,
  reviewDue: '2027-08-03' as const,
  widgetIds: [],
}

export const vectorsCoordinatesContent = {
  id: 'content:vectors-coordinates',
  conceptId: 'vectors-coordinates',
  summary: '向量用一组有次序的分量共同描述方向、位移或多项属性，并通过加法和数乘组合变化。',
  sections: [
    {
      id: 'vectors-coordinates-what-is-a-vector',
      title: '什么是向量',
      paragraphs: [
        '一个温度可以用一个数表示，但一次位移通常同时包含向东和向北的变化，一条商品记录也可能同时包含价格、重量和库存。遇到这种由多个分量共同决定的对象时，可以把相关数值按固定次序组成向量。二维向量常写成 (x,y)，三维向量写成 (x,y,z)，更高维向量仍遵循相同的分量规则。',
        '在几何中，向量可以画成带方向的箭头：箭头的长度表示大小，朝向表示方向。坐标只是选定坐标轴后对同一个向量的描述；改变坐标系会改变分量，却不会改变它所表示的位移或方向。',
      ],
    },
    {
      id: 'vectors-coordinates-basic-operations',
      title: '向量怎样相加和缩放',
      paragraphs: [
        '两个同样维数的向量相加时，对应分量分别相加。几何上，这相当于先完成第一个位移，再从它的终点完成第二个位移。一个数乘向量会同时缩放全部分量；正数保持方向，负数还会反转方向。',
        '这些运算解释了为什么向量适合表示可以叠加的变化。多个力可以相加得到合力，多段位移可以相加得到总位移，多项特征也可以按权重组合成新的数据表示。',
      ],
      formulas: [
        {
          id: 'vectors-coordinates-addition-formula',
          expression: '(a₁,…,aₙ) + (b₁,…,bₙ) = (a₁+b₁,…,aₙ+bₙ)',
          explanation: '只有维数相同的向量才能按对应分量相加。',
        },
        {
          id: 'vectors-coordinates-scalar-multiplication-formula',
          expression: 'c(a₁,…,aₙ) = (ca₁,…,caₙ)',
          explanation: '标量 c 同时缩放向量的每个分量。',
        },
      ],
    },
    {
      id: 'vectors-coordinates-points-and-vectors',
      title: '点和向量有什么区别',
      paragraphs: [
        '坐标相同并不意味着点和向量是同一种对象。点表示空间中的位置，向量表示从一个位置到另一个位置的变化。两个点相减得到连接它们的位移向量，一个点加上向量则得到移动后的新位置。',
        '这个区别在解析几何、物理和计算机图形学中尤其重要。线性代数随后会进一步研究向量怎样组合、哪些方向彼此独立，以及矩阵如何把输入向量变成输出向量。',
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, gatechInteractiveLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const linearAlgebraOverviewContent = {
  id: 'content:linear-algebra',
  conceptId: 'linear-algebra',
  summary: '线性代数从向量、矩阵和联立方程出发，研究可叠加关系背后的空间结构、几何和变换。',
  sections: [
    {
      id: 'linear-algebra-overview',
      title: '线性代数研究什么',
      paragraphs: [
        '一张图片包含许多像素，一次实验可能同时记录温度、压力和流量，一座建筑也需要用多个坐标描述位置与受力。当许多量彼此关联，并且关系需要同时满足时，逐个处理容易失去整体结构；线性代数先把它们组织成向量和矩阵，再用方程、空间和变换研究其中的关系。',
        '“线性”意味着叠加和缩放能够保持：先把输入按比例组合再进行变换，与先分别变换再按相同比例组合得到同样结果。平移、饱和和阈值判断通常不是线性的，不过许多复杂过程在局部范围内可以近似为线性过程，因此线性模型也是分析非线性问题的重要起点。',
        '第一次进入子域时不需要预先掌握抽象向量空间或完整证明方法。公共“向量与坐标”节点会作为共享入口；证明方法是建议前置，用来帮助理解后续定理，但基础计算路线可以先从具体例子开始。',
      ],
    },
    {
      id: 'linear-algebra-route',
      title: '怎样进入这张子地图',
      paragraphs: [
        '地图分成五个学习场域。直观基础先解释向量、线性组合和矩阵记号；方程计算进入 Ax=b、消元、矩阵乘法与变换；空间结构再引入基、维数、秩和行列式；几何与谱研究正交、最小二乘、特征值和对称矩阵。',
        'SVD、伪逆、复正规矩阵、Jordan 形和矩阵性质图谱位于进阶工具场域。它们仍然保留在同一子域中，但不会阻挡基础主线；Matrix World 只在最后的综合节点中用于复习性质和分解入口。',
      ],
    },
  ],
  sources: [mitLinearAlgebraSyllabusSource, gatechInteractiveLinearAlgebraSource, strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const linearCombinationsSpanContent = {
  id: 'content:linear-algebra:linear-combinations-span',
  conceptId: 'linear-algebra:linear-combinations-span',
  summary: '线性组合先缩放再相加向量；所有可能组合得到的集合称为这些向量的张成。',
  sections: [
    {
      id: 'linear-algebra-linear-combinations',
      title: '怎样用已有方向生成新向量',
      paragraphs: [
        '假设手中有两个方向向量 u 和 v。先分别选择系数 a、b，再把 au 与 bv 相加，就得到一个线性组合 au+bv。改变系数相当于改变沿两个方向行进的距离，因此同一组向量可以生成许多不同结果。',
        '如果两个二维向量不共线，它们的组合能够到达整个平面；如果二者共线，无论怎样改变系数，结果仍停留在同一条直线上。张成正是所有这些可能结果组成的集合。',
      ],
      formulas: [
        {
          id: 'linear-algebra-linear-combination-formula',
          expression: 'a₁v₁ + a₂v₂ + ⋯ + aₖvₖ',
          explanation: '系数可以取任意标量，结果仍是与原向量同一类的对象。',
        },
      ],
    },
    {
      id: 'linear-algebra-span-and-systems',
      title: '张成为什么会通向方程组',
      paragraphs: [
        '给定目标向量 b，询问它能否由 v₁,…,vₖ 组合出来，就是寻找一组系数使 a₁v₁+⋯+aₖvₖ=b。把生成向量依次放成矩阵的列，问题便可以写成 Ax=b。',
        '因此，“方程组是否有解”与“目标是否落在列的张成中”是同一个问题的代数和几何表达。后续的线性无关、基和秩会进一步回答哪些生成方向是多余的。',
      ],
      formulas: [
        {
          id: 'linear-algebra-span-matrix-equation-formula',
          expression: 'Ax = b  ⇔  b 是 A 各列的线性组合',
          explanation: 'x 的每个分量就是相应矩阵列的组合系数。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, gatechInteractiveLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const matrixBasicsOperationsContent = {
  id: 'content:linear-algebra:matrix-basics-operations',
  conceptId: 'linear-algebra:matrix-basics-operations',
  summary: '矩阵是按行和列排列的数表；尺寸决定可以进行哪些运算，也决定它能接受和产生几维向量。',
  sections: [
    {
      id: 'linear-algebra-matrix-shape',
      title: '怎样阅读一个矩阵',
      paragraphs: [
        '一个 m×n 矩阵有 m 行和 n 列。第 i 行、第 j 列的元素记作 aᵢⱼ。行可以理解为一条约束怎样读取输入，列则可以理解为某个输入分量对输出产生的完整影响。',
        '矩阵既可以保存数据，也可以表示方程系数或线性变换。相同的矩阵记号能够承担不同角色，阅读时需要先问清行、列和元素分别代表什么。',
      ],
    },
    {
      id: 'linear-algebra-matrix-basic-operations',
      title: '哪些基本运算需要检查尺寸',
      paragraphs: [
        '只有尺寸相同的矩阵才能逐元素相加。标量乘矩阵会把每个元素同时缩放。转置 Aᵀ 会交换行和列，因此 m×n 矩阵的转置是 n×m 矩阵。',
        '这些规则看起来简单，却是后续计算最常见的检查点。矩阵乘法、方程 Ax=b、对称条件 Aᵀ=A 和各种分解都依赖尺寸匹配；先写出每个对象的尺寸，通常能够在计算前发现错误。',
      ],
      formulas: [
        {
          id: 'linear-algebra-matrix-transpose-entry-formula',
          expression: '(Aᵀ)ᵢⱼ = Aⱼᵢ',
          explanation: '转置将原矩阵的第 j 行第 i 列移到第 i 行第 j 列。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, gatechInteractiveLinearAlgebraSource, macTutorMatricesSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const vectorSpacesBasesContent = {
  id: 'content:linear-algebra:vector-spaces-bases',
  conceptId: 'linear-algebra:vector-spaces-bases',
  summary: '向量空间把向量运算推广到更多对象；线性无关、基与维数说明一个空间需要多少独立方向。',
  sections: [
    {
      id: 'linear-algebra-vector-spaces-generalization',
      title: '向量空间怎样推广坐标向量',
      paragraphs: [
        '坐标向量可以相加，也可以乘以标量。多项式、函数、矩阵和信号同样可能具有这两种运算，并满足封闭性、结合律、分配律、零向量和加法逆元等规则。把这些共同规则抽取出来，就得到向量空间。',
        '这种推广让线性代数不再局限于平面或三维空间。例如次数不超过二次的多项式可以用 1、x、x² 作为三个独立方向；对它们进行线性组合，与组合三个坐标方向遵循相同结构。',
      ],
    },
    {
      id: 'linear-algebra-bases-dimension',
      title: '基是空间的坐标尺',
      paragraphs: [
        '一组既线性无关、又能张成整个空间的向量称为一组基。向量本身不会因换基而改变，改变的是描述它所使用的坐标。有限维空间的任意两组基都含有相同数量的向量，这个数量就是空间的维数。',
        '基的选择会显著影响计算难度。标准坐标基便于直接读取分量，正交归一基便于计算长度和投影，由特征向量组成的基则可能把复杂变换化成逐坐标缩放。许多矩阵分解本质上都在寻找适合当前问题的基。',
      ],
      formulas: [
        {
          id: 'linear-algebra-basis-coordinate-formula',
          expression: 'v = c₁b₁ + c₂b₂ + ⋯ + cₙbₙ',
          explanation: '当 b₁,…,bₙ 构成一组基时，每个向量 v 都有唯一的一组坐标 c₁,…,cₙ。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const linearMapsMatrixRepresentationsContent = {
  id: 'content:linear-algebra:linear-maps-matrix-representations',
  conceptId: 'linear-algebra:linear-maps-matrix-representations',
  summary: '矩阵乘向量组合矩阵的列，矩阵乘法复合线性变换，可逆矩阵则能够撤销一个方阵变换。',
  sections: [
    {
      id: 'linear-algebra-linearity-and-matrices',
      title: '矩阵乘法怎样表示连续的变换',
      paragraphs: [
        '矩阵 A 与向量 x 相乘时，x 的各个分量决定怎样组合 A 的列，结果 y 是输出向量。只要一个变换保持向量加法和数乘，就称为线性变换；知道它怎样作用于一组基，便能决定它对所有输入的作用。',
        '矩阵乘法 AB 表示变换的复合：右侧 B 先作用，左侧 A 后作用。先旋转再拉伸与先拉伸再旋转通常得到不同结果，因此矩阵乘法一般不能交换顺序。',
      ],
      formulas: [
        {
          id: 'linear-algebra-linearity-formula',
          expression: 'T(αu + βv) = αT(u) + βT(v)',
          explanation: '线性映射保持向量的线性组合。',
        },
        {
          id: 'linear-algebra-matrix-map-formula',
          expression: 'y = Ax',
          explanation: 'A 表示选定基下的线性映射，x 是输入坐标，y 是输出坐标。',
        },
      ],
    },
    {
      id: 'linear-algebra-change-of-basis',
      title: '逆变换和换基分别改变什么',
      paragraphs: [
        '如果方阵 A 存在逆矩阵 A⁻¹，那么先作用 A 再作用 A⁻¹ 会回到原向量。单位矩阵 I 表示什么也不改变的恒等变换，因此 AA⁻¹=A⁻¹A=I。长方形矩阵通常没有这种双侧逆，奇异方阵也会因为压掉某些方向而无法恢复输入。',
        '同一个线性映射在不同基下会有不同矩阵。对从一个空间映到自身的线性算子，若 P 的列是新基向量在旧基中的坐标，那么新矩阵写成 P⁻¹A P。由此联系的矩阵称为相似矩阵；它们的坐标表示不同，却保留特征值、行列式和迹等内在信息。',
      ],
      formulas: [
        {
          id: 'linear-algebra-inverse-matrix-formula',
          expression: 'AA⁻¹ = A⁻¹A = I',
          explanation: '双侧逆只适用于可逆方阵，并表示一个线性变换能够被完整撤销。',
        },
        {
          id: 'linear-algebra-change-of-basis-formula',
          expression: 'A_new = P⁻¹A_oldP',
          explanation: '当 P 的列记录新基在旧基中的坐标时，相似变换给出同一线性算子的另一种矩阵表示。',
        },
      ],
    },
    {
      id: 'linear-algebra-matrix-history',
      title: '矩阵怎样成为独立对象',
      paragraphs: [
        '矩阵最初依附于联立方程和行列式。西尔维斯特在1850年使用“matrix”一词，凯莱随后研究矩阵的加法、乘法和逆，并在1858年的论文中给出抽象矩阵理论。矩阵乘法不必交换顺序，正是因为它表示映射的复合。',
      ],
    },
  ],
  sources: [macTutorMatricesSource, strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const linearSystemsEliminationContent = {
  id: 'content:linear-algebra:linear-systems-elimination',
  conceptId: 'linear-algebra:linear-systems-elimination',
  summary: '线性方程组统一写成 Ax=b；增广矩阵和高斯消元用于判断相容性、求出主元并描述全部解。',
  sections: [
    {
      id: 'linear-algebra-systems-history',
      title: '从联立方程开始的历史',
      paragraphs: [
        '线性代数最早面对的不是抽象空间，而是联立方程。中国古代《九章算术》的方程章已经把各方程的系数排列在算筹阵列中，并通过逐步消去未知量求解；这种操作与今天对增广矩阵进行消元有直接的算法联系。',
        '19世纪初，高斯在天文数据计算中系统使用消元方法，使这类算法以他的名字广为人知，不过相似的消元思想出现得更早。现代消元把每一步行变换组织成可复现算法，也构成 LU 分解的基础。',
      ],
    },
    {
      id: 'linear-algebra-systems-solvability',
      title: '什么时候有解',
      paragraphs: [
        '矩阵 A 的每一列表示一个未知量对所有方程的影响，向量 x 给出组合这些列的系数，b 是希望得到的结果。因此 Ax=b 有解，当且仅当 b 位于 A 的列空间。',
        '高斯消元用保持解集的初等行变换把增广矩阵化为阶梯形。主元列识别受约束变量，自由列对应可自由选择的参数；若出现左侧全零而右侧非零的行，方程组不相容。相容系统可能有唯一解，也可能因自由变量而有无穷多个解。',
      ],
      formulas: [
        {
          id: 'linear-algebra-system-formula',
          expression: 'Ax = b  有解  ⇔  b ∈ Col(A)',
          explanation: '方程组的相容性等价于目标向量能够由 A 的列线性组合得到。',
        },
      ],
    },
  ],
  sources: [macTutorMatricesSource, strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const fundamentalSubspacesRankContent = {
  id: 'content:linear-algebra:fundamental-subspaces-rank',
  conceptId: 'linear-algebra:fundamental-subspaces-rank',
  summary: '列空间、行空间和零空间描述矩阵的有效输出、有效约束与被压到零的输入；秩衡量独立信息的维数。',
  sections: [
    {
      id: 'linear-algebra-fundamental-subspaces',
      title: '空间怎样记录信息的去向',
      paragraphs: [
        '有些矩阵列看起来不同，却可能由其他列组合出来。秩 rank(A) 记录线性无关列的数量，也就是线性映射真正能够传递的维数。列空间的维数与行空间的维数总是相等，所以列秩和行秩是同一个数。',
        '零空间 N(A) 包含所有满足 Ax=0 的输入方向。若非零方向位于零空间中，沿该方向改变输入不会改变输出；只要 Ax=b 已经有一个解，就会由此产生更多解。左零空间则记录对行约束的线性依赖。',
      ],
      formulas: [
        {
          id: 'linear-algebra-rank-spaces-formula',
          expression: 'rank(A) = dim Col(A) = dim Row(A)',
          explanation: '矩阵的列空间和行空间具有相同维数。',
        },
        {
          id: 'linear-algebra-rank-nullity-formula',
          expression: 'rank(A) + dim N(A) = n',
          explanation: '当 A 有 n 列时，有效输出方向与被压到零的输入方向合计为 n 维。',
        },
      ],
    },
    {
      id: 'linear-algebra-rank-factorization',
      title: 'CR 分解直接显露秩',
      paragraphs: [
        '秩为 r 的矩阵都可以写成 A=CR，其中 C 由 A 的 r 个线性无关列组成，R 记录 A 的每一列怎样由 C 的列组合而成。C 满列秩、R 满行秩，行秩等于列秩也直接显现在这个分解中。',
      ],
      formulas: [
        {
          id: 'linear-algebra-cr-factorization-formula',
          expression: 'A = CR，rank(C) = rank(R) = r',
          explanation: 'C 选取 r 个独立列，R 保存重建所有列所需的组合系数。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, mitMatrixFactorizationsSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const determinantsInvertibilityContent = {
  id: 'content:linear-algebra:determinants-invertibility',
  conceptId: 'linear-algebra:determinants-invertibility',
  summary: '对于 n×n 方阵，行列式非零、满秩、可逆、零不是特征值和对每个 b 唯一可解彼此等价。',
  sections: [
    {
      id: 'linear-algebra-determinant-history',
      title: '行列式先于矩阵理论形成',
      paragraphs: [
        '17世纪和18世纪的数学家在研究联立方程时逐渐发展出行列式。对方阵系统，行列式能够判断系数矩阵是否具有逆，也能描述相应线性映射对有向面积和体积的缩放。矩阵后来成为独立对象，行列式才被系统地看作方阵的一个标量不变量。',
      ],
    },
    {
      id: 'linear-algebra-invertibility-theorem',
      title: '可逆矩阵定理连接多种判断',
      paragraphs: [
        '对于 n×n 方阵，满秩、可逆、行列式非零、零不是特征值，以及 Ax=b 对每个 b 都有唯一解彼此等价。任一条件失败，矩阵就是奇异矩阵；此时至少有一个非零输入方向被压到零。',
        '这些等价条件不能原样搬到长方形矩阵。矩形矩阵没有通常意义下的行列式和逆，但仍可讨论秩、列空间、零空间、奇异值分解与伪逆。',
      ],
      formulas: [
        {
          id: 'linear-algebra-invertibility-equivalences-formula',
          expression: 'det(A) ≠ 0  ⇔  rank(A) = n  ⇔  0 不是 A 的特征值',
          explanation: '这些等价条件只针对 n×n 方阵；它们还等价于 A 可逆和 Ax=b 对每个 b 唯一可解。',
        },
      ],
    },
  ],
  sources: [macTutorMatricesSource, strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const innerProductsOrthogonalityProjectionsContent = {
  id: 'content:linear-algebra:inner-products-orthogonality-projections',
  conceptId: 'linear-algebra:inner-products-orthogonality-projections',
  summary: '内积给出长度和夹角；正交归一基简化坐标，投影则把向量送入指定子空间。',
  sections: [
    {
      id: 'linear-algebra-inner-products-orthogonality',
      title: '正交坐标为什么特别好用',
      paragraphs: [
        '实向量的标准内积 uᵀv 同时编码长度和夹角。互相正交且长度为 1 的向量构成正交归一组；在这种基下，坐标可以直接用内积读取，长度也由坐标平方和给出。',
        '正交矩阵 Q 的列构成正交归一基，它保持内积、长度和夹角。置换矩阵是正交矩阵的一类；一般正交矩阵还可以表示旋转和反射。它的复特征值位于单位圆上，而实特征值只能是 1 或 −1。',
      ],
      formulas: [
        {
          id: 'linear-algebra-orthogonal-formula',
          expression: 'QᵀQ = QQᵀ = I  ⇔  Q⁻¹ = Qᵀ',
          explanation: '实正交矩阵保持欧氏内积和长度。',
        },
      ],
    },
    {
      id: 'linear-algebra-projections',
      title: '一般投影和正交投影有什么区别',
      paragraphs: [
        '一般投影只要求 P²=P，它把再次投影变成同一个结果，但不必沿垂直方向投到目标子空间。若同时满足 Pᵀ=P，P 才是正交投影；此时残差与目标子空间正交。',
        '投影矩阵的特征值只能是 0 或 1：目标子空间中的方向保持不变，沿被舍弃方向的分量则变成零。正交投影还具有最近点性质，这一性质会在下一个节点中导出最小二乘。',
      ],
      formulas: [
        {
          id: 'linear-algebra-projection-formula',
          expression: 'P² = P；若还满足 Pᵀ = P，则 P 为正交投影',
          explanation: '幂等性定义一般投影，对称性把它进一步限制为正交投影。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const leastSquaresQrContent = {
  id: 'content:linear-algebra:least-squares-qr',
  conceptId: 'linear-algebra:least-squares-qr',
  summary: '最小二乘把无法精确满足的 Ax=b 改为寻找最近输出；QR 用正交坐标稳定地完成计算。',
  sections: [
    {
      id: 'linear-algebra-least-squares-projection',
      title: '没有精确解时怎样寻找最近结果',
      paragraphs: [
        '实验数据通常含有噪声，多条观测方程很可能无法被同一组参数完全满足。这时不再要求 Ax=b，而是寻找 x̂，使预测 Ax̂ 与观测 b 的距离 ‖Ax̂−b‖ 尽可能小。',
        '所有可能输出 Ax 构成 A 的列空间，因此最接近 b 的输出就是 b 在列空间上的正交投影。残差 r=b−Ax̂ 与列空间正交，也就与 A 的每一列正交，由此得到正规方程。',
      ],
      formulas: [
        {
          id: 'linear-algebra-least-squares-objective-formula',
          expression: 'x̂ = arg minₓ ‖Ax − b‖²',
          explanation: '最小二乘选择让预测与观测之间平方距离最小的参数。',
        },
        {
          id: 'linear-algebra-least-squares-orthogonality-formula',
          expression: 'Aᵀ(b − A x̂) = 0',
          explanation: '最优残差与 A 的每一列正交。',
        },
      ],
    },
    {
      id: 'linear-algebra-qr-least-squares',
      title: 'QR 为什么适合计算最小二乘',
      paragraphs: [
        'Gram–Schmidt 过程从 A 的列出发，逐步减去已经解释的正交方向，再把剩余部分归一化。满列秩且 m≥n 时，这会得到薄 QR 分解 A=QR，其中 Q 的列正交归一，R 为可逆上三角矩阵。',
        '由于 QᵀQ=I，最小二乘可以转化为较小的上三角系统 Rx=Qᵀb。实际软件通常使用 Householder 反射而不是经典 Gram–Schmidt，以减少舍入误差；秩亏时还需要列主元 QR 或 SVD。',
      ],
      formulas: [
        {
          id: 'linear-algebra-thin-qr-formula',
          expression: 'A = QR，m ≥ n 且 rank(A) = n',
          explanation: '经典薄 QR 中，Q 为 m×n 且列正交归一，R 为可逆上三角矩阵。',
        },
        {
          id: 'linear-algebra-qr-least-squares-formula',
          expression: 'Rx̂ = Qᵀb',
          explanation: '满列秩时，QR 将最小二乘化为上三角方程。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, mitLinearAlgebraSyllabusSource, mitMatrixFactorizationsSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const eigenvaluesDiagonalizationContent = {
  id: 'content:linear-algebra:eigenvalues-diagonalization',
  conceptId: 'linear-algebra:eigenvalues-diagonalization',
  summary: '特征向量给出线性变换保持不变的方向；若能找到完整特征向量基，矩阵便可以对角化。',
  sections: [
    {
      id: 'linear-algebra-eigen-directions',
      title: '变换有哪些内在方向',
      paragraphs: [
        '一般向量经过线性变换后，长度和方向都可能改变。不过，有些非零向量经过变换后仍停留在原来的直线上，只是被缩放，或在实数情形下同时反向。这样的 v 是特征向量，缩放倍数 λ 是对应的特征值。',
        '特征值为零表示该方向被压到零，因此方阵含有零特征值时必然不可逆。行列式常用于建立特征方程，但理解特征向量的定义本身并不以行列式为逻辑前提。',
      ],
      formulas: [
        {
          id: 'linear-algebra-eigenvector-formula',
          expression: 'Av = λv，v ≠ 0',
          explanation: '特征向量经过 A 后所在直线不变，λ 记录该方向上的缩放。',
        },
      ],
    },
    {
      id: 'linear-algebra-diagonalization',
      title: '何时能够对角化',
      paragraphs: [
        '若 n×n 矩阵拥有 n 个线性无关的特征向量，把它们排成可逆矩阵 X 后，改用这组基就只需沿各坐标轴分别乘以特征值。矩阵的高次幂、指数和线性微分方程因此更容易计算。',
        '并非每个方阵都有足够多的特征向量。此时对角化公式不能使用，但这并不影响先理解特征方向和可对角化条件。缺少特征向量的情形会在进阶的 Jordan 形节点中单独处理。',
      ],
      formulas: [
        {
          id: 'linear-algebra-diagonalization-formula',
          expression: 'A = XΛX⁻¹',
          explanation: '只有当 A 拥有完整的线性无关特征向量基时，X 才可逆并得到对角化。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const normalSymmetricDefiniteMatricesContent = {
  id: 'content:linear-algebra:normal-symmetric-definite-matrices',
  conceptId: 'linear-algebra:normal-symmetric-definite-matrices',
  summary: '实对称矩阵能够正交对角化；正定和半正定矩阵用二次型描述方向上的能量、方差或曲率。',
  sections: [
    {
      id: 'linear-algebra-symmetric-spectral-theorem',
      title: '实对称矩阵为什么特别稳定',
      paragraphs: [
        '实对称矩阵满足 Sᵀ=S，是实正规矩阵中更特殊的一类。它的特征值全为实数，并且总能选到一组实正交归一的特征向量，所以可以写成 S=QΛQᵀ。',
        '正交特征向量把空间分成互相垂直的主方向，Λ 则记录每个方向上的缩放。因为 Q 只旋转或反射坐标而不放大长度，对称谱分解在几何解释和数值计算中都格外清楚。复正规矩阵的更一般结论会在进阶节点中讨论。',
      ],
      formulas: [
        {
          id: 'linear-algebra-spectral-theorem-formula',
          expression: 'S = Sᵀ  ⇒  S = QΛQᵀ',
          explanation: '每个实对称矩阵都能被实正交矩阵对角化，Λ 的对角元均为实特征值。',
        },
      ],
    },
    {
      id: 'linear-algebra-positive-definite-matrices',
      title: '二次型怎样区分正定与半正定',
      paragraphs: [
        '本子域采用实对称约定：若对所有 x 都有 xᵀSx≥0，S 是半正定矩阵；若对每个非零 x 都严格大于零，S 是正定矩阵。对实对称矩阵，这分别等价于全部特征值非负和全部特征值为正。',
        '正定矩阵必然可逆，半正定矩阵则可能奇异。任意实矩阵 B 构成的 BᵀB 都是半正定矩阵，只有当 B 满列秩时才正定。',
      ],
      formulas: [
        {
          id: 'linear-algebra-positive-semidefinite-formula',
          expression: 'xᵀSx ≥ 0；正定时对所有 x ≠ 0 都有 xᵀSx > 0',
          explanation: '在实对称矩阵中，这分别等价于全部特征值非负和全部特征值为正。',
        },
      ],
    },
    {
      id: 'linear-algebra-covariance-matrices',
      title: '协方差为什么总是半正定，却不一定正定',
      paragraphs: [
        '随机向量 X 的协方差矩阵记录各分量共同变化的程度。它是中心化随机向量外积的期望；对任意方向 z，二次型 zᵀΣz 等于该方向上线性组合的方差，所以不可能为负。任何协方差矩阵都必然对称半正定，而不是总为正定。',
        '只有当每个非零方向都保留正方差，也就是协方差矩阵满秩、分布在这些方向上非退化时，Σ 才正定。常用的完整多元高斯密度含 Σ⁻¹ 和 det(Σ)，因此要求正定；半正定但奇异的协方差仍可描述集中在低维子空间上的退化分布，只是不能直接使用相对于整个空间的普通密度公式。',
      ],
      formulas: [
        {
          id: 'linear-algebra-covariance-formula',
          expression: 'Σ = E[(X − μ)(X − μ)ᵀ]',
          explanation: '协方差矩阵是中心化随机向量与自身外积的期望。',
        },
        {
          id: 'linear-algebra-covariance-psd-formula',
          expression: 'zᵀΣz = E[(zᵀ(X − μ))²] ≥ 0',
          explanation: '任意方向上的方差都非负，因此协方差矩阵必为半正定。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, stanfordGaussianSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const normalUnitaryMatricesContent = {
  id: 'content:linear-algebra:normal-unitary-matrices',
  conceptId: 'linear-algebra:normal-unitary-matrices',
  summary: '复内积使用共轭转置；正规矩阵恰好能够被酉矩阵对角化，酉矩阵则保持复内积和长度。',
  sections: [
    {
      id: 'linear-algebra-complex-inner-products',
      title: '复向量为什么需要共轭转置',
      paragraphs: [
        '实向量的内积可以写成 xᵀy，但复数平方可能不是非负实数。为了让向量与自身的内积仍表示非负长度平方，复内积需要对第一个向量取复共轭，因此矩阵的转置也推广为共轭转置 A*。',
        '满足 U*U=UU*=I 的矩阵称为酉矩阵。它在复向量空间中承担正交矩阵的角色，保持内积、长度和夹角；离散傅里叶变换在适当归一化后就是重要例子。',
      ],
      formulas: [
        {
          id: 'linear-algebra-unitary-formula',
          expression: 'U*U = UU* = I  ⇔  U⁻¹ = U*',
          explanation: '星号表示共轭转置，酉矩阵保持复内积。',
        },
      ],
    },
    {
      id: 'linear-algebra-normal-spectral-theorem',
      title: '正规矩阵怎样统一多种特殊矩阵',
      paragraphs: [
        '复方阵满足 A*A=AA* 时称为正规矩阵。复谱定理说明，正规矩阵恰好可以被酉矩阵对角化。Hermitian 矩阵、酉矩阵和复对角矩阵都属于正规矩阵，但它们对特征值还有不同限制。',
        '一般实正规矩阵不保证能用实正交矩阵得到实对角矩阵。例如平面旋转在实数域中没有实特征方向，却能在复数域中酉对角化。讨论正规矩阵时必须同时说明数域和使用的是转置还是共轭转置。',
      ],
      formulas: [
        {
          id: 'linear-algebra-complex-normal-formula',
          expression: 'A*A = AA*  ⇔  A = UΛU*',
          explanation: '在复数域中，正规条件等价于存在酉特征向量基。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const jordanGeneralizedEigenvectorsContent = {
  id: 'content:linear-algebra:jordan-generalized-eigenvectors',
  conceptId: 'linear-algebra:jordan-generalized-eigenvectors',
  summary: 'Jordan 形用广义特征向量链描述特征向量不足的方阵，并把不可对角化程度记录在 Jordan 块中。',
  sections: [
    {
      id: 'linear-algebra-defective-matrices',
      title: '特征向量不足时发生了什么',
      paragraphs: [
        '一个 n×n 矩阵可能拥有重复特征值，却找不到 n 个线性无关特征向量。例如剪切变换保留一个方向，但第二个方向会沿第一个方向滑动，因此无法用纯粹的逐坐标缩放描述。',
        '这类矩阵称为不可对角化或缺陷矩阵。基础的特征值节点只需判断是否具有完整特征向量基；只有需要精确研究矩阵高次幂、矩阵指数或线性微分方程时，才需要继续进入广义特征向量。',
      ],
    },
    {
      id: 'linear-algebra-jordan-chains',
      title: 'Jordan 块怎样记录缺失方向',
      paragraphs: [
        '在复数域中，每个方阵都相似于 Jordan 标准形。一个 Jordan 块在对角线上重复写入特征值 λ，并在紧邻主对角线的上方放置 1；这些 1 记录广义特征向量怎样依次连接成链。',
        'Jordan 形对理论推导很清楚，但数值上对微小扰动十分敏感，实际浮点计算通常优先使用 Schur 分解等更稳定的方法。因此它适合作为高阶结构节点，而不应成为初学特征值的前置。',
      ],
      formulas: [
        {
          id: 'linear-algebra-jordan-formula',
          expression: 'A = XJX⁻¹',
          explanation: '在复数域中，J 由 Jordan 块组成，X 的列由特征向量和广义特征向量链构成。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const matrixFactorizationsContent = {
  id: 'content:linear-algebra:matrix-factorizations',
  conceptId: 'linear-algebra:matrix-factorizations',
  summary: '矩阵分解路线图比较 CR、LU、QR、特征分解和 SVD 的问题来源、适用条件与输出结构。',
  sections: [
    {
      id: 'linear-algebra-factorization-selection',
      title: '先看问题，再选分解',
      paragraphs: [
        '矩阵分解把一个映射写成若干结构更简单的映射。CR 暴露独立列与秩，LU 记录消元，QR 构造正交基，特征分解寻找不变方向，SVD 则分离输入方向、缩放和输出方向。选择分解时，适用条件与数值稳定性和公式本身同样重要。',
        '20世纪的数值计算把消元、正交化、特征分解和 SVD 发展为可在计算机上稳定执行的算法。实际实现会考虑舍入误差、条件数、主元选择、稀疏结构和是否需要显露数值秩，而不只是把一个等式机械展开。',
      ],
    },
    {
      id: 'linear-algebra-factorization-hosts',
      title: '各个分解分别从哪里产生',
      paragraphs: [
        'CR 从列空间和秩产生，C 保存独立列，R 保存组合系数；LU 从高斯消元产生；QR 从正交化和最小二乘产生；特征分解从不变方向产生；SVD 则把任意矩阵分解为输入正交方向、非负缩放和输出正交方向。',
        '因此路线图只负责比较和导航。每个分解的推导、公式条件和应用留在对应基础节点中，避免学习者把所有分解当作需要一次记住的平行公式。',
      ],
    },
    {
      id: 'linear-algebra-lu-factorization',
      title: 'LU：把消元步骤保存下来',
      paragraphs: [
        '对方阵进行高斯消元时，若无需交换行，可以直接得到 A=LU。一般计算中需要用置换矩阵 P 记录选主元，因此更稳妥的形式是 PA=LU。',
        '奇异矩阵会在消元中出现零主元，反映为 U 的某些对角元为零；这并不意味着 U 必然含有一整行零。选主元既用于避开零主元，也能减小浮点误差放大。',
      ],
      formulas: [
        {
          id: 'linear-algebra-pivoted-lu-formula',
          expression: 'PA = LU',
          explanation: 'P 记录消元过程中的换行，L 为下三角因子，U 为上三角因子。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, mitMatrixFactorizationsSource, hiranabeMatrixWorldSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const singularValuesLowRankContent = {
  id: 'content:linear-algebra:singular-values-low-rank',
  conceptId: 'linear-algebra:singular-values-low-rank',
  summary: 'SVD 适用于任意矩阵；奇异值衡量正交方向上的缩放，截断 SVD 给出最佳低秩近似。',
  sections: [
    {
      id: 'linear-algebra-singular-value-decomposition',
      title: 'SVD 不要求方阵、可逆或可对角化',
      paragraphs: [
        '任意实 m×n 矩阵都有奇异值分解。U 和 V 分别提供输出空间与输入空间的正交归一基，矩形对角矩阵 Σ 的非负对角元是奇异值；映射可以理解为先在输入空间换到 V 的坐标，沿各主方向缩放，再换到 U 的输出方向。',
        '完整 SVD 补全两侧正交基，紧致 SVD 只保留 r 个非零奇异值及对应方向。它不要求 A 是方阵、可逆、满秩或可对角化，也不是特征分解的一个受限子情况。',
      ],
      formulas: [
        {
          id: 'linear-algebra-svd-formula',
          expression: 'A = UΣVᵀ',
          explanation: '每个实矩阵都有 SVD；U、V 的列正交归一，Σ 的对角元为非负奇异值。',
        },
      ],
    },
    {
      id: 'linear-algebra-truncated-svd',
      title: '截断 SVD 怎样压缩图像',
      paragraphs: [
        '灰度图像可以看作像素矩阵 A。若奇异值下降很快，前几个左右奇异向量已经捕捉主要形状，较小奇异值更多描述细节。截断 SVD 只保留最大的 k 个奇异值，得到秩不超过 k 的近似 Aₖ。',
        '在谱范数和 Frobenius 范数下，Aₖ 是所有秩不超过 k 的矩阵中误差最小的近似。谱范数衡量最大的方向误差，Frobenius 范数把所有元素误差的平方相加后开方；保存少量方向和系数可能远少于保存全部像素，这就是 SVD 图像压缩的基本原理。',
      ],
      formulas: [
        {
          id: 'linear-algebra-truncated-svd-formula',
          expression: 'Aₖ = UₖΣₖVₖᵀ',
          explanation: '保留最大的 k 个奇异值及对应方向，得到最佳的秩不超过 k 的截断近似。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, mitSvdSource, mitLowRankSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const pseudoinverseMinimumNormContent = {
  id: 'content:linear-algebra:pseudoinverse-minimum-norm',
  conceptId: 'linear-algebra:pseudoinverse-minimum-norm',
  summary: 'Moore–Penrose 伪逆对每个矩阵都存在，并统一给出最小二乘解与欠定系统的最小范数解。',
  sections: [
    {
      id: 'linear-algebra-pseudoinverse-from-svd',
      title: '伪逆不是普通逆矩阵',
      paragraphs: [
        'Moore–Penrose 伪逆对矩形或奇异矩阵也存在。在 SVD 中把每个非零奇异值取倒数、零奇异值仍保留为零，再交换输入与输出方向，就得到 A⁺。当 A 是可逆方阵时，A⁺恰好等于普通逆 A⁻¹；其他情形中，它满足一组刻画投影与对称性的 Penrose 条件，而不是把不存在的普通逆强行补出来。',
      ],
      formulas: [
        {
          id: 'linear-algebra-pseudoinverse-formula',
          expression: 'A⁺ = VΣ⁺Uᵀ',
          explanation: 'Σ⁺把非零奇异值取倒数并转置尺寸，因此矩形或奇异矩阵也有伪逆。',
        },
      ],
    },
    {
      id: 'linear-algebra-least-squares-minimum-norm',
      title: '“最接近”与“最短”是两个层次',
      paragraphs: [
        '当 Ax=b 不相容时，x=A⁺b 使残差 ‖Ax−b‖ 最小；当最小二乘解不唯一时，它还在所有残差同样小的解中选择范数最小者。对相容但欠定的系统，它则直接给出所有精确解中的最小范数解。',
        'QR 和 SVD 都能用于最小二乘。满列秩时 QR 往往高效；秩亏或需要显露数值秩时，SVD 提供更透明而稳定的处理。传感器标定、回归、轨迹拟合和许多反问题都使用这一结构。',
      ],
      formulas: [
        {
          id: 'linear-algebra-pseudoinverse-solution-formula',
          expression: 'x̂ = A⁺b',
          explanation: '该解先最小化残差；若最优解不唯一，再选择欧氏范数最小者。',
        },
      ],
    },
  ],
  sources: [strangLinearAlgebraSource, mitSvdSource, mitMatrixFactorizationsSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const matrixPropertiesAtlasContent = {
  id: 'content:linear-algebra:matrix-properties-atlas',
  conceptId: 'linear-algebra:matrix-properties-atlas',
  summary: '矩阵性质图谱用包含和交叠组织常见矩阵类别，并把性质分类与矩阵分解的适用条件分开展示。',
  sections: [
    {
      id: 'linear-algebra-matrix-world-reading',
      title: '矩阵类型不是一条单线层级',
      paragraphs: [
        '最外层包含所有 m×n 矩阵；只有进入 n×n 方阵以后，才讨论行列式、通常意义下的特征值、可逆与奇异。对称、正交、投影、半正定和对角等性质彼此交叠，同一个矩阵往往同时属于多个区域。',
        '可逆与奇异把方阵分成两类，却与“是否对称”或“是否正规”属于不同判断维度。对称矩阵既可能可逆，也可能奇异；对角矩阵一定对称，却会因对角元取值落入可逆、奇异、正定或半正定等不同区域。',
        '正交矩阵与实对称矩阵都满足实正规条件 AᵀA=AAᵀ，但二者互不包含。置换矩阵是正交矩阵的特殊成员；正交投影同时属于对称、半正定和投影矩阵。一般投影只需幂等，不一定对称。',
      ],
    },
    {
      id: 'linear-algebra-matrix-world-special-points',
      title: '单位矩阵和零矩阵为何位于交汇处',
      paragraphs: [
        '单位矩阵既是对角、对称、正交和正定矩阵，也是把整个空间投影到自身的投影矩阵。零矩阵同样是对角、对称、半正定和投影矩阵，却是奇异矩阵。',
        '阅读图谱时，应先辨认区域边界表示的性质，再观察交叠，最后把旁侧分解方法视为另一条线索。“属于哪一类”和“可以怎样分解”不是同一种关系；还应检查矩阵是否为方阵、所处数域、是否满秩，以及等号表示相似换基还是数值分解。',
      ],
      visual: {
        id: 'linear-algebra-matrix-world-figure',
        kind: 'matrix-world',
        title: '矩阵世界：性质关系与分解入口',
        description: '主体用包含与交叠表示方阵、可逆、奇异、可对角化、正规、对称、正交、投影、半正定、正定、对角、置换、单位与零矩阵之间的关系；分解视图另列 CR、QR、带选主元的 LU、特征分解、SVD、Jordan 形和伪逆的适用条件。应用视图用于导航到协方差、低秩近似和伪逆三个独立主题。',
        caption: '区域边界回答“矩阵具有什么性质”，分解入口回答“可以怎样揭示或计算它的结构”；图中采用实矩阵约定，并单独标明需要复数域的谱结论。',
      },
    },
  ],
  sources: [strangLinearAlgebraSource, hiranabeMatrixWorldSource, mitMatrixFactorizationsSource],
  ...reviewMetadata,
} satisfies KnowledgeCardContent

export const linearAlgebraContents: readonly KnowledgeCardContent[] = [
  linearAlgebraOverviewContent,
  linearCombinationsSpanContent,
  matrixBasicsOperationsContent,
  linearSystemsEliminationContent,
  linearMapsMatrixRepresentationsContent,
  vectorSpacesBasesContent,
  fundamentalSubspacesRankContent,
  determinantsInvertibilityContent,
  innerProductsOrthogonalityProjectionsContent,
  leastSquaresQrContent,
  eigenvaluesDiagonalizationContent,
  normalSymmetricDefiniteMatricesContent,
  matrixFactorizationsContent,
  singularValuesLowRankContent,
  pseudoinverseMinimumNormContent,
  normalUnitaryMatricesContent,
  jordanGeneralizedEigenvectorsContent,
  matrixPropertiesAtlasContent,
]
