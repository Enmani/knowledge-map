import { buildCatalog, defineEdge } from './helpers'

const neuroscienceCatalog = buildCatalog([
  {
    id: 'neuroscience', title: '神经科学', englishTitle: 'Neuroscience',
    summary: '从分子、细胞、回路到行为研究神经系统如何传递信息、调节机体并产生心智活动。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology'], tags: ['神经系统', '信息', '跨尺度'], level: 2, importance: 1.36,
    strict: ['physiology'], recommended: ['cell-biology', 'biochemistry'],
  },
  {
    id: 'cellular-molecular-neuroscience', title: '细胞与分子神经科学', englishTitle: 'Cellular & Molecular Neuroscience',
    summary: '研究神经元、胶质细胞及其分子组成怎样建立神经系统的基本功能。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology', 'chemistry'], tags: ['细胞', '分子', '神经元', '胶质细胞'], level: 2, importance: 1.22,
    strict: ['neuroscience'], recommended: ['cell-biology', 'molecular-biology', 'biochemistry'],
  },
  {
    id: 'neural-signaling-synapses', title: '神经信号与突触', englishTitle: 'Neural Signaling & Synapses',
    summary: '研究膜电位、动作电位、突触传递和神经调质如何编码并传递信息。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology', 'chemistry', 'physics'], tags: ['电信号', '突触', '信息编码', '分子'], level: 3, importance: 1.24,
    strict: ['cellular-molecular-neuroscience'], recommended: ['electromagnetism', 'electrochemistry'],
  },
  {
    id: 'neural-circuits', title: '神经回路', englishTitle: 'Neural Circuits',
    summary: '研究兴奋与抑制连接组成的局部回路如何变换输入、产生动力学并驱动输出。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology', 'mathematics'], tags: ['回路', '网络', '动力系统', '信息编码'], level: 3, importance: 1.24,
    strict: ['neural-signaling-synapses'], recommended: ['graph-theory', 'dynamical-systems'],
  },
  {
    id: 'developmental-neuroscience', title: '发育神经科学', englishTitle: 'Developmental Neuroscience',
    summary: '研究神经细胞的产生、迁移、连接选择和回路成熟如何形成神经系统。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology'], tags: ['发育', '细胞', '回路', '可塑性'], level: 3,
    strict: ['neuroscience'], recommended: ['developmental-biology', 'genetics', 'cellular-molecular-neuroscience'],
  },
  {
    id: 'neural-plasticity', title: '神经可塑性', englishTitle: 'Neural Plasticity',
    summary: '研究神经元和回路如何随活动、经验与发育改变连接强度和组织方式。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology'], tags: ['可塑性', '学习', '突触', '发育'], level: 3, importance: 1.2,
    strict: ['neural-signaling-synapses'], recommended: ['developmental-neuroscience', 'neural-circuits'],
  },
  {
    id: 'systems-neuroscience', title: '系统神经科学', englishTitle: 'Systems Neuroscience',
    summary: '研究多个脑区和回路怎样协同完成感觉、运动、调节与行为功能。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology'], tags: ['系统', '回路', '脑区', '行为'], level: 3, importance: 1.26,
    strict: ['neural-circuits'], recommended: ['physiology'],
  },
  {
    id: 'sensory-neuroscience', title: '感觉神经科学', englishTitle: 'Sensory Neuroscience',
    summary: '研究感觉受体与神经通路如何把光、声、化学和机械刺激转化为神经表征。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology', 'physics', 'cognitive-science'], tags: ['感觉', '信息编码', '表征', '系统'], level: 3, importance: 1.18,
    strict: ['systems-neuroscience'], recommended: ['optics', 'acoustics', 'sensation-perception'],
  },
  {
    id: 'motor-neuroscience', title: '运动神经科学', englishTitle: 'Motor Neuroscience',
    summary: '研究脊髓、脑干、皮层与小脑回路如何选择、规划、执行并校正动作。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology', 'cognitive-science'], tags: ['运动', '控制', '回路', '反馈'], level: 3, importance: 1.16,
    strict: ['systems-neuroscience'], recommended: ['control-theory', 'physiology'],
  },
  {
    id: 'interoception-autonomic-homeostasis', title: '内感受、自主调节与稳态', englishTitle: 'Interoception, Autonomic Regulation & Homeostasis',
    summary: '研究神经系统如何感知身体内部状态，并协调自主、内分泌和行为反应维持稳态。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology'], tags: ['内感受', '自主神经', '稳态', '调节'], level: 3,
    strict: ['systems-neuroscience'], recommended: ['physiology', 'endocrinology'],
  },
  {
    id: 'sleep-circadian-neuroscience', title: '睡眠与昼夜节律神经科学', englishTitle: 'Sleep & Circadian Neuroscience',
    summary: '研究睡眠—觉醒状态和昼夜节律的神经回路、体内时钟及其行为组织作用。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology', 'cognitive-science'], tags: ['睡眠', '昼夜节律', '状态', '稳态'], level: 3,
    strict: ['systems-neuroscience'], recommended: ['interoception-autonomic-homeostasis'],
  },
  {
    id: 'behavioral-neuroscience-neuroethology', title: '行为神经科学与神经行为学', englishTitle: 'Behavioral Neuroscience & Neuroethology',
    summary: '研究神经系统怎样在生态和进化背景中组织觅食、交流、导航与社会行为。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'biology', 'cognitive-science'], tags: ['行为', '适应', '进化', '生态'], level: 3, importance: 1.14,
    strict: ['neuroscience'], recommended: ['systems-neuroscience', 'behavioral-biology', 'evolution'],
  },
  {
    id: 'cognitive-neuroscience', title: '认知神经科学', englishTitle: 'Cognitive Neuroscience',
    summary: '研究知觉、注意、记忆、语言和控制等认知过程的神经表征与系统机制。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'cognitive-science'], tags: ['认知', '表征', '脑网络', '实验方法'], level: 4, importance: 1.26,
    strict: ['systems-neuroscience'], recommended: ['cognitive-science', 'neuroscience-research-methods'],
  },
  {
    id: 'affective-motivational-neuroscience', title: '情感与动机神经科学', englishTitle: 'Affective & Motivational Neuroscience',
    summary: '研究价值、奖赏、情绪和动机状态如何由脑—身体系统共同产生并调节行为。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'cognitive-science', 'biology'], tags: ['情感', '动机', '奖赏', '稳态'], level: 4, importance: 1.16,
    strict: ['systems-neuroscience'], recommended: ['emotion-motivation', 'interoception-autonomic-homeostasis'],
  },
  {
    id: 'social-neuroscience', title: '社会神经科学', englishTitle: 'Social Neuroscience',
    summary: '研究个体如何用神经与身体过程理解他者、互动合作并适应社会环境。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'cognitive-science', 'biology'], tags: ['社会认知', '互动', '行为', '多层次'], level: 4,
    strict: ['neuroscience'], recommended: ['cognitive-neuroscience', 'affective-motivational-neuroscience', 'behavioral-neuroscience-neuroethology'],
  },
  {
    id: 'computational-neuroscience', title: '计算神经科学', englishTitle: 'Computational Neuroscience',
    summary: '用数学模型和模拟解释神经元、回路与行为层面的编码、动力学和学习。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'mathematics', 'computer-science'], tags: ['计算模型', '动力系统', '信息编码', '学习'], level: 4, importance: 1.24,
    strict: ['neural-signaling-synapses'], recommended: ['neural-circuits', 'dynamical-systems', 'probability'],
  },
  {
    id: 'network-neuroscience', title: '网络神经科学', englishTitle: 'Network Neuroscience',
    summary: '用图、连接组和多尺度网络模型研究神经系统的整体组织与信息传播。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'mathematics', 'computer-science'], tags: ['网络', '连接组', '图论', '复杂系统'], level: 4, importance: 1.18,
    strict: ['neural-circuits'], recommended: ['computational-neuroscience', 'graph-theory'],
  },
  {
    id: 'neuroscience-research-methods', title: '神经科学研究方法', englishTitle: 'Neuroscience Research Methods',
    summary: '研究如何用行为实验、电生理、成像和因果干预观测与检验神经机制。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'physics', 'mathematics'], tags: ['实验方法', '成像', '电生理', '因果推断'], level: 3, importance: 1.2,
    strict: ['neuroscience'], recommended: ['experimental-methods', 'statistics', 'optics'],
  },
  {
    id: 'neural-data-science', title: '神经数据科学', englishTitle: 'Neural Data Science',
    summary: '研究神经数据的预处理、统计推断、解码、多模态整合与可复现分析。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'mathematics', 'computer-science'], tags: ['数据', '统计', '解码', '可复现性'], level: 4, importance: 1.16,
    strict: ['neuroscience-research-methods'], recommended: ['statistics', 'data-science', 'machine-learning'],
  },
  {
    id: 'neuroethics', title: '神经伦理', englishTitle: 'Neuroethics',
    summary: '研究神经科学实验、脑数据、干预技术和心智解释中的伦理、治理与社会责任。',
    primaryDomain: 'neuroscience', domains: ['neuroscience', 'cognitive-science'], tags: ['伦理', '脑数据', '研究治理', '社会影响'], level: 3, importance: 1.12,
    strict: ['neuroscience'], recommended: ['neuroscience-research-methods', 'cognitive-science', 'computing-ethics-society'],
  },
] as const)

