import { buildCatalog } from './helpers'

const chemistryCatalog = buildCatalog([
  {
    id: 'chemical-language', title: '化学语言与命名', englishTitle: 'Chemical Language & Nomenclature',
    summary: '用元素符号、化学式、方程式和系统命名表示物质及其变化。',
    primaryDomain: 'chemistry', tags: ['基础语言', '命名'], level: 0, importance: 1.15, recommended: ['quantity-arithmetic'],
  },
  {
    id: 'matter-and-phases', title: '物质状态与相', englishTitle: 'Matter, States & Phases',
    summary: '研究物质组成、气液固状态、相变以及微观粒子与宏观性质的联系。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['物质', '系统'], level: 0, strict: ['chemical-language'],
  },
  {
    id: 'atomic-structure', title: '原子结构', englishTitle: 'Atomic Structure',
    summary: '研究原子核、电子排布、能级与量子态。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['微观', '结构'], level: 1, importance: 1.2, strict: ['chemical-language'], recommended: ['quantum-mechanics'],
  },
  {
    id: 'periodicity-elements', title: '元素周期性', englishTitle: 'Elements & Periodicity',
    summary: '用电子排布和周期表规律预测元素与化合物的性质和反应性。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['周期性', '结构'], level: 1, strict: ['atomic-structure'],
  },
  {
    id: 'chemical-bonding', title: '化学键', englishTitle: 'Chemical Bonding',
    summary: '解释原子如何通过电子相互作用形成分子和材料。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['结构', '微观'], level: 1, importance: 1.25, strict: ['periodicity-elements'],
  },
  {
    id: 'molecular-structure-intermolecular-forces', title: '分子结构与分子间作用力', englishTitle: 'Molecular Structure & Intermolecular Forces',
    summary: '用分子形状、极性和非共价作用解释物质的聚集结构与宏观性质。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics', 'biology'], tags: ['分子', '相互作用', '结构'], level: 1, importance: 1.15, strict: ['chemical-bonding'],
  },
  {
    id: 'stoichiometry', title: '化学计量', englishTitle: 'Stoichiometry',
    summary: '用物质的量和守恒关系计算反应组成、限量试剂和产率。',
    primaryDomain: 'chemistry', tags: ['数量', '守恒'], level: 1, strict: ['chemical-language'],
  },
  {
    id: 'chemical-reactions-redox', title: '化学反应与守恒', englishTitle: 'Chemical Reactions & Conservation',
    summary: '用原子、物质与电荷守恒表示化学转化，配平方程并区分主要反应类型。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['反应', '守恒'], level: 1, strict: ['stoichiometry', 'chemical-bonding'],
  },
  {
    id: 'solution-chemistry', title: '溶液化学', englishTitle: 'Solution Chemistry',
    summary: '研究溶剂化、浓度、活度、离子强度和依数性如何共同决定均相体系的性质。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics', 'biology'], tags: ['物质', '系统', '相互作用'], level: 1, strict: ['stoichiometry', 'molecular-structure-intermolecular-forces'], recommended: ['matter-and-phases'],
  },
  {
    id: 'acids-bases-solutions', title: '酸碱化学', englishTitle: 'Acid–Base Chemistry',
    summary: '研究酸碱理论、质子转移、pH、缓冲、滴定以及溶剂环境对酸碱平衡的影响。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['反应', '系统'], level: 2, strict: ['solution-chemistry', 'chemical-equilibrium'], recommended: ['chemical-bonding'],
  },
  {
    id: 'thermochemistry', title: '热化学', englishTitle: 'Thermochemistry',
    summary: '研究化学反应中的能量交换、焓变与热量计算。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['能量', '守恒'], level: 2, strict: ['stoichiometry'], recommended: ['thermodynamics'],
  },
  {
    id: 'chemical-equilibrium', title: '化学平衡', englishTitle: 'Chemical Equilibrium',
    summary: '研究可逆反应、平衡常数和外界条件对系统状态的影响。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['系统', '动力系统'], level: 2, strict: ['stoichiometry', 'chemical-reactions-redox'], recommended: ['solution-chemistry', 'thermochemistry'],
  },
  {
    id: 'chemical-kinetics', title: '化学动力学', englishTitle: 'Chemical Kinetics',
    summary: '研究反应速率、反应路径、速率方程和催化机制。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics', 'biology'], tags: ['动力系统', '反应'], level: 2, strict: ['stoichiometry', 'chemical-reactions-redox'], recommended: ['differential-equations'],
  },
  {
    id: 'electrochemistry', title: '电化学', englishTitle: 'Electrochemistry',
    summary: '研究氧化还原、电极过程以及化学能与电能之间的转换。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['能量', '反应', '测量'], level: 2, strict: ['chemical-reactions-redox', 'chemical-equilibrium'], recommended: ['electromagnetism'],
  },
  {
    id: 'phase-equilibria', title: '相平衡', englishTitle: 'Phase Equilibria',
    summary: '用相图和化学势研究多相体系的稳定状态与组成变化。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['系统', '材料'], level: 3, strict: ['thermochemistry', 'chemical-equilibrium'], recommended: ['thermodynamics'],
  },
  {
    id: 'physical-chemistry', title: '物理化学', englishTitle: 'Physical Chemistry',
    summary: '用热力学、量子理论、动力学和数学模型解释化学体系。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics', 'mathematics'], tags: ['跨学科', '建模'], level: 3, importance: 1.2, strict: ['thermochemistry', 'chemical-equilibrium', 'chemical-kinetics'], recommended: ['calculus'],
  },
  {
    id: 'spectroscopy', title: '光谱学', englishTitle: 'Spectroscopy',
    summary: '通过物质与电磁辐射的相互作用推断能级、组成和分子结构。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['测量', '微观'], level: 3, importance: 1.1, strict: ['atomic-structure', 'molecular-structure-intermolecular-forces'], recommended: ['optics', 'electromagnetism'],
  },
  {
    id: 'quantum-chemistry', title: '量子化学', englishTitle: 'Quantum Chemistry',
    summary: '用量子力学计算分子轨道、化学键、能量与光谱。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics', 'mathematics'], tags: ['微观', '计算方法'], level: 4, strict: ['chemical-bonding', 'quantum-mechanics'], recommended: ['linear-algebra'],
  },
  {
    id: 'organic-chemistry', title: '有机化学', englishTitle: 'Organic Chemistry',
    summary: '研究含碳分子的结构、性质、反应和合成。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['分子', '反应'], level: 2, strict: ['chemical-bonding'],
  },
  {
    id: 'stereochemistry', title: '立体化学', englishTitle: 'Stereochemistry',
    summary: '研究分子的三维构型、构象、手性及其对性质和反应的影响。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['分子', '结构'], level: 2, strict: ['organic-chemistry', 'molecular-structure-intermolecular-forces'],
  },
  {
    id: 'organic-reaction-mechanisms', title: '有机反应机理', englishTitle: 'Organic Reaction Mechanisms',
    summary: '用电子移动、过渡态和活性中间体解释有机反应的路径与选择性。',
    primaryDomain: 'chemistry', tags: ['反应', '动力系统'], level: 3, strict: ['organic-chemistry', 'acids-bases-solutions'], recommended: ['chemical-kinetics'],
  },
  {
    id: 'organic-synthesis', title: '有机合成', englishTitle: 'Organic Synthesis',
    summary: '通过官能团转化、路线设计和逆合成构建目标有机分子。',
    primaryDomain: 'chemistry', tags: ['反应', '设计'], level: 3, strict: ['organic-reaction-mechanisms', 'stereochemistry'], recommended: ['analytical-chemistry'],
  },
  {
    id: 'natural-products-chemistry', title: '天然产物化学', englishTitle: 'Natural Products Chemistry',
    summary: '研究生物来源小分子的分离、结构、生物合成、活性与全合成。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['分子', '生命'], level: 4, strict: ['organic-synthesis', 'biochemistry'],
  },
  {
    id: 'supramolecular-chemistry', title: '超分子化学', englishTitle: 'Supramolecular Chemistry',
    summary: '研究非共价作用驱动的分子识别、自组装和动态结构。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics', 'biology'], tags: ['分子', '自组装'], level: 4, strict: ['molecular-structure-intermolecular-forces', 'organic-chemistry'], recommended: ['thermochemistry'],
  },
  {
    id: 'catalysis', title: '催化化学', englishTitle: 'Catalysis',
    summary: '研究催化剂如何改变反应路径、速率和选择性并实现循环转化。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['反应', '动力系统'], level: 3, importance: 1.15, strict: ['chemical-kinetics', 'chemical-bonding'], recommended: ['organic-reaction-mechanisms', 'coordination-chemistry', 'enzymology'],
  },
  {
    id: 'inorganic-chemistry', title: '无机化学', englishTitle: 'Inorganic Chemistry',
    summary: '研究元素、配合物、矿物与无机材料的结构和反应。',
    primaryDomain: 'chemistry', tags: ['材料', '结构'], level: 2, strict: ['periodicity-elements', 'chemical-bonding'],
  },
  {
    id: 'coordination-chemistry', title: '配位化学', englishTitle: 'Coordination Chemistry',
    summary: '研究金属中心与配体形成的配合物及其结构、电子态和反应性。',
    primaryDomain: 'chemistry', tags: ['结构', '反应'], level: 3, strict: ['inorganic-chemistry', 'chemical-bonding'], recommended: ['spectroscopy'],
  },
  {
    id: 'organometallic-chemistry', title: '金属有机化学', englishTitle: 'Organometallic Chemistry',
    summary: '研究金属—碳键化合物的结构、反应机理及其在催化和合成中的作用。',
    primaryDomain: 'chemistry', tags: ['反应', '材料'], level: 4, strict: ['coordination-chemistry', 'organic-reaction-mechanisms'], recommended: ['catalysis'],
  },
  {
    id: 'solid-state-chemistry', title: '固态化学', englishTitle: 'Solid-State Chemistry',
    summary: '研究晶体结构、缺陷、能带和固体组成与性质之间的关系。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['结构', '材料'], level: 3, strict: ['inorganic-chemistry', 'chemical-bonding'], recommended: ['condensed-matter'],
  },
  {
    id: 'materials-chemistry', title: '材料化学', englishTitle: 'Materials Chemistry',
    summary: '通过组成、结构、合成和表征设计具有特定功能的材料。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['材料', '跨学科'], level: 4, importance: 1.15, strict: ['solid-state-chemistry', 'physical-chemistry'], recommended: ['condensed-matter'],
  },
  {
    id: 'polymer-chemistry', title: '高分子化学', englishTitle: 'Polymer Chemistry',
    summary: '研究聚合反应、分子量分布、链结构和聚合物的物理化学性质。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics', 'biology'], tags: ['材料', '分子'], level: 3, strict: ['organic-chemistry', 'molecular-structure-intermolecular-forces'], recommended: ['chemical-kinetics'],
  },
  {
    id: 'nanochemistry', title: '纳米化学', englishTitle: 'Nanochemistry',
    summary: '研究纳米尺度物质的合成、表面、尺寸效应、自组装和功能。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['材料', '尺度'], level: 4, strict: ['materials-chemistry', 'supramolecular-chemistry'], recommended: ['quantum-mechanics'],
  },
  {
    id: 'nuclear-radiochemistry', title: '核化学与放射化学', englishTitle: 'Nuclear & Radiochemistry',
    summary: '研究核素、放射性衰变、核反应和放射性物质的化学行为。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['微观', '能量'], level: 3, strict: ['atomic-structure'], recommended: ['quantum-mechanics'],
  },
  {
    id: 'analytical-chemistry', title: '分析化学', englishTitle: 'Analytical Chemistry',
    summary: '通过采样、分离、标定和仪器测量识别并定量物质组成。',
    primaryDomain: 'chemistry', tags: ['测量', '数据'], level: 2, strict: ['stoichiometry'], recommended: ['statistics'],
  },
  {
    id: 'separation-science', title: '分离科学', englishTitle: 'Separation Science',
    summary: '利用物质在不同相中的分配和迁移差异实现复杂样品的分离。',
    primaryDomain: 'chemistry', tags: ['测量', '分离'], level: 3, strict: ['analytical-chemistry', 'molecular-structure-intermolecular-forces'], recommended: ['chemical-equilibrium'],
  },
  {
    id: 'electroanalytical-chemistry', title: '电分析化学', englishTitle: 'Electroanalytical Chemistry',
    summary: '通过电势、电流、电荷和阻抗测量物质的组成、浓度与反应过程。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['测量', '数据'], level: 3, strict: ['analytical-chemistry', 'electrochemistry'],
  },
  {
    id: 'mass-spectrometry', title: '质谱学', englishTitle: 'Mass Spectrometry',
    summary: '通过离子质荷比和碎裂规律识别、定量并解析分子组成与结构。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'physics'], tags: ['测量', '数据'], level: 3, strict: ['analytical-chemistry', 'atomic-structure'], recommended: ['organic-chemistry'],
  },
  {
    id: 'chemometrics', title: '化学计量学', englishTitle: 'Chemometrics',
    summary: '用统计、实验设计和多变量模型从复杂化学测量中提取可靠信息。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'mathematics'], tags: ['数据', '计算方法'], level: 4, strict: ['analytical-chemistry', 'statistics'], recommended: ['linear-algebra'],
  },
  {
    id: 'biochemistry', title: '生物化学', englishTitle: 'Biochemistry',
    summary: '研究生命过程中的生物分子、能量转换与反应网络。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['分子', '生命'], level: 3, importance: 1.25, strict: ['organic-chemistry', 'chemical-kinetics'],
  },
  {
    id: 'enzymology', title: '酶学', englishTitle: 'Enzymology',
    summary: '研究酶的结构、催化机理、动力学、调控和工程化。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['生命', '反应'], level: 3, strict: ['biochemistry', 'chemical-kinetics'],
  },
  {
    id: 'chemical-biology', title: '化学生物学', englishTitle: 'Chemical Biology',
    summary: '使用合成分子、化学探针和反应工具观察并操控生命过程。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['生命', '跨学科'], level: 4, strict: ['biochemistry', 'organic-synthesis'],
  },
  {
    id: 'bioinorganic-chemistry', title: '生物无机化学', englishTitle: 'Bioinorganic Chemistry',
    summary: '研究金属离子与无机辅因子在生命体系中的结构、输运和催化功能。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['生命', '结构'], level: 4, strict: ['biochemistry', 'coordination-chemistry'],
  },
  {
    id: 'medicinal-chemistry', title: '药物化学', englishTitle: 'Medicinal Chemistry',
    summary: '通过结构—活性关系、分子设计和合成优化药物的效力、选择性与性质。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['生命', '设计'], level: 4, strict: ['organic-synthesis', 'biochemistry'], recommended: ['statistics', 'chemical-biology'],
  },
  {
    id: 'toxicology', title: '毒理学', englishTitle: 'Toxicology',
    summary: '研究化学物质的暴露、剂量、代谢以及对生物系统的不良作用。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['生命', '风险'], level: 3, strict: ['biochemistry', 'analytical-chemistry'], recommended: ['statistics'],
  },
  {
    id: 'environmental-chemistry', title: '环境化学', englishTitle: 'Environmental Chemistry',
    summary: '研究化学物质在大气、水体、土壤和生物圈中的来源、转化、迁移与归宿。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology', 'earth-environmental'], tags: ['环境', '系统'], level: 3, strict: ['analytical-chemistry', 'chemical-equilibrium'], recommended: ['chemical-kinetics', 'ecology'],
  },
  {
    id: 'green-sustainable-chemistry', title: '绿色与可持续化学', englishTitle: 'Green & Sustainable Chemistry',
    summary: '以危害、资源、能耗、废物和生命周期指标设计更安全且可持续的化学过程。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'biology'], tags: ['可持续', '设计'], level: 4, importance: 1.1, strict: ['organic-synthesis', 'thermochemistry', 'environmental-chemistry'], recommended: ['catalysis', 'toxicology'],
  },
  {
    id: 'computational-chemistry', title: '计算化学', englishTitle: 'Computational Chemistry',
    summary: '用电子结构计算、分子模拟和数值模型预测化学体系的结构、性质和反应。',
    primaryDomain: 'chemistry', domains: ['chemistry', 'mathematics', 'physics', 'computer-science'], tags: ['计算方法', '建模'], level: 4, strict: ['quantum-chemistry', 'physical-chemistry'], recommended: ['linear-algebra', 'optimization', 'statistics'],
  },
] as const)

export const chemistryNodes = chemistryCatalog.nodes
export const chemistryEdges = chemistryCatalog.edges
