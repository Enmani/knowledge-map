import { buildCatalog } from './helpers'

const biologyCatalog = buildCatalog([
  {
    id: 'cell-biology', title: '细胞生物学', englishTitle: 'Cell Biology',
    summary: '研究细胞结构、运输、信号、分裂和稳态。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['细胞', '系统'], level: 1, importance: 1.25, strict: ['biochemistry'],
  },
  {
    id: 'genetics', title: '遗传学', englishTitle: 'Genetics',
    summary: '研究性状如何遗传、变异并在个体与群体中传播。',
    primaryDomain: 'biology', tags: ['信息', '不确定性'], level: 1, importance: 1.2, recommended: ['cell-biology'],
  },
  {
    id: 'molecular-biology', title: '分子生物学', englishTitle: 'Molecular Biology',
    summary: '研究 DNA、RNA 与蛋白质之间的信息流和调控。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['分子', '信息'], level: 2, importance: 1.25, strict: ['cell-biology', 'genetics'],
  },
  {
    id: 'structural-biology', title: '结构生物学', englishTitle: 'Structural Biology',
    summary: '研究生物大分子及其复合体的三维结构与结构—功能关系。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry', 'physics'], tags: ['分子', '结构', '成像'], level: 2, importance: 1.15, strict: ['biochemistry', 'molecular-biology'],
  },
  {
    id: 'molecular-biophysics', title: '分子生物物理学', englishTitle: 'Molecular Biophysics',
    summary: '用热统计、力学和光学方法研究生物大分子的结构、动力学与功能。',
    primaryDomain: 'biology', domains: ['biology', 'physics', 'chemistry'], tags: ['跨学科', '建模', '分子'], level: 3, strict: ['structural-biology', 'biochemistry'], recommended: ['biophysics'],
  },
  {
    id: 'biological-membranes-transport', title: '生物膜与运输', englishTitle: 'Biological Membranes & Transport',
    summary: '研究膜结构、通道、载体和跨膜运输如何维持细胞边界与梯度。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['细胞', '结构', '物质运输'], level: 2, strict: ['cell-biology'],
  },
  {
    id: 'cell-signaling', title: '细胞信号转导', englishTitle: 'Cell Signaling',
    summary: '研究细胞如何接收、传递、整合并响应内外信号。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['细胞', '信息', '网络'], level: 2, importance: 1.15, strict: ['cell-biology', 'molecular-biology'],
  },
  {
    id: 'cellular-metabolism', title: '细胞代谢与生物能量', englishTitle: 'Cellular Metabolism & Bioenergetics',
    summary: '研究代谢网络如何转化物质、储存能量并维持细胞活动。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry', 'physics'], tags: ['能量', '反应', '细胞'], level: 2, strict: ['biochemistry', 'cell-biology'],
  },
  {
    id: 'cell-cycle-cell-death', title: '细胞周期与细胞死亡', englishTitle: 'Cell Cycle & Cell Death',
    summary: '研究细胞增殖、检查点、衰老及程序性死亡的调控。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['细胞', '调控', '稳态'], level: 2, strict: ['cell-biology', 'genetics'],
  },
  {
    id: 'genomics', title: '基因组学', englishTitle: 'Genomics',
    summary: '在全基因组尺度研究序列、结构、功能和变异。',
    primaryDomain: 'biology', tags: ['信息', '数据', '演化'], level: 3, importance: 1.2, strict: ['genetics', 'molecular-biology'],
  },
  {
    id: 'epigenetics', title: '表观遗传学', englishTitle: 'Epigenetics',
    summary: '研究不改变 DNA 序列的可遗传调控及染色质状态。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['信息', '调控', '发育'], level: 3, strict: ['genetics', 'molecular-biology'],
  },
  {
    id: 'proteomics', title: '蛋白质组学', englishTitle: 'Proteomics',
    summary: '在系统尺度鉴定蛋白质丰度、修饰、结构与相互作用。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['分子', '数据', '结构'], level: 3, strict: ['molecular-biology', 'biochemistry'],
  },
  {
    id: 'physiology', title: '生理学', englishTitle: 'Physiology',
    summary: '研究器官和机体维持生命活动、内环境和稳态的功能机制。',
    primaryDomain: 'biology', tags: ['生命', '系统'], level: 2, strict: ['cell-biology'],
  },
  {
    id: 'neuroscience', title: '神经科学', englishTitle: 'Neuroscience',
    summary: '研究神经系统如何感知、控制、学习和产生行为。',
    primaryDomain: 'biology', tags: ['信息', '网络'], level: 3, strict: ['physiology'],
  },
  {
    id: 'developmental-biology', title: '发育生物学', englishTitle: 'Developmental Biology',
    summary: '研究细胞如何分化、建立空间模式并形成有组织的个体。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['发育', '细胞'], level: 3, strict: ['molecular-biology'],
  },
  {
    id: 'stem-cell-biology', title: '干细胞生物学', englishTitle: 'Stem Cell Biology',
    summary: '研究干细胞自我更新、谱系分化与组织更新机制。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['细胞', '发育', '再生'], level: 3, strict: ['cell-biology', 'developmental-biology'],
  },
  {
    id: 'anatomy-functional-morphology', title: '解剖学与功能形态', englishTitle: 'Anatomy & Functional Morphology',
    summary: '比较组织、器官和整体形态如何支持生物功能。',
    primaryDomain: 'biology', tags: ['结构', '生命', '功能'], level: 1, strict: ['cell-biology'],
  },
  {
    id: 'behavioral-biology', title: '行为生物学', englishTitle: 'Behavioral Biology',
    summary: '研究行为的神经、生理、发育、生态与进化基础。',
    primaryDomain: 'biology', tags: ['行为', '信息', '适应'], level: 3, strict: ['neuroscience', 'evolution'],
  },
  {
    id: 'reproductive-biology', title: '生殖生物学', englishTitle: 'Reproductive Biology',
    summary: '研究配子发生、受精、繁殖策略和生殖调控。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['生命', '发育', '遗传'], level: 3, strict: ['physiology', 'genetics'],
  },
  {
    id: 'endocrinology', title: '内分泌学', englishTitle: 'Endocrinology',
    summary: '研究激素信号如何协调生长、代谢、应激和稳态。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['稳态', '信号', '系统'], level: 3, strict: ['physiology', 'cell-signaling'],
  },
  {
    id: 'regenerative-biology', title: '再生生物学', englishTitle: 'Regenerative Biology',
    summary: '研究组织修复、再生、重编程及其发育基础。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['再生', '发育', '细胞'], level: 4, strict: ['developmental-biology', 'stem-cell-biology'],
  },
  {
    id: 'microbiology', title: '微生物学', englishTitle: 'Microbiology',
    summary: '研究微生物的结构、代谢、遗传与生态作用。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['细胞', '生态'], level: 2, strict: ['cell-biology'],
  },
  {
    id: 'virology', title: '病毒学', englishTitle: 'Virology',
    summary: '研究病毒的结构、复制、传播、宿主互作与演化。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['信息', '病原体', '演化'], level: 2, strict: ['molecular-biology', 'genetics'], recommended: ['microbiology'],
  },
  {
    id: 'mycology', title: '真菌学', englishTitle: 'Mycology',
    summary: '研究真菌的细胞结构、生活史、代谢和生态作用。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['细胞', '多样性', '生态'], level: 2, strict: ['cell-biology', 'microbiology'], recommended: ['evolution'],
  },
  {
    id: 'plant-biology', title: '植物生物学', englishTitle: 'Plant Biology',
    summary: '研究植物的结构、生理、繁殖、发育及环境响应。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['生命', '多样性', '能量'], level: 2, strict: ['cell-biology'], recommended: ['evolution'],
  },
  {
    id: 'animal-biology', title: '动物生物学', englishTitle: 'Animal Biology',
    summary: '研究动物的多样性、结构、功能、发育与适应。',
    primaryDomain: 'biology', tags: ['生命', '多样性', '行为'], level: 2, strict: ['cell-biology'], recommended: ['evolution'],
  },
  {
    id: 'evolution', title: '进化论', englishTitle: 'Evolution',
    summary: '解释遗传变异、自然选择、漂变和生命多样性的形成。',
    primaryDomain: 'biology', tags: ['演化', '复杂性'], level: 2, importance: 1.3, strict: ['genetics'],
  },
  {
    id: 'population-genetics', title: '群体遗传学', englishTitle: 'Population Genetics',
    summary: '用概率模型研究等位基因频率受选择、漂变、迁移和突变的影响。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics'], tags: ['遗传', '不确定性', '演化'], level: 3, importance: 1.1, strict: ['genetics', 'probability'],
  },
  {
    id: 'phylogenetics-systematics', title: '系统发育与分类学', englishTitle: 'Phylogenetics & Systematics',
    summary: '基于性状和分子数据重建亲缘关系并组织生物分类。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics'], tags: ['演化', '多样性', '数据'], level: 3, importance: 1.15, strict: ['evolution', 'genetics'],
  },
  {
    id: 'molecular-evolution', title: '分子进化', englishTitle: 'Molecular Evolution',
    summary: '研究序列和分子功能随突变、选择与漂变发生的变化。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['分子', '信息', '演化'], level: 4, strict: ['evolution', 'molecular-biology'],
  },
  {
    id: 'ecology', title: '生态学', englishTitle: 'Ecology',
    summary: '研究生物与环境在种群、群落和生态系统中的关系。',
    primaryDomain: 'biology', domains: ['biology', 'earth-environmental'], tags: ['网络', '系统'], level: 2, importance: 1.1, recommended: ['evolution'],
  },
  {
    id: 'population-ecology', title: '种群生态学', englishTitle: 'Population Ecology',
    summary: '研究种群数量、结构、增长、扩散及环境限制。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics'], tags: ['生态', '动力系统', '不确定性'], level: 3, strict: ['ecology', 'probability'], recommended: ['biostatistics'],
  },
  {
    id: 'community-ecology', title: '群落生态学', englishTitle: 'Community Ecology',
    summary: '研究物种互作、群落组装、多样性和稳定性。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics'], tags: ['生态', '网络', '多样性'], level: 3, strict: ['population-ecology'],
  },
  {
    id: 'ecosystem-ecology', title: '生态系统生态学', englishTitle: 'Ecosystem Ecology',
    summary: '研究能量流、物质循环及生物与非生物环境的耦合。',
    primaryDomain: 'biology', domains: ['biology', 'physics', 'chemistry', 'earth-environmental'], tags: ['生态', '能量', '系统'], level: 3, importance: 1.1, strict: ['ecology', 'energy'],
  },
  {
    id: 'biogeography', title: '生物地理学', englishTitle: 'Biogeography',
    summary: '研究物种和谱系在空间与地质时间中的分布规律。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics'], tags: ['生态', '演化', '空间'], level: 3, strict: ['ecology', 'evolution'],
  },
  {
    id: 'biodiversity-conservation', title: '生物多样性与保护', englishTitle: 'Biodiversity & Conservation',
    summary: '研究生物多样性的形成、评估、丧失与保护策略。',
    primaryDomain: 'biology', tags: ['多样性', '生态', '应用'], level: 4, strict: ['ecology', 'phylogenetics-systematics'],
  },
  {
    id: 'immunology', title: '免疫学', englishTitle: 'Immunology',
    summary: '研究机体识别、记忆和防御病原体的细胞与分子网络。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['网络', '信息'], level: 3, strict: ['cell-biology'],
  },
  {
    id: 'host-pathogen-interactions', title: '宿主—病原体互作', englishTitle: 'Host–Pathogen Interactions',
    summary: '研究宿主防御与病原体侵染、免疫逃逸和共同演化。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['病原体', '免疫', '演化'], level: 3, strict: ['microbiology', 'immunology'], recommended: ['virology'],
  },
  {
    id: 'epidemiology', title: '流行病学', englishTitle: 'Epidemiology',
    summary: '研究健康事件在人群中的分布、决定因素和传播规律。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics'], tags: ['疾病', '数据', '不确定性'], level: 3, importance: 1.1, strict: ['host-pathogen-interactions', 'statistics'],
  },
  {
    id: 'cancer-biology', title: '癌症生物学', englishTitle: 'Cancer Biology',
    summary: '研究癌细胞的遗传、表观遗传、微环境与克隆演化机制。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['疾病', '细胞', '演化'], level: 4, importance: 1.1, strict: ['cell-cycle-cell-death', 'genomics'],
  },
  {
    id: 'bioinformatics', title: '生物信息学', englishTitle: 'Bioinformatics',
    summary: '用算法、统计和数据库管理并分析生命信息。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics', 'computer-science'], tags: ['数据', '计算方法'], level: 3, importance: 1.15, strict: ['molecular-biology'], recommended: ['statistics'],
  },
  {
    id: 'systems-biology', title: '系统生物学', englishTitle: 'Systems Biology',
    summary: '用网络和动力模型研究生命系统的整体行为。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics', 'physics'], tags: ['网络', '动力系统'], level: 4, importance: 1.2, strict: ['bioinformatics'], recommended: ['dynamical-systems'],
  },
  {
    id: 'computational-biology', title: '计算生物学', englishTitle: 'Computational Biology',
    summary: '用算法、模拟和统计模型解释生物系统及多尺度数据。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics', 'computer-science'], tags: ['数据', '计算方法', '建模'], level: 4, importance: 1.15, strict: ['bioinformatics', 'statistics'],
  },
  {
    id: 'biostatistics', title: '生物统计学', englishTitle: 'Biostatistics',
    summary: '为生物和健康数据设计实验、估计效应并量化不确定性。',
    primaryDomain: 'biology', domains: ['biology', 'mathematics'], tags: ['数据', '不确定性', '推断'], level: 3, strict: ['probability', 'statistics'],
  },
  {
    id: 'synthetic-biology', title: '合成生物学', englishTitle: 'Synthetic Biology',
    summary: '通过标准化元件、回路和系统设计构建或重编程生命功能。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['工程', '系统', '分子'], level: 4, importance: 1.2, strict: ['molecular-biology', 'systems-biology'], recommended: ['control-theory'],
  },
  {
    id: 'biotechnology', title: '生物技术', englishTitle: 'Biotechnology',
    summary: '利用细胞、分子和生物过程开发产品、诊断与生产技术。',
    primaryDomain: 'biology', domains: ['biology', 'chemistry'], tags: ['工程', '应用', '生命'], level: 3, importance: 1.15, strict: ['molecular-biology', 'microbiology'], recommended: ['synthetic-biology'],
  },
] as const)

export const biologyNodes = biologyCatalog.nodes
export const biologyEdges = biologyCatalog.edges
