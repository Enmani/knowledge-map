import { buildCatalog, defineEdge } from './helpers'

const cognitiveScienceCatalog = buildCatalog([
  {
    id: 'cognitive-science', title: '认知科学', englishTitle: 'Cognitive Science',
    summary: '综合实验、计算与哲学分析，研究心智如何感知、表征、学习、推理并指导行动。',
    primaryDomain: 'cognitive-science',
    domains: ['cognitive-science', 'neuroscience', 'computer-science', 'biology'],
    tags: ['心智', '信息', '跨学科'], level: 1, importance: 1.3,
    recommended: ['statistics', 'neuroscience', 'artificial-intelligence'],
  },
  {
    id: 'mind-representation-theories', title: '心智、表征与认知理论', englishTitle: 'Mind, Representation & Cognitive Theory',
    summary: '研究心智状态怎样表征世界，并比较符号、联结、预测、动力与生态等认知解释框架。',
    primaryDomain: 'cognitive-science',
    domains: ['cognitive-science', 'neuroscience', 'computer-science'],
    tags: ['心智', '表征', '理论'], level: 2, importance: 1.15,
    strict: ['cognitive-science'], recommended: ['mathematical-logic'],
  },
  {
    id: 'cognitive-research-methods', title: '认知研究方法', englishTitle: 'Cognitive Research Methods',
    summary: '用行为实验、心理物理、眼动、调查、过程测量与因果设计检验关于认知过程的假说。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience', 'mathematics'],
    tags: ['实验方法', '测量', '推断'], level: 1, importance: 1.2,
    strict: ['cognitive-science'], recommended: ['statistics', 'probability'],
  },
  {
    id: 'computational-cognitive-modeling', title: '计算认知建模', englishTitle: 'Computational Cognitive Modeling',
    summary: '用符号模型、概率模型、神经网络、动力系统与过程模型形式化认知机制并预测行为。',
    primaryDomain: 'cognitive-science',
    domains: ['cognitive-science', 'computer-science', 'mathematics', 'neuroscience'],
    tags: ['计算方法', '建模', '智能'], level: 3, importance: 1.2,
    strict: ['cognitive-research-methods'],
    recommended: ['probability', 'statistics', 'machine-learning', 'dynamical-systems'],
  },
  {
    id: 'sensation-perception', title: '感觉与知觉', englishTitle: 'Sensation & Perception',
    summary: '研究感觉信号如何被编码、组织和解释，从而形成对物体、空间、声音与身体的知觉。',
    primaryDomain: 'cognitive-science',
    domains: ['cognitive-science', 'neuroscience', 'physics'],
    tags: ['感觉', '知觉', '表征'], level: 1, importance: 1.2,
    recommended: ['cognitive-research-methods', 'neuroscience'],
  },
  {
    id: 'attention', title: '注意', englishTitle: 'Attention',
    summary: '研究有限加工资源如何在空间、对象、特征与任务之间选择、维持和切换。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience'],
    tags: ['注意', '选择', '控制'], level: 2, importance: 1.15,
    recommended: ['sensation-perception', 'cognitive-research-methods'],
  },
  {
    id: 'learning-cognition', title: '学习', englishTitle: 'Learning',
    summary: '研究经验如何改变知识、技能、预期与行为，涵盖关联、统计、强化、观察和概念学习。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience'],
    tags: ['学习', '适应', '行为'], level: 2, importance: 1.2,
    recommended: ['attention', 'cognitive-research-methods'],
  },
  {
    id: 'memory', title: '记忆', englishTitle: 'Memory',
    summary: '研究信息如何编码、保持、重构与提取，以及工作、情景、语义和技能记忆怎样协同。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience'],
    tags: ['记忆', '学习', '表征'], level: 2, importance: 1.25,
    recommended: ['attention', 'learning-cognition'],
  },
  {
    id: 'language-cognition', title: '语言与认知', englishTitle: 'Language & Cognition',
    summary: '研究语音、词汇、句法、语义、语用与读写过程如何支持理解、表达和思维。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience'],
    tags: ['语言', '符号', '理解'], level: 2, importance: 1.2,
    recommended: ['memory', 'sensation-perception'],
  },
  {
    id: 'concepts-semantic-knowledge', title: '概念与语义知识', englishTitle: 'Concepts & Semantic Knowledge',
    summary: '研究范畴、概念、特征和关系知识怎样形成、组织、泛化并参与语言与推理。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience', 'computer-science'],
    tags: ['概念', '语义', '知识'], level: 2, importance: 1.1,
    recommended: ['memory', 'language-cognition'],
  },
  {
    id: 'reasoning-problem-solving', title: '推理与问题求解', englishTitle: 'Reasoning & Problem Solving',
    summary: '研究演绎、归纳、类比、因果推理和搜索策略如何形成结论并解决结构化或开放问题。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'computer-science', 'mathematics'],
    tags: ['推理', '问题求解', '知识'], level: 2, importance: 1.15,
    recommended: ['concepts-semantic-knowledge', 'mathematical-logic'],
  },
  {
    id: 'judgment-decision-making', title: '判断与决策', englishTitle: 'Judgment & Decision Making',
    summary: '研究人在不确定、风险、多目标与社会情境中怎样估计、选择、学习并修正偏差。',
    primaryDomain: 'cognitive-science',
    domains: ['cognitive-science', 'neuroscience', 'mathematics'],
    tags: ['决策', '不确定性', '价值'], level: 2, importance: 1.15,
    recommended: ['reasoning-problem-solving', 'probability', 'game-theory'],
  },
  {
    id: 'cognitive-control', title: '认知控制', englishTitle: 'Cognitive Control',
    summary: '研究目标如何组织任务规则、工作记忆、抑制、监控、切换与行动选择。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience'],
    tags: ['控制', '目标', '执行功能'], level: 3, importance: 1.15,
    recommended: ['attention', 'memory', 'judgment-decision-making'],
  },
  {
    id: 'metacognition', title: '元认知', englishTitle: 'Metacognition',
    summary: '研究个体如何监测和调节自己的知觉、记忆、学习、判断与信心水平。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience'],
    tags: ['自我监测', '学习', '控制'], level: 3,
    recommended: ['memory', 'cognitive-control', 'judgment-decision-making'],
  },
  {
    id: 'cognitive-development', title: '认知发展', englishTitle: 'Cognitive Development',
    summary: '研究知觉、语言、记忆、概念、推理与社会理解怎样在个体发展中形成和重组。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience', 'biology'],
    tags: ['发展', '学习', '变化'], level: 2, importance: 1.1,
    recommended: ['learning-cognition', 'memory', 'language-cognition'],
  },
  {
    id: 'social-cultural-cognition', title: '社会与文化认知', englishTitle: 'Social & Cultural Cognition',
    summary: '研究他人理解、社会学习、合作、规范、语言与文化环境如何塑造认知。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience', 'biology'],
    tags: ['社会', '文化', '行为'], level: 2, importance: 1.1,
    recommended: ['language-cognition', 'judgment-decision-making', 'behavioral-biology'],
  },
  {
    id: 'embodied-situated-cognition', title: '具身与情境认知', englishTitle: 'Embodied & Situated Cognition',
    summary: '研究身体、行动、工具、环境与社会互动怎样共同构成知觉、概念和问题求解过程。',
    primaryDomain: 'cognitive-science',
    domains: ['cognitive-science', 'neuroscience', 'biology', 'computer-science'],
    tags: ['身体', '行动', '环境'], level: 2, importance: 1.1,
    recommended: ['sensation-perception', 'mind-representation-theories'],
  },
  {
    id: 'consciousness', title: '意识', englishTitle: 'Consciousness',
    summary: '研究清醒状态、主观体验、意识内容、自我意识与意识可报告性之间的关系及其理论解释。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience'],
    tags: ['意识', '体验', '心智'], level: 3, importance: 1.15,
    recommended: ['attention', 'sensation-perception', 'mind-representation-theories'],
  },
  {
    id: 'emotion-motivation', title: '情绪与动机', englishTitle: 'Emotion & Motivation',
    summary: '研究情绪评估、奖赏、需要、目标和调节过程如何赋予行动方向、强度与持续性。',
    primaryDomain: 'cognitive-science', domains: ['cognitive-science', 'neuroscience', 'biology'],
    tags: ['情绪', '动机', '价值'], level: 2, importance: 1.15,
    recommended: ['judgment-decision-making', 'behavioral-biology', 'neuroscience'],
  },
] as const)

