import type { MathNode } from '../../data/mathMap'

const realAnalysisNodes: MathNode[] = [
  {
    id: 'real-sequences-functions', title: '数列与函数列', english: 'Sequences & Function Sequences', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '研究实数数列、函数列及其逐点变化。', why: '它把无限过程组织为可证明、可比较的对象。', prerequisites: [],
    fieldTags: ['连续变化', '证明推理'], tags: ['数列', '函数列', '收敛'], hours: 28,
  },
  {
    id: 'real-limits-continuity', title: '极限与连续', english: 'Limits & Continuity', domain: 'analysis', level: 1, x: 1650, y: 680,
    summary: '用严格定义研究实函数在局部和整体上的连续变化。', why: '极限与连续是实分析中微分、积分和收敛理论的基础。', prerequisites: ['real-sequences-functions'],
    fieldTags: ['连续变化', '证明推理'], tags: ['极限', '连续', '邻域'], hours: 36,
  },
  {
    id: 'real-differentiation', title: '微分理论', english: 'Differentiation Theory', domain: 'analysis', level: 2, x: 3000, y: 260,
    summary: '研究导数、局部线性近似和函数的正则性。', why: '微分理论刻画函数的局部变化和形状。', prerequisites: ['real-limits-continuity'],
    fieldTags: ['连续变化', '证明推理'], tags: ['导数', '局部近似', '可微性'], hours: 38,
  },
  {
    id: 'real-riemann-integration', title: '黎曼积分', english: 'Riemann Integration', domain: 'analysis', level: 2, x: 3000, y: 1100,
    summary: '通过分割与黎曼和定义函数的累积。', why: '黎曼积分为面积、总量和微积分基本定理提供严密基础。', prerequisites: ['real-limits-continuity'],
    fieldTags: ['连续变化', '证明推理', '计算方法'], tags: ['黎曼和', '可积性', '累积'], hours: 34,
  },
  {
    id: 'real-uniform-convergence', title: '一致收敛', english: 'Uniform Convergence', domain: 'analysis', level: 3, x: 4350, y: 1100,
    summary: '研究函数列在整个定义域上以统一速度收敛。', why: '一致收敛决定极限过程能否与连续、微分和积分交换。', prerequisites: ['real-sequences-functions', 'real-riemann-integration'],
    fieldTags: ['连续变化', '证明推理'], tags: ['一致收敛', '逐点收敛', '极限交换'], hours: 32,
  },
  {
    id: 'real-mean-value-taylor', title: '中值定理与泰勒理论', english: 'Mean Value & Taylor Theory', domain: 'analysis', level: 3, x: 4350, y: 260,
    summary: '用中值定理和泰勒展开连接导数、函数值与近似误差。', why: '它为局部估计、级数展开和数值近似提供工具。', prerequisites: ['real-differentiation'],
    fieldTags: ['连续变化', '证明推理', '计算方法'], tags: ['中值定理', '泰勒展开', '余项'], hours: 30,
  },
]

