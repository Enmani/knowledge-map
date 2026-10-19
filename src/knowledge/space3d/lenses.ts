import type {
  KnowledgeLensDefinition,
  KnowledgeLensId,
  KnowledgeRelationType,
  ScienceDomainId,
} from './types'

const relationWeights = (
  overrides: Partial<Record<KnowledgeRelationType, number>> = {},
): Readonly<Record<KnowledgeRelationType, number>> => ({
  prerequisite: 1,
  application: 0.72,
  analogy: 0.58,
  historical: 0.48,
  'shared-model': 0.82,
  ...overrides,
})

const domainWeights = (
  overrides: Partial<Record<ScienceDomainId, number>> = {},
): Readonly<Record<ScienceDomainId, number>> => ({
  mathematics: 0.64,
  physics: 0.64,
  chemistry: 0.64,
  biology: 0.64,
  neuroscience: 0.64,
  'cognitive-science': 0.64,
  'computer-science': 0.64,
  'earth-environmental': 0.64,
  ...overrides,
})

export const knowledgeLenses: readonly KnowledgeLensDefinition[] = [
  {
    id: 'world',
    label: '公共全景',
    description: '稳定展示八个领域及其关系驱动边界，作为所有视角的公共参照。',
    focusDomains: ['mathematics', 'physics', 'chemistry', 'biology', 'neuroscience', 'cognitive-science', 'computer-science', 'earth-environmental'],
    domainWeights: domainWeights({ mathematics: 1, physics: 1, chemistry: 1, biology: 1, neuroscience: 1, 'cognitive-science': 1, 'computer-science': 1, 'earth-environmental': 1 }),
    relationWeights: relationWeights({ prerequisite: 0.92, application: 0.72, analogy: 0.6, historical: 0.48, 'shared-model': 0.9 }),
    cameraPosition: [25, 19, 30],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'mathematics',
    label: '数学视角',
    description: '突出形式结构、定量方法和作为其他科学语言的数学桥梁。',
    focusDomains: ['mathematics'],
    domainWeights: domainWeights({ mathematics: 1, physics: 0.36, chemistry: 0.23, biology: 0.28, neuroscience: 0.34, 'cognitive-science': 0.46, 'computer-science': 0.48, 'earth-environmental': 0.2 }),
    relationWeights: relationWeights({ prerequisite: 1, application: 0.76, analogy: 0.66, historical: 0.38, 'shared-model': 0.92 }),
    cameraPosition: [24, 24, 24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'physics',
    label: '物理视角',
    description: '突出尺度、守恒、场和动力学，保留数学与物质科学的上下文。',
    focusDomains: ['physics'],
    domainWeights: domainWeights({ physics: 1, mathematics: 0.43, chemistry: 0.4, biology: 0.25, neuroscience: 0.36, 'cognitive-science': 0.22, 'computer-science': 0.38, 'earth-environmental': 0.52 }),
    relationWeights: relationWeights({ prerequisite: 0.88, application: 0.94, analogy: 0.58, historical: 0.42, 'shared-model': 1 }),
    cameraPosition: [24, -24, -24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'chemistry',
    label: '化学视角',
    description: '突出结构、反应、能量与分析方法，呈现从原子到生命分子的连续层次。',
    focusDomains: ['chemistry'],
    domainWeights: domainWeights({ chemistry: 1, physics: 0.4, biology: 0.42, neuroscience: 0.34, 'cognitive-science': 0.16, mathematics: 0.24, 'computer-science': 0.2, 'earth-environmental': 0.56 }),
    relationWeights: relationWeights({ prerequisite: 0.9, application: 0.88, analogy: 0.48, historical: 0.4, 'shared-model': 1 }),
    cameraPosition: [-24, 24, -24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'biology',
    label: '生物视角',
    description: '突出信息、网络、演化和多尺度生命系统，保留化学与定量方法的来源。',
    focusDomains: ['biology'],
    domainWeights: domainWeights({ biology: 1, chemistry: 0.43, mathematics: 0.36, physics: 0.27, neuroscience: 0.66, 'cognitive-science': 0.38, 'computer-science': 0.38, 'earth-environmental': 0.58 }),
    relationWeights: relationWeights({ prerequisite: 0.88, application: 0.9, analogy: 0.56, historical: 0.42, 'shared-model': 1 }),
    cameraPosition: [-24, -24, 24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'neuroscience',
    label: '神经科学视角',
    description: '突出从细胞信号、回路与系统到行为和认知的非临床脑科学联系。',
    focusDomains: ['neuroscience'],
    domainWeights: domainWeights({ neuroscience: 1, 'cognitive-science': 0.74, biology: 0.68, mathematics: 0.44, physics: 0.4, chemistry: 0.34, 'computer-science': 0.46, 'earth-environmental': 0.18 }),
    relationWeights: relationWeights({ prerequisite: 0.9, application: 0.9, analogy: 0.58, historical: 0.38, 'shared-model': 1 }),
    cameraPosition: [-26, -20, 28],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'cognitive-science',
    label: '认知科学视角',
    description: '突出心智、表征、学习、语言和决策，并连接脑、计算与形式模型。',
    focusDomains: ['cognitive-science'],
    domainWeights: domainWeights({ 'cognitive-science': 1, neuroscience: 0.74, 'computer-science': 0.6, mathematics: 0.48, biology: 0.38, physics: 0.24, chemistry: 0.16, 'earth-environmental': 0.18 }),
    relationWeights: relationWeights({ prerequisite: 0.82, application: 0.86, analogy: 0.82, historical: 0.46, 'shared-model': 1 }),
    cameraPosition: [28, -19, 25],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'computer-science',
    label: '计算视角',
    description: '突出算法、软件、系统、数据与智能，并保留数学和工程科学的共同基础。',
    focusDomains: ['computer-science'],
    domainWeights: domainWeights({ 'computer-science': 1, mathematics: 0.58, physics: 0.3, chemistry: 0.16, biology: 0.32, neuroscience: 0.34, 'cognitive-science': 0.62, 'earth-environmental': 0.28 }),
    relationWeights: relationWeights({ prerequisite: 0.96, application: 0.9, analogy: 0.62, historical: 0.38, 'shared-model': 1 }),
    cameraPosition: [28, 24, 24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'earth-environmental',
    label: '地球环境视角',
    description: '突出固体地球、大气、海洋、气候与环境系统，保留物理、化学和生命过程的来源。',
    focusDomains: ['earth-environmental'],
    domainWeights: domainWeights({ 'earth-environmental': 1, physics: 0.5, chemistry: 0.52, biology: 0.55, mathematics: 0.3, neuroscience: 0.18, 'cognitive-science': 0.2, 'computer-science': 0.34 }),
    relationWeights: relationWeights({ prerequisite: 0.88, application: 0.94, analogy: 0.54, historical: 0.4, 'shared-model': 1 }),
    cameraPosition: [-28, 22, 26],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'bridges',
    label: '跨域桥梁',
    description: '把多领域共享的模型、测量方法和应用关系带到空间中心。',
    focusDomains: ['mathematics', 'physics', 'chemistry', 'biology', 'neuroscience', 'cognitive-science', 'computer-science', 'earth-environmental'],
    domainWeights: domainWeights({ mathematics: 0.82, physics: 0.82, chemistry: 0.82, biology: 0.82, neuroscience: 0.82, 'cognitive-science': 0.82, 'computer-science': 0.82, 'earth-environmental': 0.82 }),
    relationWeights: relationWeights({ prerequisite: 0.44, application: 0.95, analogy: 0.8, historical: 0.3, 'shared-model': 1 }),
    cameraPosition: [27, 20, 27],
    cameraTarget: [0, 0, 0],
  },
] as const

const lensById = new Map<KnowledgeLensId, KnowledgeLensDefinition>(
  knowledgeLenses.map((lens) => [lens.id, lens]),
)

export const getKnowledgeLens = (id: KnowledgeLensId): KnowledgeLensDefinition => {
  const lens = lensById.get(id)
  if (!lens) throw new Error(`Unknown knowledge lens: ${id}`)
  return lens
}