const cognitiveScienceCrossEdges = [
  defineEdge({
    source: 'cognitive-science', target: 'neuroscience', type: 'shared-model', strength: 0.9,
    label: '心智过程与神经实现',
  }),
  defineEdge({
    source: 'computational-cognitive-modeling', target: 'machine-learning', type: 'shared-model', strength: 0.78,
    label: '学习与表征模型',
  }),
  defineEdge({
    source: 'language-cognition', target: 'natural-language-processing', type: 'analogy', strength: 0.68,
    label: '人类语言与计算语言模型',
  }),
  defineEdge({
    source: 'cognitive-science', target: 'human-computer-interaction', type: 'application', strength: 0.74,
    label: '认知规律用于交互设计',
  }),
  defineEdge({
    source: 'judgment-decision-making', target: 'game-theory', type: 'shared-model', strength: 0.7,
    label: '策略选择与价值权衡',
  }),
  defineEdge({
    source: 'sensation-perception', target: 'computer-vision', type: 'analogy', strength: 0.64,
    label: '生物知觉与机器视觉',
  }),
] as const

export const cognitiveScienceNodes = cognitiveScienceCatalog.nodes
export const cognitiveScienceEdges = [
  ...cognitiveScienceCatalog.edges,
  ...cognitiveScienceCrossEdges,
] as const