const complexAnalysisNodes: MathNode[] = [
  {
    id: 'complex-functions', title: '复数与复函数', english: 'Complex Numbers & Functions', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '研究复平面、复数运算和复变量函数。', why: '复数把旋转、振荡和二维变化纳入统一表达。', prerequisites: [],
    fieldTags: ['连续变化', '空间形态', '基础语言'], tags: ['复平面', '复函数', '辐角'], hours: 24,
  },
  {
    id: 'complex-analytic-functions', title: '解析函数', english: 'Analytic Functions', domain: 'analysis', level: 1, x: 1650, y: 680,
    summary: '研究复可微函数和柯西—黎曼条件。', why: '复可微性带来比实可微性更强的结构和刚性。', prerequisites: ['complex-functions'],
    fieldTags: ['连续变化', '证明推理'], tags: ['复可微', '柯西黎曼', '全纯'], hours: 36,
  },
  {
    id: 'complex-contour-integration', title: '围道积分', english: 'Contour Integration', domain: 'analysis', level: 2, x: 3000, y: 260,
    summary: '沿复平面曲线积分复函数。', why: '围道积分把局部解析性质和闭合路径的整体信息连接起来。', prerequisites: ['complex-analytic-functions'],
    fieldTags: ['连续变化', '空间形态', '计算方法'], tags: ['围道', '复积分', '路径'], hours: 30,
  },
  {
    id: 'complex-cauchy-theory', title: '柯西理论', english: 'Cauchy Theory', domain: 'analysis', level: 3, x: 4350, y: 260,
    summary: '研究柯西积分定理、积分公式及其推论。', why: '柯西理论揭示解析函数的整体约束和强大可计算性。', prerequisites: ['complex-contour-integration'],
    fieldTags: ['连续变化', '证明推理'], tags: ['柯西定理', '积分公式', '解析延拓'], hours: 40,
  },
  {
    id: 'complex-laurent-residue', title: '洛朗级数与留数', english: 'Laurent Series & Residues', domain: 'analysis', level: 4, x: 5700, y: 260,
    summary: '用洛朗展开和留数刻画孤立奇点。', why: '留数方法能高效计算复积分并分析函数的奇异行为。', prerequisites: ['complex-cauchy-theory'],
    fieldTags: ['连续变化', '计算方法', '证明推理'], tags: ['洛朗级数', '留数', '奇点'], hours: 38,
  },
  {
    id: 'complex-dynamics', title: '复动力系统', english: 'Complex Dynamics', domain: 'analysis', level: 4, x: 5700, y: 1100,
    summary: '研究复函数反复迭代产生的轨道、稳定区域和分形边界。', why: '复动力学连接复分析、动力系统、混沌和分形几何。', prerequisites: ['complex-analytic-functions'],
    fieldTags: ['连续变化', '空间形态', '数学建模'], tags: ['复迭代', 'Julia集', '分形'], hours: 32,
  },
]

const functionalAnalysisNodes: MathNode[] = [
  {
    id: 'functional-normed-spaces', title: '赋范向量空间', english: 'Normed Vector Spaces', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '在向量空间上用范数描述大小、距离和收敛。', why: '赋范空间把线性代数扩展到无限维环境。', prerequisites: [],
    fieldTags: ['抽象结构', '空间形态', '连续变化'], tags: ['范数', '线性空间', '收敛'], hours: 34,
  },
  {
    id: 'functional-banach-spaces', title: 'Banach空间', english: 'Banach Spaces', domain: 'analysis', level: 1, x: 1650, y: 260,
    summary: '研究完备赋范空间及其中的极限过程。', why: '完备性保证许多逼近和迭代过程在空间内收敛。', prerequisites: ['functional-normed-spaces'],
    fieldTags: ['抽象结构', '连续变化', '证明推理'], tags: ['完备性', 'Banach空间', '不动点'], hours: 42,
  },
  {
    id: 'functional-hilbert-spaces', title: 'Hilbert空间', english: 'Hilbert Spaces', domain: 'analysis', level: 1, x: 1650, y: 1100,
    summary: '研究带内积的完备向量空间及其正交结构。', why: 'Hilbert空间统一傅里叶分析、偏微分方程和量子理论中的几何。', prerequisites: ['functional-normed-spaces'],
    fieldTags: ['抽象结构', '空间形态', '连续变化'], tags: ['内积', '正交', '投影'], hours: 44,
  },
  {
    id: 'functional-operators-duality', title: '有界算子与对偶', english: 'Bounded Operators & Duality', domain: 'analysis', level: 2, x: 3000, y: 680,
    summary: '研究连续线性算子、线性泛函和对偶空间。', why: '算子和对偶把函数空间中的问题转化为结构化的线性关系。', prerequisites: ['functional-banach-spaces', 'functional-hilbert-spaces'],
    fieldTags: ['抽象结构', '连续变化', '证明推理'], tags: ['有界算子', '线性泛函', '对偶空间'], hours: 52,
  },
  {
    id: 'functional-spectral-theory', title: '谱理论', english: 'Spectral Theory', domain: 'analysis', level: 4, x: 4350, y: 680,
    summary: '研究算子的谱、特征结构和分解。', why: '谱理论推广矩阵特征值方法，并连接微分方程和量子力学。', prerequisites: ['functional-operators-duality'],
    fieldTags: ['抽象结构', '连续变化', '证明推理'], tags: ['谱', '特征值', '算子分解'], hours: 58,
  },
]

