export type DomainId =
  | 'foundation'
  | 'algebra'
  | 'geometry'
  | 'analysis'
  | 'discrete'
  | 'probability'
  | 'applied'

export type FieldTagId =
  | '基础语言'
  | '证明推理'
  | '抽象结构'
  | '连续变化'
  | '空间形态'
  | '离散结构'
  | '不确定性'
  | '计算方法'
  | '数据推断'
  | '数学建模'
  | '最优化'
  | '直观基础'
  | '方程计算'
  | '空间结构'
  | '几何与谱'
  | '进阶工具'

export type MathNode = {
  id: string
  title: string
  english: string
  domain: DomainId
  level: 0 | 1 | 2 | 3 | 4
  x: number
  y: number
  summary: string
  why: string
  prerequisites: string[]
  recommendedPrerequisites?: string[]
  canonicalConceptId?: string
  fieldTags: FieldTagId[]
  tags: string[]
  hours: number
}

export type TagField = {
  id: FieldTagId
  color: string
  description: string
  minimumMembers?: number
}

export type Domain = {
  id: DomainId
  name: string
  english: string
  symbol: string
  color: string
  soft: string
  region: { x: number; y: number; w: number; h: number; rotate: number }
}

export const domains: Domain[] = [
  { id: 'foundation', name: '数学基础', english: 'FOUNDATIONS', symbol: '∴', color: '#6d5842', soft: '#e7dac2', region: { x: -220, y: 330, w: 1160, h: 860, rotate: -5 } },
  { id: 'algebra', name: '代数学', english: 'ALGEBRA', symbol: 'x²', color: '#a64032', soft: '#efd0c3', region: { x: 680, y: -180, w: 1760, h: 800, rotate: -3 } },
  { id: 'geometry', name: '几何与拓扑', english: 'GEOMETRY', symbol: '△', color: '#bc792f', soft: '#f0d9b7', region: { x: 760, y: 430, w: 1850, h: 720, rotate: 3 } },
  { id: 'analysis', name: '分析学', english: 'ANALYSIS', symbol: '∫', color: '#275d58', soft: '#c7ddd3', region: { x: 760, y: 910, w: 2140, h: 740, rotate: -2 } },
  { id: 'discrete', name: '离散数学', english: 'DISCRETE', symbol: '#', color: '#4d598a', soft: '#d1d7ea', region: { x: 450, y: 1480, w: 1980, h: 720, rotate: 2 } },
  { id: 'probability', name: '概率与统计', english: 'PROBABILITY', symbol: 'P', color: '#8b4865', soft: '#e7cbd7', region: { x: 1960, y: 1560, w: 1580, h: 730, rotate: -4 } },
  { id: 'applied', name: '应用数学', english: 'APPLICATIONS', symbol: '↗', color: '#3d6a8b', soft: '#cbddea', region: { x: 2700, y: 200, w: 1580, h: 1360, rotate: 3 } },
]

export const tagFields: TagField[] = [
  { id: '基础语言', color: '#d79a48', description: '定义、对象与共同表达方式' },
  { id: '证明推理', color: '#d95f55', description: '严密论证与公理化方法' },
  { id: '抽象结构', color: '#8766c4', description: '结构、映射与不变量' },
  { id: '连续变化', color: '#3caa92', description: '极限、变化与连续系统' },
  { id: '空间形态', color: '#dfa044', description: '形状、空间与几何关系' },
  { id: '离散结构', color: '#6179c5', description: '有限对象、网络与组合关系' },
  { id: '不确定性', color: '#cf6991', description: '随机性、概率与风险' },
  { id: '计算方法', color: '#70a258', description: '可执行的求解与近似方法' },
  { id: '数据推断', color: '#4f9cae', description: '从观测数据形成结论' },
  { id: '数学建模', color: '#4b8fbd', description: '现实系统的数学表达' },
  { id: '最优化', color: '#b98245', description: '约束下寻找最佳方案' },
]