const neuroscienceSemanticEdges = [
  defineEdge({ source: 'cell-signaling', target: 'neural-signaling-synapses', type: 'shared-model', strength: 0.82, label: '细胞信号与神经调质' }),
  defineEdge({ source: 'neural-circuits', target: 'computational-neuroscience', type: 'shared-model', strength: 0.9, label: '回路动力模型' }),
  defineEdge({ source: 'systems-neuroscience', target: 'network-neuroscience', type: 'shared-model', strength: 0.88, label: '多尺度系统组织' }),
  defineEdge({ source: 'cognitive-science', target: 'cognitive-neuroscience', type: 'shared-model', strength: 0.92, label: '认知过程与神经实现' }),
  defineEdge({ source: 'emotion-motivation', target: 'affective-motivational-neuroscience', type: 'shared-model', strength: 0.88, label: '情感与动机模型' }),
  defineEdge({ source: 'behavioral-biology', target: 'behavioral-neuroscience-neuroethology', type: 'shared-model', strength: 0.86, label: '行为的机制与适应' }),
  defineEdge({ source: 'dynamical-systems', target: 'computational-neuroscience', type: 'application', strength: 0.9, label: '神经动力学' }),
  defineEdge({ source: 'graph-theory', target: 'network-neuroscience', type: 'application', strength: 0.9, label: '脑网络拓扑' }),
  defineEdge({ source: 'neuroscience-research-methods', target: 'sensory-neuroscience', type: 'application', strength: 0.74, label: '感觉通路测量' }),
  defineEdge({ source: 'neural-data-science', target: 'network-neuroscience', type: 'application', strength: 0.8, label: '连接组分析' }),
  defineEdge({ source: 'computing-ethics-society', target: 'neuroethics', type: 'analogy', strength: 0.62, label: '数据与技术治理' }),
] as const

export const neuroscienceNodes = neuroscienceCatalog.nodes
export const neuroscienceEdges = [...neuroscienceCatalog.edges, ...neuroscienceSemanticEdges] as const