const measureTheoryNodes: MathNode[] = [
  {
    id: 'measure-sigma-measurable', title: 'σ代数与可测函数', english: 'Sigma Algebras & Measurable Functions', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '用σ代数规定可测集合，并定义保持可测结构的函数。', why: '可测性为长度、面积、概率和积分建立共同语言。', prerequisites: [],
    fieldTags: ['基础语言', '抽象结构', '证明推理'], tags: ['σ代数', '可测集', '可测函数'], hours: 34,
  },
  {
    id: 'measure-measures', title: '测度', english: 'Measures', domain: 'analysis', level: 1, x: 1650, y: 680,
    summary: '研究满足可列可加性的大小函数。', why: '测度把长度、面积、质量和概率统一为同一种结构。', prerequisites: ['measure-sigma-measurable'],
    fieldTags: ['抽象结构', '连续变化', '证明推理'], tags: ['可列可加', '外测度', '概率测度'], hours: 42,
  },
  {
    id: 'measure-lebesgue-integration', title: '勒贝格积分', english: 'Lebesgue Integration', domain: 'analysis', level: 2, x: 3000, y: 680,
    summary: '依据函数值的测度分布定义积分。', why: '勒贝格积分能处理更广泛的函数和极限过程。', prerequisites: ['measure-measures'],
    fieldTags: ['连续变化', '证明推理', '计算方法'], tags: ['勒贝格积分', '简单函数', '可积性'], hours: 48,
  },
  {
    id: 'measure-convergence-theorems', title: '积分收敛定理', english: 'Convergence Theorems', domain: 'analysis', level: 3, x: 4350, y: 260,
    summary: '研究单调收敛、Fatou引理和控制收敛定理。', why: '这些定理给出极限与积分交换的可靠条件。', prerequisites: ['measure-lebesgue-integration'],
    fieldTags: ['连续变化', '证明推理'], tags: ['控制收敛', '单调收敛', 'Fatou引理'], hours: 34,
  },
  {
    id: 'measure-product-fubini', title: '乘积测度与Fubini定理', english: 'Product Measures & Fubini Theorem', domain: 'analysis', level: 3, x: 4350, y: 1100,
    summary: '构造乘积空间上的测度并研究多重积分的次序交换。', why: '它为多变量积分、概率联合分布和连续模型提供基础。', prerequisites: ['measure-lebesgue-integration'],
    fieldTags: ['连续变化', '空间形态', '证明推理'], tags: ['乘积测度', 'Fubini定理', '多重积分'], hours: 36,
  },
  {
    id: 'measure-lp-spaces', title: 'Lp空间', english: 'Lp Spaces', domain: 'analysis', level: 4, x: 5700, y: 260,
    summary: '用p次可积性组织函数并定义距离和收敛。', why: 'Lp空间连接测度论、泛函分析、概率和微分方程。', prerequisites: ['measure-convergence-theorems'],
    fieldTags: ['抽象结构', '连续变化', '空间形态'], tags: ['Lp空间', '范数', '可积函数'], hours: 40,
  },
  {
    id: 'measure-radon-nikodym', title: 'Radon–Nikodym定理', english: 'Radon–Nikodym Theorem', domain: 'analysis', level: 4, x: 5700, y: 1100,
    summary: '用密度函数描述一个测度相对于另一个测度的变化。', why: '它支撑概率密度、条件期望和测度变换。', prerequisites: ['measure-product-fubini'],
    fieldTags: ['抽象结构', '连续变化', '证明推理'], tags: ['绝对连续', '密度', '测度变换'], hours: 38,
  },
]

