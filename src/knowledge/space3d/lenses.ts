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
  ...overrides,
})

export const knowledgeLenses: readonly KnowledgeLensDefinition[] = [
  {
    id: 'world',
    label: '公共全景',
    description: '稳定展示四个领域及其共同边界，作为所有视角的公共参照。',
    focusDomains: ['mathematics', 'physics', 'chemistry', 'biology'],
    domainWeights: domainWeights({ mathematics: 1, physics: 1, chemistry: 1, biology: 1 }),
    relationWeights: relationWeights({ prerequisite: 0.92, application: 0.72, analogy: 0.6, historical: 0.48, 'shared-model': 0.9 }),
    cameraPosition: [25, 19, 30],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'mathematics',
    label: '数学视角',
    description: '突出形式结构、定量方法和作为其他科学语言的数学桥梁。',
    focusDomains: ['mathematics'],
    domainWeights: domainWeights({ mathematics: 1, physics: 0.36, chemistry: 0.23, biology: 0.28 }),
    relationWeights: relationWeights({ prerequisite: 1, application: 0.76, analogy: 0.66, historical: 0.38, 'shared-model': 0.92 }),
    cameraPosition: [24, 24, 24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'physics',
    label: '物理视角',
    description: '突出尺度、守恒、场和动力学，保留数学与物质科学的上下文。',
    focusDomains: ['physics'],
    domainWeights: domainWeights({ physics: 1, mathematics: 0.43, chemistry: 0.4, biology: 0.25 }),
    relationWeights: relationWeights({ prerequisite: 0.88, application: 0.94, analogy: 0.58, historical: 0.42, 'shared-model': 1 }),
    cameraPosition: [24, -24, -24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'chemistry',
    label: '化学视角',
    description: '突出结构、反应、能量与分析方法，呈现从原子到生命分子的连续层次。',
    focusDomains: ['chemistry'],
    domainWeights: domainWeights({ chemistry: 1, physics: 0.4, biology: 0.42, mathematics: 0.24 }),
    relationWeights: relationWeights({ prerequisite: 0.9, application: 0.88, analogy: 0.48, historical: 0.4, 'shared-model': 1 }),
    cameraPosition: [-24, 24, -24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'biology',
    label: '生物视角',
    description: '突出信息、网络、演化和多尺度生命系统，保留化学与定量方法的来源。',
    focusDomains: ['biology'],
    domainWeights: domainWeights({ biology: 1, chemistry: 0.43, mathematics: 0.36, physics: 0.27 }),
    relationWeights: relationWeights({ prerequisite: 0.88, application: 0.9, analogy: 0.56, historical: 0.42, 'shared-model': 1 }),
    cameraPosition: [-24, -24, 24],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'bridges',
    label: '跨域桥梁',
    description: '把多领域共享的模型、测量方法和应用关系带到空间中心。',
    focusDomains: ['mathematics', 'physics', 'chemistry', 'biology'],
    domainWeights: domainWeights({ mathematics: 0.82, physics: 0.82, chemistry: 0.82, biology: 0.82 }),
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
