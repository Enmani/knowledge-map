import { buildCatalog } from './helpers'

const physicsCatalog = buildCatalog([
  {
    id: 'measurement-units', title: '测量与单位', englishTitle: 'Measurement & Units',
    summary: '把物理量、尺度、误差和可重复实验联系起来。',
    primaryDomain: 'physics', tags: ['测量', '基础语言'], level: 0, importance: 1.15,
  },
  {
    id: 'experimental-methods', title: '实验物理与误差分析', englishTitle: 'Experimental Physics & Error Analysis',
    summary: '通过实验设计、仪器校准、不确定度传播和统计检验建立可靠结论。',
    primaryDomain: 'physics', tags: ['测量', '数据', '基础语言'], level: 1, importance: 1.1, strict: ['measurement-units'], recommended: ['statistics'],
  },
  {
    id: 'computational-physics', title: '计算物理', englishTitle: 'Computational Physics',
    summary: '使用数值算法、模拟和数据计算研究难以解析求解的物理系统。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['计算方法', '建模', '数据'], level: 2, importance: 1.1, strict: ['measurement-units'], recommended: ['linear-algebra', 'calculus', 'differential-equations'],
  },
  {
    id: 'classical-mechanics', title: '经典力学', englishTitle: 'Classical Mechanics',
    summary: '以力、动量和运动定律研究宏观物体和多体系统。',
    primaryDomain: 'physics', tags: ['运动', '建模'], level: 1, importance: 1.25, strict: ['measurement-units'], recommended: ['calculus'],
  },
  {
    id: 'energy', title: '能量与守恒', englishTitle: 'Energy & Conservation',
    summary: '用守恒量统一比较机械、热、电磁、化学和生命过程。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry', 'biology'], tags: ['守恒', '跨学科'], level: 1, importance: 1.3, strict: ['classical-mechanics'],
  },
  {
    id: 'analytical-mechanics', title: '分析力学', englishTitle: 'Analytical Mechanics',
    summary: '以作用量、拉格朗日量和哈密顿量统一描述约束系统与复杂运动。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['运动', '建模', '守恒'], level: 3, strict: ['classical-mechanics', 'calculus'], recommended: ['calculus-of-variations'],
  },
  {
    id: 'continuum-mechanics', title: '连续介质力学', englishTitle: 'Continuum Mechanics',
    summary: '以应力、应变和守恒方程描述固体与流体的连续宏观行为。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['连续变化', '建模', '系统'], level: 3, strict: ['classical-mechanics', 'differential-equations'], recommended: ['energy'],
  },
  {
    id: 'fluid-dynamics', title: '流体力学', englishTitle: 'Fluid Dynamics',
    summary: '用连续介质模型研究液体和气体的运动、涡旋和湍流。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics', 'biology'], tags: ['连续变化', '动力系统'], level: 3, strict: ['continuum-mechanics'], recommended: ['computational-physics'],
  },
  {
    id: 'waves-oscillations', title: '振动与波', englishTitle: 'Waves & Oscillations',
    summary: '研究周期变化、传播、叠加、共振与频谱。',
    primaryDomain: 'physics', tags: ['波', '连续变化'], level: 2, strict: ['classical-mechanics'], recommended: ['differential-equations'],
  },
  {
    id: 'acoustics', title: '声学', englishTitle: 'Acoustics',
    summary: '研究声波的产生、传播、共振、测量以及与介质和听觉系统的作用。',
    primaryDomain: 'physics', domains: ['physics', 'biology'], tags: ['波', '测量', '系统'], level: 2, strict: ['waves-oscillations'], recommended: ['fluid-dynamics'],
  },
  {
    id: 'electromagnetism', title: '电磁学', englishTitle: 'Electromagnetism',
    summary: '统一电场、磁场、电荷、电流和电磁波。',
    primaryDomain: 'physics', tags: ['场', '波'], level: 2, importance: 1.2, strict: ['measurement-units'], recommended: ['calculus', 'waves-oscillations'],
  },
  {
    id: 'optics', title: '光学', englishTitle: 'Optics',
    summary: '研究光的传播、成像、干涉、衍射以及与物质的作用。',
    primaryDomain: 'physics', tags: ['波', '成像'], level: 2, strict: ['waves-oscillations', 'electromagnetism'],
  },
  {
    id: 'nonlinear-optics', title: '非线性光学', englishTitle: 'Nonlinear Optics',
    summary: '研究强光场引起的频率转换、自聚焦和非线性介质响应。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['波', '场', '复杂性'], level: 4, strict: ['optics', 'electromagnetism'], recommended: ['quantum-mechanics'],
  },
  {
    id: 'photonics-lasers', title: '激光与光子学', englishTitle: 'Lasers & Photonics',
    summary: '研究受激辐射、光源、波导和光子器件中光的产生、调控与传输。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['波', '场', '成像'], level: 4, strict: ['optics', 'quantum-mechanics', 'atomic-molecular-physics'], recommended: ['nonlinear-optics'],
  },
  {
    id: 'thermodynamics', title: '热力学', englishTitle: 'Thermodynamics',
    summary: '用温度、熵、能量和状态函数研究宏观过程。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry', 'biology'], tags: ['能量', '系统'], level: 2, importance: 1.2, strict: ['energy'],
  },
  {
    id: 'statistical-mechanics', title: '统计力学', englishTitle: 'Statistical Mechanics',
    summary: '从微观随机状态推导温度、熵、输运和相变。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics', 'chemistry'], tags: ['不确定性', '涌现'], level: 3, strict: ['thermodynamics', 'probability'],
  },
  {
    id: 'kinetic-theory', title: '气体动理论', englishTitle: 'Kinetic Theory',
    summary: '从粒子运动、碰撞和分布函数推导气体输运与宏观热学性质。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry', 'mathematics'], tags: ['微观', '不确定性', '能量'], level: 3, strict: ['thermodynamics', 'probability'], recommended: ['statistical-mechanics'],
  },
  {
    id: 'phase-transitions-criticality', title: '相变与临界现象', englishTitle: 'Phase Transitions & Critical Phenomena',
    summary: '研究物态转变、序参量、对称性破缺和临界尺度下的普适行为。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry', 'mathematics'], tags: ['涌现', '系统', '复杂性'], level: 4, strict: ['statistical-mechanics'], recommended: ['condensed-matter'],
  },
  {
    id: 'nonequilibrium-statistical-physics', title: '非平衡统计物理', englishTitle: 'Nonequilibrium Statistical Physics',
    summary: '研究输运、耗散、涨落和远离热平衡系统的时间演化。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics', 'chemistry', 'biology'], tags: ['动力系统', '涌现', '复杂性'], level: 4, strict: ['statistical-mechanics', 'differential-equations'], recommended: ['dynamical-systems'],
  },
  {
    id: 'soft-matter-physics', title: '软物质物理', englishTitle: 'Soft Matter Physics',
    summary: '研究聚合物、胶体、液晶和颗粒体系中热涨落与集体结构。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry', 'biology'], tags: ['材料', '涌现', '跨学科'], level: 4, strict: ['statistical-mechanics', 'continuum-mechanics'], recommended: ['fluid-dynamics'],
  },
  {
    id: 'biophysics', title: '生物物理学', englishTitle: 'Biophysics',
    summary: '用力学、热统计、输运和信息方法研究分子、细胞与生命系统。',
    primaryDomain: 'physics', domains: ['physics', 'biology', 'chemistry'], tags: ['生命', '系统', '跨学科'], level: 4, importance: 1.1, strict: ['thermodynamics', 'statistical-mechanics'], recommended: ['fluid-dynamics', 'soft-matter-physics'],
  },
  {
    id: 'quantum-mechanics', title: '量子力学', englishTitle: 'Quantum Mechanics',
    summary: '以状态、算符、概率幅和测量描述微观系统。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['微观', '不确定性'], level: 3, importance: 1.2, strict: ['waves-oscillations', 'linear-algebra'], recommended: ['probability'],
  },
  {
    id: 'atomic-molecular-physics', title: '原子与分子物理', englishTitle: 'Atomic & Molecular Physics',
    summary: '研究原子、简单分子、电子和光之间的量子结构与相互作用。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['微观', '场', '测量'], level: 4, importance: 1.15, strict: ['quantum-mechanics', 'electromagnetism'], recommended: ['optics'],
  },
  {
    id: 'atomic-molecular-spectroscopy', title: '原子分子光谱学', englishTitle: 'Atomic & Molecular Spectroscopy',
    summary: '从原子与分子的吸收、发射和散射频谱推断能级、结构和动力学。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['测量', '微观', '数据'], level: 4, strict: ['atomic-molecular-physics', 'optics'], recommended: ['experimental-methods'],
  },
  {
    id: 'quantum-optics', title: '量子光学', englishTitle: 'Quantum Optics',
    summary: '研究光的量子态、光子统计以及光与量子物质的相干作用。',
    primaryDomain: 'physics', tags: ['微观', '波', '信息'], level: 4, strict: ['quantum-mechanics', 'optics'], recommended: ['atomic-molecular-physics'],
  },
  {
    id: 'quantum-information', title: '量子信息科学', englishTitle: 'Quantum Information Science',
    summary: '以叠加、纠缠和量子测量研究信息处理、通信、传感与计算。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['信息', '不确定性', '计算方法'], level: 4, importance: 1.15, strict: ['quantum-mechanics', 'linear-algebra'], recommended: ['quantum-optics'],
  },
  {
    id: 'ultracold-quantum-matter', title: '超冷量子物质', englishTitle: 'Ultracold Quantum Matter',
    summary: '研究接近绝对零度的量子气体、玻色凝聚与可控多体态。',
    primaryDomain: 'physics', tags: ['微观', '涌现', '测量'], level: 4, strict: ['atomic-molecular-physics', 'statistical-mechanics'], recommended: ['quantum-optics'],
  },
  {
    id: 'condensed-matter', title: '凝聚态物理', englishTitle: 'Condensed Matter Physics',
    summary: '研究多粒子系统、材料结构与集体现象。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['材料', '涌现'], level: 4, strict: ['quantum-mechanics', 'statistical-mechanics'],
  },
  {
    id: 'solid-state-physics', title: '固体物理', englishTitle: 'Solid-State Physics',
    summary: '研究晶体、能带、晶格振动和固体中的电子集体行为。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['材料', '微观', '涌现'], level: 4, strict: ['condensed-matter'],
  },
  {
    id: 'semiconductor-physics', title: '半导体物理', englishTitle: 'Semiconductor Physics',
    summary: '研究能带、载流子、掺杂和结结构，并连接电子与光电器件。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['材料', '微观', '信息'], level: 4, strict: ['solid-state-physics', 'quantum-mechanics'], recommended: ['electromagnetism'],
  },
  {
    id: 'magnetism-spin', title: '磁性与自旋物理', englishTitle: 'Magnetism & Spin Physics',
    summary: '研究自旋、磁序、交换作用和磁性材料中的集体现象。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['材料', '场', '微观'], level: 4, strict: ['solid-state-physics', 'quantum-mechanics'], recommended: ['statistical-mechanics'],
  },
  {
    id: 'superconductivity', title: '超导物理', englishTitle: 'Superconductivity',
    summary: '研究零电阻、迈斯纳效应和宏观量子相干形成的超导态。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['材料', '涌现', '微观'], level: 4, strict: ['condensed-matter', 'statistical-mechanics'], recommended: ['quantum-mechanics'],
  },
  {
    id: 'nanophysics', title: '纳米物理', englishTitle: 'Nanophysics',
    summary: '研究纳米尺度下的量子限域、表面效应和低维材料性质。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['材料', '微观', '跨学科'], level: 4, strict: ['condensed-matter', 'quantum-mechanics'], recommended: ['experimental-methods'],
  },
  {
    id: 'nuclear-physics', title: '核物理', englishTitle: 'Nuclear Physics',
    summary: '研究原子核结构、核力、衰变、反应和核物质的集体行为。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['微观', '能量', '守恒'], level: 4, importance: 1.15, strict: ['quantum-mechanics', 'energy'], recommended: ['relativity'],
  },
  {
    id: 'particle-physics', title: '粒子物理', englishTitle: 'Particle Physics',
    summary: '研究基本粒子、基本相互作用以及高能碰撞中的物质结构。',
    primaryDomain: 'physics', tags: ['微观', '场', '对称'], level: 4, importance: 1.2, strict: ['quantum-mechanics', 'relativity'], recommended: ['nuclear-physics'],
  },
  {
    id: 'quantum-field-theory', title: '量子场论', englishTitle: 'Quantum Field Theory',
    summary: '把粒子视为量子场的激发，并统一处理相对论与量子相互作用。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['场', '微观', '对称'], level: 4, importance: 1.15, strict: ['quantum-mechanics', 'relativity'], recommended: ['linear-algebra'],
  },
  {
    id: 'standard-model', title: '粒子物理标准模型', englishTitle: 'Standard Model of Particle Physics',
    summary: '以量子场论组织夸克、轻子以及强、弱和电磁相互作用。',
    primaryDomain: 'physics', tags: ['微观', '场', '对称'], level: 4, importance: 1.2, strict: ['particle-physics', 'quantum-field-theory'], recommended: ['experimental-methods'],
  },
  {
    id: 'plasma-physics', title: '等离子体物理', englishTitle: 'Plasma Physics',
    summary: '研究大量带电粒子在电磁场中的集体运动、波动和输运。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['场', '连续变化', '系统'], level: 4, importance: 1.15, strict: ['electromagnetism', 'fluid-dynamics', 'statistical-mechanics'], recommended: ['kinetic-theory'],
  },
  {
    id: 'fusion-energy', title: '核聚变与聚变能', englishTitle: 'Nuclear Fusion & Fusion Energy',
    summary: '研究轻核聚变、燃烧等离子体和受控能量释放所需的约束机制。',
    primaryDomain: 'physics', tags: ['能量', '场', '跨学科'], level: 4, strict: ['plasma-physics', 'nuclear-physics', 'energy'], recommended: ['computational-physics'],
  },
  {
    id: 'accelerator-detector-physics', title: '加速器与探测器物理', englishTitle: 'Accelerator & Detector Physics',
    summary: '研究粒子束的产生、加速、聚焦以及辐射和粒子信号的测量。',
    primaryDomain: 'physics', tags: ['测量', '场', '实验方法'], level: 4, strict: ['electromagnetism', 'relativity', 'experimental-methods'], recommended: ['particle-physics', 'nuclear-physics'],
  },
  {
    id: 'relativity', title: '相对论', englishTitle: 'Relativity',
    summary: '研究时空、引力以及高速运动中的物理规律。',
    primaryDomain: 'physics', tags: ['时空', '几何'], level: 3, strict: ['classical-mechanics', 'calculus'],
  },
  {
    id: 'general-relativity-gravitation', title: '广义相对论与引力', englishTitle: 'General Relativity & Gravitation',
    summary: '以弯曲时空描述引力、测地线、黑洞和引力场的动力学。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['时空', '几何', '场'], level: 4, importance: 1.15, strict: ['relativity', 'differential-geometry'], recommended: ['differential-equations'],
  },
  {
    id: 'astrophysics', title: '天体物理学', englishTitle: 'Astrophysics',
    summary: '用力学、电磁学、热学和量子理论解释行星、恒星、星系与高能天体。',
    primaryDomain: 'physics', tags: ['时空', '能量', '系统'], level: 3, importance: 1.2, strict: ['classical-mechanics', 'electromagnetism', 'thermodynamics'], recommended: ['relativity'],
  },
  {
    id: 'stellar-physics', title: '恒星物理', englishTitle: 'Stellar Physics',
    summary: '研究恒星结构、核合成、演化以及白矮星和中子星等致密天体。',
    primaryDomain: 'physics', domains: ['physics', 'chemistry'], tags: ['能量', '系统', '涌现'], level: 4, strict: ['astrophysics', 'nuclear-physics', 'thermodynamics'], recommended: ['statistical-mechanics'],
  },
  {
    id: 'gravitational-wave-physics', title: '引力波物理', englishTitle: 'Gravitational-Wave Physics',
    summary: '研究时空扰动的产生、传播、探测及其携带的天体信息。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['时空', '波', '测量'], level: 4, strict: ['general-relativity-gravitation', 'waves-oscillations'], recommended: ['experimental-methods'],
  },
  {
    id: 'cosmology', title: '宇宙学', englishTitle: 'Cosmology',
    summary: '研究宇宙整体的起源、膨胀、结构形成、暗物质和暗能量。',
    primaryDomain: 'physics', domains: ['physics', 'mathematics'], tags: ['时空', '涌现', '不确定性'], level: 4, importance: 1.2, strict: ['general-relativity-gravitation', 'astrophysics', 'statistical-mechanics'], recommended: ['particle-physics'],
  },
] as const)

export const physicsNodes = physicsCatalog.nodes
export const physicsEdges = physicsCatalog.edges