const fourierAnalysisNodes: MathNode[] = [
  {
    id: 'fourier-orthogonal-systems', title: '正交函数系', english: 'Orthogonal Function Systems', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '研究函数空间中的正交、投影和基展开。', why: '正交结构能把复杂函数分解为互不干扰的基本成分。', prerequisites: [],
    fieldTags: ['抽象结构', '连续变化', '计算方法'], tags: ['正交', '函数空间', '投影'], hours: 32,
  },
  {
    id: 'fourier-series', title: '傅里叶级数', english: 'Fourier Series', domain: 'analysis', level: 1, x: 1650, y: 260,
    summary: '用正弦和余弦级数表示周期函数。', why: '傅里叶级数揭示周期信号中的频率组成。', prerequisites: ['fourier-orthogonal-systems'],
    fieldTags: ['连续变化', '计算方法'], tags: ['周期函数', '三角级数', '频谱'], hours: 36,
  },
  {
    id: 'fourier-transform', title: '傅里叶变换', english: 'Fourier Transform', domain: 'analysis', level: 2, x: 3000, y: 260,
    summary: '在时域与频域之间转换非周期函数和信号。', why: '傅里叶变换连接偏微分方程、信号处理和数据分析。', prerequisites: ['fourier-series'],
    fieldTags: ['连续变化', '计算方法', '数学建模'], tags: ['时域', '频域', '卷积'], hours: 42,
  },
  {
    id: 'laplace-transform', title: 'Laplace变换', english: 'Laplace Transform', domain: 'analysis', level: 2, x: 3000, y: 1100,
    summary: '用复频率表示函数，并把微分运算转化为代数运算。', why: 'Laplace变换常用于初值问题、控制系统和瞬态分析。', prerequisites: ['fourier-series'],
    fieldTags: ['连续变化', '计算方法', '数学建模'], tags: ['复频域', '初值问题', '传递函数'], hours: 34,
  },
  {
    id: 'special-functions', title: '特殊函数', english: 'Special Functions', domain: 'analysis', level: 3, x: 4350, y: 680,
    summary: '研究Bessel函数、Legendre多项式等典型方程的标准解。', why: '特殊函数把一大类物理和工程模型归结为可复用的解析工具。', prerequisites: ['fourier-transform', 'laplace-transform'],
    fieldTags: ['连续变化', '计算方法', '数学建模'], tags: ['Bessel函数', 'Legendre多项式', '正交多项式'], hours: 44,
  },
]

const calculusOfVariationsNodes: MathNode[] = [
  {
    id: 'variational-functionals', title: '泛函与变分', english: 'Functionals & Variations', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '研究以函数为输入的量以及函数空间中的扰动。', why: '泛函把优化问题从有限维变量扩展到整条曲线和整个场。', prerequisites: [],
    fieldTags: ['连续变化', '抽象结构', '最优化'], tags: ['泛函', '扰动', '函数空间'], hours: 28,
  },
  {
    id: 'variational-first-variation', title: '第一变分', english: 'First Variation', domain: 'analysis', level: 1, x: 1650, y: 680,
    summary: '计算泛函在微小扰动下的一阶变化。', why: '第一变分给出泛函取得极值的必要条件。', prerequisites: ['variational-functionals'],
    fieldTags: ['连续变化', '计算方法', '最优化'], tags: ['第一变分', '驻值', '必要条件'], hours: 30,
  },
  {
    id: 'euler-lagrange-equations', title: 'Euler–Lagrange方程', english: 'Euler–Lagrange Equations', domain: 'analysis', level: 2, x: 3000, y: 260,
    summary: '由第一变分推导极值曲线满足的微分方程。', why: '它把变分问题转化为可求解的微分方程。', prerequisites: ['variational-first-variation'],
    fieldTags: ['连续变化', '计算方法', '最优化'], tags: ['Euler-Lagrange', '极值曲线', '微分方程'], hours: 34,
  },
  {
    id: 'constrained-variations', title: '约束变分', english: 'Constrained Variations', domain: 'analysis', level: 2, x: 3000, y: 1100,
    summary: '研究带积分约束、边界约束和几何约束的变分问题。', why: '约束变分用于处理守恒量、资源限制和可行空间。', prerequisites: ['variational-first-variation'],
    fieldTags: ['连续变化', '最优化', '数学建模'], tags: ['约束', '乘子法', '边界条件'], hours: 34,
  },
  {
    id: 'variational-principles', title: '变分原理', english: 'Variational Principles', domain: 'applied', level: 3, x: 4350, y: 680,
    summary: '用作用量、能量和弱形式表达物理与工程规律。', why: '变分原理连接力学、场论、偏微分方程和有限元。', prerequisites: ['euler-lagrange-equations', 'constrained-variations'],
    fieldTags: ['数学建模', '连续变化', '最优化'], tags: ['最小作用量', '能量泛函', '弱形式'], hours: 42,
  },
]