export const mathNodes: MathNode[] = [
  {
    id: 'numbers', title: '数与运算', english: 'Numbers & Arithmetic', domain: 'foundation', level: 0, x: 0, y: 650,
    summary: '整数、分数、实数与复数，以及它们的运算规则。', why: '几乎所有定量推理的共同起点。', prerequisites: [], fieldTags: ['基础语言', '计算方法'], tags: ['数系', '运算律', '估算'], hours: 24,
  },
  {
    id: 'logic', title: '数理逻辑', english: 'Mathematical Logic', domain: 'foundation', level: 0, x: 40, y: 900,
    summary: '命题、量词、蕴含与等价，训练严密表达。', why: '读懂定义、拆解论证和书写证明的语法。', prerequisites: [], fieldTags: ['基础语言', '证明推理', '离散结构'], tags: ['命题', '量词', '真值'], hours: 18,
  },
  {
    id: 'sets', title: '集合论基础', english: 'Set Theory', domain: 'foundation', level: 0, x: 330, y: 480,
    summary: '集合、映射、关系、笛卡尔积与基本基数观念。', why: '现代数学用来组织对象的通用语言。', prerequisites: ['logic'], fieldTags: ['基础语言', '抽象结构', '离散结构'], tags: ['集合', '映射', '关系'], hours: 20,
  },
  {
    id: 'proof', title: '证明方法', english: 'Proof Techniques', domain: 'foundation', level: 1, x: 360, y: 780,
    summary: '直接证明、反证法、归纳法与构造性证明。', why: '把直觉变成可检验、可复用的结论。', prerequisites: ['logic', 'sets'], fieldTags: ['证明推理', '基础语言'], tags: ['归纳', '反证', '构造'], hours: 28,
  },
  {
    id: 'functions', title: '函数与关系', english: 'Functions & Relations', domain: 'foundation', level: 1, x: 680, y: 600,
    summary: '从输入到输出的结构，包括单射、满射与复合。', why: '连接代数、几何、分析和概率的枢纽。', prerequisites: ['numbers', 'sets'], fieldTags: ['基础语言', '抽象结构', '连续变化'], tags: ['函数', '映射', '复合'], hours: 24,
  },
  {
    id: 'vectors-coordinates', title: '向量与坐标', english: 'Vectors & Coordinates', domain: 'foundation', level: 1, x: 690, y: 940,
    summary: '用有序分量表示具有多个方向或属性的量，并通过加法和数乘组合变化。', why: '它是线性代数、解析几何、力学、向量微积分和计算机图形学的共同入口。', prerequisites: ['numbers'], fieldTags: ['基础语言', '空间形态'], tags: ['向量', '坐标', '分量', '方向', '数乘'], hours: 10,
  },
  {
    id: 'elementary-algebra', title: '初等代数', english: 'Elementary Algebra', domain: 'algebra', level: 1, x: 890, y: 190,
    summary: '方程、不等式、多项式与代数式变形。', why: '学习抽象结构和连续变化前的计算语言。', prerequisites: ['numbers', 'functions'], fieldTags: ['计算方法', '抽象结构'], tags: ['方程', '多项式', '不等式'], hours: 45,
  },
  {
    id: 'linear-algebra', title: '线性代数', english: 'Linear Algebra', domain: 'algebra', level: 2, x: 1270, y: 80,
    summary: '从向量、矩阵和线性方程组出发，逐步研究空间、变换、正交、特征值与分解。', why: '机器学习、优化、几何和微分方程的基础设施。', prerequisites: ['elementary-algebra', 'vectors-coordinates'], recommendedPrerequisites: ['proof'], fieldTags: ['抽象结构', '空间形态', '计算方法'], tags: ['矩阵', '向量空间', '特征值'], hours: 90,
  },
  {
    id: 'number-theory', title: '初等数论', english: 'Number Theory', domain: 'algebra', level: 2, x: 1260, y: 360,
    summary: '整除、同余、素数与丢番图方程。', why: '研究整数内部结构，也是现代密码学的核心。', prerequisites: ['elementary-algebra', 'proof'], fieldTags: ['抽象结构', '离散结构', '证明推理'], tags: ['素数', '同余', '整除'], hours: 55,
  },
  {
    id: 'abstract-algebra', title: '抽象代数', english: 'Abstract Algebra', domain: 'algebra', level: 3, x: 1650, y: 170,
    summary: '用群、环、域研究运算背后的共同结构。', why: '揭示看似不同问题之间可迁移的结构。', prerequisites: ['linear-algebra', 'number-theory'], fieldTags: ['抽象结构', '证明推理'], tags: ['群', '环', '域'], hours: 90,
  },
  {
    id: 'group-theory', title: '群论', english: 'Group Theory', domain: 'algebra', level: 3, x: 2010, y: 20,
    summary: '对称性、群作用、正规子群与商群。', why: '统一描述几何、方程和物理中的对称。', prerequisites: ['abstract-algebra'], fieldTags: ['抽象结构', '空间形态', '证明推理'], tags: ['对称', '群作用', '商群'], hours: 65,
  },
  {
    id: 'rings-fields', title: '环与域', english: 'Rings & Fields', domain: 'algebra', level: 4, x: 2030, y: 330,
    summary: '理想、商环、扩域与多项式的代数结构。', why: '通向代数数论和代数几何。', prerequisites: ['abstract-algebra'], fieldTags: ['抽象结构', '证明推理'], tags: ['理想', '扩域', '多项式环'], hours: 75,
  },
  {
    id: 'category-theory', title: '范畴论', english: 'Category Theory', domain: 'algebra', level: 4, x: 2340, y: 170,
    summary: '用对象、态射、函子与自然变换比较数学结构。', why: '提供跨代数、拓扑和几何复用构造的统一语言。', prerequisites: ['abstract-algebra', 'topology'], fieldTags: ['抽象结构', '基础语言', '证明推理'], tags: ['态射', '函子', '自然变换'], hours: 90,
  },
  {
    id: 'euclidean-geometry', title: '欧氏几何', english: 'Euclidean Geometry', domain: 'geometry', level: 1, x: 950, y: 700,
    summary: '平面与空间中的形状、角度、相似和全等。', why: '建立空间直觉与公理化推理。', prerequisites: ['proof'], fieldTags: ['空间形态', '证明推理'], tags: ['公理', '相似', '圆'], hours: 45,
  },
  {
    id: 'analytic-geometry', title: '解析几何', english: 'Analytic Geometry', domain: 'geometry', level: 2, x: 1300, y: 590,
    summary: '用坐标和方程描述直线、曲线与曲面。', why: '把几何形状转译为可计算的代数。', prerequisites: ['elementary-algebra', 'euclidean-geometry'], fieldTags: ['空间形态', '计算方法'], tags: ['坐标', '曲线', '二次曲线'], hours: 42,
  },
  {
    id: 'vector-geometry', title: '向量几何', english: 'Vector Geometry', domain: 'geometry', level: 2, x: 1610, y: 790,
    summary: '以内积、外积、投影和空间变换研究向量之间的几何关系。', why: '连接线性代数、三维几何和物理。', prerequisites: ['vectors-coordinates', 'analytic-geometry'], recommendedPrerequisites: ['linear-algebra'], fieldTags: ['空间形态', '抽象结构'], tags: ['向量', '投影', '外积', '变换'], hours: 38,
  },
  {
    id: 'topology', title: '点集拓扑', english: 'Topology', domain: 'geometry', level: 3, x: 1990, y: 600,
    summary: '开集、连续、紧致、连通和拓扑空间。', why: '研究连续性最本质的结构。', prerequisites: ['sets', 'proof', 'real-analysis'], fieldTags: ['空间形态', '连续变化', '抽象结构'], tags: ['开集', '紧致', '连续'], hours: 85,
  },
  {
    id: 'differential-geometry', title: '微分几何', english: 'Differential Geometry', domain: 'geometry', level: 4, x: 2340, y: 830,
    summary: '流形、切空间、曲率与测地线。', why: '描述弯曲空间，是广义相对论的数学语言。', prerequisites: ['topology', 'multivariable', 'linear-algebra'], fieldTags: ['空间形态', '连续变化', '数学建模'], tags: ['流形', '曲率', '切空间'], hours: 110,
  },
  {
    id: 'algebraic-geometry', title: '代数几何', english: 'Algebraic Geometry', domain: 'geometry', level: 4, x: 2660, y: 650,
    summary: '通过多项式方程、代数簇与层研究几何对象。', why: '把代数结构与几何空间联系起来，并通向现代数论。', prerequisites: ['rings-fields', 'topology'], fieldTags: ['抽象结构', '空间形态', '证明推理'], tags: ['代数簇', '理想', '层'], hours: 135,
  },
  {
    id: 'precalculus', title: '初等函数', english: 'Precalculus', domain: 'analysis', level: 1, x: 930, y: 1170,
    summary: '幂、指数、对数和三角函数及其图像。', why: '为极限与微积分建立函数直觉。', prerequisites: ['elementary-algebra', 'functions'], fieldTags: ['连续变化', '计算方法'], tags: ['三角函数', '指数', '图像'], hours: 45,
  },
  {
    id: 'calculus', title: '微积分', english: 'Calculus', domain: 'analysis', level: 2, x: 1300, y: 1110,
    summary: '极限、导数、积分与微积分基本定理。', why: '量化连续变化和累积效应。', prerequisites: ['precalculus', 'analytic-geometry'], fieldTags: ['连续变化', '计算方法'], tags: ['极限', '导数', '积分'], hours: 90,
  },
  {
    id: 'multivariable', title: '多元微积分', english: 'Multivariable Calculus', domain: 'analysis', level: 3, x: 1640, y: 1010,
    summary: '偏导、重积分、梯度和向量场。', why: '处理高维系统、优化和连续物理场。', prerequisites: ['calculus', 'linear-algebra'], fieldTags: ['连续变化', '空间形态', '计算方法'], tags: ['偏导', '梯度', '重积分'], hours: 75,
  },
  {
    id: 'real-analysis', title: '实分析', english: 'Real Analysis', domain: 'analysis', level: 3, x: 1680, y: 1320,
    summary: '以严格方式重建极限、连续、微分与积分。', why: '为高等分析提供可靠地基。', prerequisites: ['calculus', 'proof'], fieldTags: ['连续变化', '证明推理', '抽象结构'], tags: ['收敛', '测度', '连续'], hours: 110,
  },
  {
    id: 'measure-theory', title: '测度论与积分', english: 'Measure Theory & Integration', domain: 'analysis', level: 4, x: 2320, y: 1500,
    summary: '以 σ 代数、可测函数和勒贝格积分刻画集合的大小与函数的累积。', why: '为现代积分、概率论和高等分析提供严格而稳定的共同语言。', prerequisites: ['real-analysis', 'sets', 'proof'], fieldTags: ['连续变化', '证明推理', '不确定性'], tags: ['σ代数', '可测函数', '勒贝格积分'], hours: 105,
  },
  {
    id: 'complex-analysis', title: '复分析', english: 'Complex Analysis', domain: 'analysis', level: 4, x: 2070, y: 1160,
    summary: '复变函数、解析性、留数与共形映射。', why: '以惊人的结构解决积分、波动和数论问题。', prerequisites: ['real-analysis', 'multivariable'], fieldTags: ['连续变化', '空间形态', '证明推理'], tags: ['解析函数', '留数', '共形'], hours: 90,
  },
  {
    id: 'differential-equations', title: '微分方程', english: 'Differential Equations', domain: 'analysis', level: 3, x: 2050, y: 1450,
    summary: '常微分与偏微分方程的建模和求解。', why: '描述动态系统、传播、振动和扩散。', prerequisites: ['calculus', 'linear-algebra', 'multivariable'], fieldTags: ['连续变化', '数学建模', '计算方法'], tags: ['ODE', 'PDE', '动力系统'], hours: 95,
  },
  {
    id: 'functional-analysis', title: '泛函分析', english: 'Functional Analysis', domain: 'analysis', level: 4, x: 2490, y: 1290,
    summary: '赋范空间、希尔伯特空间与算子理论。', why: '把线性代数扩展到无穷维空间。', prerequisites: ['real-analysis', 'linear-algebra', 'topology'], fieldTags: ['连续变化', '抽象结构', '证明推理'], tags: ['希尔伯特空间', '算子', '赋范空间'], hours: 120,
  },
  {
    id: 'fourier-analysis', title: '傅里叶与调和分析', english: 'Fourier & Harmonic Analysis', domain: 'analysis', level: 4, x: 2440, y: 1040,
    summary: '用傅里叶级数、傅里叶变换和频率分解研究函数、振荡与波。', why: '连接偏微分方程、信号处理和数学物理中的时空结构。', prerequisites: ['real-analysis', 'linear-algebra', 'measure-theory'], fieldTags: ['连续变化', '计算方法', '数学建模'], tags: ['傅里叶级数', '傅里叶变换', '频谱'], hours: 100,
  },
  {
    id: 'calculus-of-variations', title: '变分法', english: 'Calculus of Variations', domain: 'analysis', level: 4, x: 2810, y: 1200,
    summary: '研究泛函极值、欧拉—拉格朗日方程和约束下的变分原理。', why: '从函数与轨迹中寻找最优解，连接连续优化、物理和控制。', prerequisites: ['multivariable', 'real-analysis', 'optimization'], fieldTags: ['连续变化', '最优化', '数学建模'], tags: ['泛函', '欧拉—拉格朗日方程', '变分原理'], hours: 95,
  },
  {
    id: 'dynamical-systems', title: '动力系统', english: 'Dynamical Systems', domain: 'analysis', level: 4, x: 2720, y: 1510,
    summary: '研究相空间、轨道、稳定性、分岔与长期行为。', why: '用几何与分析解释连续系统如何随时间演化。', prerequisites: ['differential-equations', 'real-analysis'], fieldTags: ['连续变化', '空间形态', '数学建模'], tags: ['相空间', '稳定性', '分岔'], hours: 100,
  },
  {
    id: 'combinatorics', title: '组合数学', english: 'Combinatorics', domain: 'discrete', level: 2, x: 810, y: 1740,
    summary: '计数、递推、生成函数与极值方法。', why: '解决有限结构中的“有多少种”与“如何安排”。', prerequisites: ['proof', 'elementary-algebra'], fieldTags: ['离散结构', '计算方法', '证明推理'], tags: ['计数', '递推', '生成函数'], hours: 60,
  },
  {
    id: 'discrete-math', title: '离散结构', english: 'Discrete Structures', domain: 'discrete', level: 2, x: 1190, y: 1960,
    summary: '关系、偏序、布尔代数和有限结构。', why: '计算机科学与离散推理的共同基础。', prerequisites: ['logic', 'sets', 'proof'], fieldTags: ['离散结构', '抽象结构', '证明推理'], tags: ['偏序', '布尔代数', '关系'], hours: 55,
  },
  {
    id: 'graph-theory', title: '图论', english: 'Graph Theory', domain: 'discrete', level: 3, x: 1540, y: 1740,
    summary: '顶点、边、路径、匹配、着色与网络。', why: '刻画连接关系，从社交网络到交通系统。', prerequisites: ['combinatorics', 'discrete-math'], fieldTags: ['离散结构', '空间形态', '计算方法'], tags: ['网络', '路径', '匹配'], hours: 60,
  },
  {
    id: 'theory-of-computation', title: '理论计算机科学', english: 'Theory of Computation', domain: 'discrete', level: 3, x: 1840, y: 1810,
    summary: '研究形式语言、自动机、可计算性与计算复杂性。', why: '划定问题能否被计算以及需要多少资源的根本边界。', prerequisites: ['discrete-math', 'proof'], fieldTags: ['离散结构', '计算方法', '证明推理'], tags: ['自动机', '可计算性', '复杂度'], hours: 85,
  },
  {
    id: 'algorithms', title: '算法与复杂度', english: 'Algorithms', domain: 'discrete', level: 3, x: 1940, y: 1990,
    summary: '算法设计、正确性以及时间与空间效率分析。', why: '把数学结构变成高效、可执行的方法。', prerequisites: ['graph-theory', 'discrete-math', 'theory-of-computation'], fieldTags: ['计算方法', '离散结构', '证明推理'], tags: ['复杂度', '动态规划', '正确性'], hours: 90,
  },
  {
    id: 'probability', title: '概率论', english: 'Probability Theory', domain: 'probability', level: 2, x: 2250, y: 1770,
    summary: '随机变量、分布、期望、条件概率与极限定理。', why: '量化不确定性，是统计与随机系统的基础。', prerequisites: ['calculus', 'combinatorics'], fieldTags: ['不确定性', '连续变化', '计算方法'], tags: ['随机变量', '分布', '期望'], hours: 85,
  },
  {
    id: 'statistics', title: '数理统计', english: 'Mathematical Statistics', domain: 'probability', level: 3, x: 2620, y: 1940,
    summary: '估计、检验、回归与抽样理论。', why: '从有限数据中进行可靠推断。', prerequisites: ['probability', 'linear-algebra'], fieldTags: ['不确定性', '数据推断', '计算方法'], tags: ['估计', '检验', '回归'], hours: 90,
  },
  {
    id: 'stochastic', title: '随机过程', english: 'Stochastic Processes', domain: 'probability', level: 4, x: 2990, y: 1690,
    summary: '马尔可夫链、泊松过程、布朗运动与鞅。', why: '描述随时间演化的随机现象。', prerequisites: ['probability', 'real-analysis'], fieldTags: ['不确定性', '连续变化', '数学建模'], tags: ['马尔可夫链', '布朗运动', '鞅'], hours: 105,
  },
  {
    id: 'bayesian', title: '贝叶斯推断', english: 'Bayesian Inference', domain: 'probability', level: 4, x: 3210, y: 2070,
    summary: '先验、似然、后验与概率建模。', why: '以统一方式更新认知并表达不确定性。', prerequisites: ['statistics', 'probability'], fieldTags: ['不确定性', '数据推断', '数学建模'], tags: ['先验', '后验', 'MCMC'], hours: 75,
  },
  {
    id: 'numerical-analysis', title: '数值分析', english: 'Numerical Analysis', domain: 'applied', level: 3, x: 2920, y: 1120,
    summary: '近似计算、误差分析、插值与数值积分。', why: '让理论问题能在计算机上稳定求解。', prerequisites: ['calculus', 'linear-algebra'], fieldTags: ['计算方法', '连续变化'], tags: ['误差', '插值', '迭代法'], hours: 80,
  },
  {
    id: 'optimization', title: '最优化', english: 'Optimization', domain: 'applied', level: 3, x: 3020, y: 810,
    summary: '凸性、拉格朗日乘子、梯度法与约束优化。', why: '在约束下做出最佳选择，是AI与运筹的核心。', prerequisites: ['multivariable', 'linear-algebra'], fieldTags: ['最优化', '计算方法', '数学建模'], tags: ['凸优化', '梯度法', '约束'], hours: 85,
  },
  {
    id: 'game-theory', title: '博弈论', english: 'Game Theory', domain: 'applied', level: 4, x: 3240, y: 680,
    summary: '研究多个决策者之间的策略、均衡与合作。', why: '建模经济、网络、生物演化与多智能体中的相互作用。', prerequisites: ['probability', 'optimization'], fieldTags: ['最优化', '不确定性', '数学建模'], tags: ['纳什均衡', '策略', '机制设计'], hours: 80,
  },
  {
    id: 'cryptography', title: '现代密码学', english: 'Cryptography', domain: 'applied', level: 3, x: 2860, y: 360,
    summary: '公钥系统、签名、哈希与安全性证明。', why: '用数学保障数字世界的机密与信任。', prerequisites: ['number-theory', 'abstract-algebra', 'algorithms'], fieldTags: ['计算方法', '离散结构', '抽象结构'], tags: ['RSA', '签名', '安全性'], hours: 80,
  },
  {
    id: 'mathematical-modeling', title: '数学建模', english: 'Mathematical Modeling', domain: 'applied', level: 3, x: 3370, y: 1320,
    summary: '把现实问题抽象为变量、关系和可验证模型。', why: '将数学工具真正连接到现实决策。', prerequisites: ['calculus', 'probability', 'differential-equations'], fieldTags: ['数学建模', '连续变化', '不确定性'], tags: ['抽象', '模拟', '验证'], hours: 70,
  },
  {
    id: 'machine-learning', title: '机器学习', english: 'Machine Learning', domain: 'applied', level: 4, x: 3420, y: 930,
    summary: '监督学习、表示学习、泛化与模型评估。', why: '从数据中自动发现结构并进行预测。', prerequisites: ['linear-algebra', 'optimization', 'statistics', 'algorithms'], fieldTags: ['数据推断', '最优化', '计算方法'], tags: ['泛化', '神经网络', '模型'], hours: 120,
  },
  {
    id: 'control-theory', title: '控制理论', english: 'Control Theory', domain: 'applied', level: 4, x: 3740, y: 650,
    summary: '反馈、稳定性、状态空间和最优控制。', why: '让动态系统按目标稳定运行。', prerequisites: ['differential-equations', 'linear-algebra', 'optimization'], fieldTags: ['数学建模', '连续变化', '最优化'], tags: ['反馈', '稳定性', '状态空间'], hours: 100,
  },
  {
    id: 'math-physics', title: '数学物理', english: 'Mathematical Physics', domain: 'applied', level: 4, x: 3780, y: 250,
    summary: '用分析、几何和代数研究物理定律。', why: '在对称、空间与动力学之间建立深层联系。', prerequisites: ['differential-equations', 'complex-analysis', 'differential-geometry'], fieldTags: ['数学建模', '连续变化', '空间形态'], tags: ['场论', '量子', '相对论'], hours: 150,
  },
]

export const domainById = Object.fromEntries(domains.map((domain) => [domain.id, domain])) as Record<DomainId, Domain>

export const levelNames = ['启程', '基础', '核心', '进阶', '前沿']