const differentialEquationNodes: MathNode[] = [
  {
    id: 'differential-odes', title: '常微分方程', english: 'Ordinary Differential Equations', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '研究单一自变量下未知函数及其导数的关系。', why: '常微分方程描述随时间演化的连续系统。', prerequisites: [],
    fieldTags: ['连续变化', '计算方法', '数学建模'], tags: ['ODE', '初值问题', '相图'], hours: 46,
  },
  {
    id: 'differential-existence-uniqueness', title: '存在性与唯一性', english: 'Existence & Uniqueness', domain: 'analysis', level: 1, x: 1650, y: 260,
    summary: '研究微分方程解何时存在、何时唯一以及如何依赖初值。', why: '它先确认模型具有明确解，再讨论求解和近似。', prerequisites: ['differential-odes'],
    fieldTags: ['连续变化', '证明推理'], tags: ['存在性', '唯一性', '初值依赖'], hours: 34,
  },
  {
    id: 'differential-pdes', title: '偏微分方程', english: 'Partial Differential Equations', domain: 'analysis', level: 2, x: 3000, y: 680,
    summary: '研究多变量函数及其偏导数满足的方程。', why: '偏微分方程描述波、扩散、势场和连续介质。', prerequisites: ['differential-existence-uniqueness'],
    fieldTags: ['连续变化', '空间形态', '数学建模'], tags: ['PDE', '扩散', '波动'], hours: 70,
  },
  {
    id: 'differential-boundary-value', title: '边值问题', english: 'Boundary Value Problems', domain: 'analysis', level: 3, x: 4350, y: 260,
    summary: '研究在空间边界上附加条件的微分方程。', why: '边值问题把局部方程与实际区域和边界约束结合。', prerequisites: ['differential-pdes'],
    fieldTags: ['连续变化', '空间形态', '数学建模'], tags: ['边界条件', '椭圆方程', '弱解'], hours: 42,
  },
  {
    id: 'differential-green-functions', title: 'Green函数', english: 'Green Functions', domain: 'analysis', level: 4, x: 5700, y: 260,
    summary: '用点源响应构造线性边值问题的解。', why: 'Green函数连接微分算子、积分表示和物理响应。', prerequisites: ['differential-boundary-value'],
    fieldTags: ['连续变化', '计算方法', '数学建模'], tags: ['点源', '基本解', '积分核'], hours: 38,
  },
  {
    id: 'fluid-dynamics', title: '流体力学', english: 'Fluid Dynamics', domain: 'applied', level: 4, x: 5700, y: 1100,
    summary: '用微分方程研究液体和气体的运动、压力与涡旋。', why: '流体力学连接连续介质模型、数值计算和工程问题。', prerequisites: ['differential-pdes'],
    fieldTags: ['连续变化', '数学建模', '计算方法'], tags: ['纳维-斯托克斯', '湍流', '连续介质'], hours: 60,
  },
]

const numericalAnalysisNodes: MathNode[] = [
  {
    id: 'numerical-error-stability', title: '误差、稳定性与收敛', english: 'Error, Stability & Convergence', domain: 'applied', level: 0, x: 300, y: 680,
    summary: '研究舍入误差、截断误差及算法误差的传播。', why: '它决定数值结果是否可信以及精度如何随计算改进。', prerequisites: [],
    fieldTags: ['计算方法', '证明推理'], tags: ['误差分析', '稳定性', '收敛阶'], hours: 34,
  },
  {
    id: 'numerical-linear-algebra', title: '数值线性代数', english: 'Numerical Linear Algebra', domain: 'applied', level: 1, x: 1650, y: 260,
    summary: '研究线性方程组、特征值和矩阵分解的稳定算法。', why: '大量科学计算最终都归结为规模庞大的线性代数问题。', prerequisites: ['numerical-error-stability'],
    fieldTags: ['计算方法', '抽象结构'], tags: ['矩阵分解', '线性方程组', '特征值'], hours: 48,
  },
  {
    id: 'numerical-calculus', title: '数值微分与积分', english: 'Numerical Differentiation & Integration', domain: 'applied', level: 1, x: 1650, y: 1100,
    summary: '用离散采样近似导数和积分。', why: '它处理缺少解析表达或只能通过数据观测的连续量。', prerequisites: ['numerical-error-stability'],
    fieldTags: ['计算方法', '连续变化'], tags: ['差分', '求积', '插值'], hours: 38,
  },
  {
    id: 'numerical-nonlinear-iteration', title: '非线性迭代', english: 'Nonlinear Iteration', domain: 'applied', level: 2, x: 3000, y: 260,
    summary: '用不动点、Newton法等迭代方法求解非线性问题。', why: '非线性方程通常依赖逐步逼近获得可计算解。', prerequisites: ['numerical-linear-algebra'],
    fieldTags: ['计算方法', '最优化'], tags: ['Newton法', '不动点迭代', '收敛域'], hours: 36,
  },
  {
    id: 'numerical-ode-pde', title: '微分方程数值解', english: 'Numerical ODEs & PDEs', domain: 'applied', level: 2, x: 3000, y: 1100,
    summary: '用时间步进、差分和离散化方法近似微分方程。', why: '数值方法让复杂动态和连续介质模型能够被实际求解。', prerequisites: ['numerical-calculus'],
    fieldTags: ['计算方法', '连续变化', '数学建模'], tags: ['时间步进', '有限差分', '离散化'], hours: 52,
  },
  {
    id: 'finite-element-methods', title: '有限元方法', english: 'Finite Element Methods', domain: 'applied', level: 4, x: 4350, y: 1100,
    summary: '把复杂区域划分为单元，并通过弱形式近似偏微分方程。', why: '有限元适合复杂几何、材料和工程边界条件。', prerequisites: ['numerical-linear-algebra', 'numerical-ode-pde'],
    fieldTags: ['计算方法', '空间形态', '数学建模'], tags: ['网格', '弱形式', '离散空间'], hours: 58,
  },
]

const topologyAnalysisNodes: MathNode[] = [
  {
    id: 'metric-spaces', title: '度量空间', english: 'Metric Spaces', domain: 'geometry', level: 0, x: 300, y: 680,
    summary: '用距离公理描述点之间的接近程度。', why: '度量空间把实分析中的极限与连续推广到一般空间。', prerequisites: [],
    fieldTags: ['空间形态', '抽象结构', '基础语言'], tags: ['度量', '开球', '距离'], hours: 30,
  },
  {
    id: 'metric-convergence-continuity', title: '收敛与连续', english: 'Convergence & Continuity', domain: 'geometry', level: 1, x: 1650, y: 680,
    summary: '研究度量空间中的序列收敛、连续映射和极限。', why: '它提炼分析学中与坐标表达无关的核心结构。', prerequisites: ['metric-spaces'],
    fieldTags: ['空间形态', '连续变化', '证明推理'], tags: ['序列收敛', '连续映射', '极限'], hours: 34,
  },
  {
    id: 'metric-completeness', title: '完备性', english: 'Completeness', domain: 'geometry', level: 2, x: 3000, y: 260,
    summary: '研究每个Cauchy序列都能在空间内收敛的性质。', why: '完备性保证极限过程不会逃出当前空间。', prerequisites: ['metric-convergence-continuity'],
    fieldTags: ['空间形态', '连续变化', '证明推理'], tags: ['Cauchy序列', '完备化', '极限'], hours: 32,
  },
  {
    id: 'metric-compactness', title: '紧致性', english: 'Compactness', domain: 'geometry', level: 2, x: 3000, y: 1100,
    summary: '研究可由有限信息控制的空间性质。', why: '紧致性支撑极值存在、子序列收敛和一致性结论。', prerequisites: ['metric-convergence-continuity'],
    fieldTags: ['空间形态', '连续变化', '证明推理'], tags: ['有限子覆盖', '序列紧致', '极值'], hours: 36,
  },
  {
    id: 'metric-constructions', title: '度量构造', english: 'Metric Constructions', domain: 'geometry', level: 3, x: 4350, y: 260,
    summary: '研究子空间、积空间、商空间和函数空间上的度量。', why: '度量构造让复杂空间继承可分析的距离结构。', prerequisites: ['metric-completeness', 'metric-compactness'],
    fieldTags: ['空间形态', '抽象结构', '证明推理'], tags: ['积度量', '商空间', '函数空间'], hours: 38,
  },
  {
    id: 'fractal-geometry', title: '分形几何', english: 'Fractal Geometry', domain: 'geometry', level: 4, x: 5700, y: 260,
    summary: '研究自相似结构、分形维数和不规则几何形态。', why: '分形几何用于描述经典欧氏几何难以刻画的复杂边界。', prerequisites: ['metric-constructions'],
    fieldTags: ['空间形态', '抽象结构', '连续变化'], tags: ['自相似', '分形维数', '迭代'], hours: 36,
  },
]

const dynamicalSystemsNodes: MathNode[] = [
  {
    id: 'dynamical-stability-bifurcation', title: '稳定性与分岔', english: 'Stability & Bifurcation', domain: 'analysis', level: 0, x: 300, y: 680,
    summary: '研究平衡状态的稳定性以及参数变化引发的定性转变。', why: '稳定性与分岔解释系统何时保持行为、何时突然改变。', prerequisites: [],
    fieldTags: ['连续变化', '数学建模', '证明推理'], tags: ['稳定性', '分岔', '相空间'], hours: 40,
  },
  {
    id: 'chaos-theory', title: '混沌理论', english: 'Chaos Theory', domain: 'analysis', level: 1, x: 1650, y: 680,
    summary: '研究确定性系统中的敏感依赖和复杂长期行为。', why: '混沌理论说明简单规律也能产生难以长期预测的演化。', prerequisites: ['dynamical-stability-bifurcation'],
    fieldTags: ['连续变化', '数学建模', '计算方法'], tags: ['敏感依赖', '吸引子', '遍历'], hours: 40,
  },
  {
    id: 'complex-dynamics', title: '复动力系统', english: 'Complex Dynamics', domain: 'analysis', level: 2, x: 3000, y: 680,
    summary: '研究复函数反复迭代产生的轨道、稳定区域和分形边界。', why: '复动力系统连接复分析、动力系统、混沌和分形几何。', prerequisites: ['chaos-theory'],
    fieldTags: ['连续变化', '空间形态', '数学建模'], tags: ['复迭代', 'Julia集', '分形'], hours: 32,
  },
  {
    id: 'complex-iteration', title: '复迭代', english: 'Complex Iteration', domain: 'analysis', level: 3, x: 4350, y: 680,
    summary: '研究复函数反复复合后产生的轨道和稳定区域。', why: '复迭代把解析函数的局部规则转化为全局动力结构。', prerequisites: ['complex-dynamics'],
    fieldTags: ['连续变化', '空间形态', '计算方法'], tags: ['复映射', '轨道', '迭代'], hours: 34,
  },
  {
    id: 'julia-mandelbrot', title: 'Julia集与Mandelbrot集', english: 'Julia & Mandelbrot Sets', domain: 'analysis', level: 3, x: 4350, y: 260,
    summary: '研究复二次映射的稳定边界和参数空间。', why: '这些集合直观展示分形、混沌和参数分岔之间的联系。', prerequisites: ['complex-iteration'],
    fieldTags: ['空间形态', '连续变化', '计算方法'], tags: ['Julia集', 'Mandelbrot集', '分形'], hours: 32,
  },
  {
    id: 'holomorphic-dynamics', title: '全纯动力系统', english: 'Holomorphic Dynamics', domain: 'analysis', level: 4, x: 5700, y: 680,
    summary: '研究全纯映射和有理映射的长期迭代结构。', why: '全纯动力系统把复分析的刚性与动力系统的演化结合。', prerequisites: ['complex-iteration', 'julia-mandelbrot'],
    fieldTags: ['连续变化', '空间形态', '证明推理'], tags: ['全纯映射', 'Fatou集', '周期点'], hours: 48,
  },
]

export const analysisSceneNodes = {
  'real-analysis': realAnalysisNodes,
  'complex-analysis': complexAnalysisNodes,
  'functional-analysis': functionalAnalysisNodes,
  'measure-theory': measureTheoryNodes,
  'fourier-analysis': fourierAnalysisNodes,
  'calculus-of-variations': calculusOfVariationsNodes,
  'numerical-analysis': numericalAnalysisNodes,
  'differential-equations': differentialEquationNodes,
  topology: topologyAnalysisNodes,
  'dynamical-systems': dynamicalSystemsNodes,
} satisfies Readonly<Record<string, MathNode[]>>
