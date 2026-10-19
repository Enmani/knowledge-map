import {
  getMapScene,
} from '../map'
import {
  linearAlgebraSupplementalRelations,
} from '../map/linearAlgebraSceneContent'
import {
  createThreeKnowledgeSubspace,
  type ThreeSubspaceRelationKind,
} from './createThreeKnowledgeSubspace'

const scene = getMapScene('linear-algebra')

if (!scene) throw new Error('三维线性代数子域缺少二维线性代数场景。')

const namespacePrefix = `${scene.id}:`
const toLocalId = (nodeId: string) => {
  if (!nodeId.startsWith(namespacePrefix)) {
    throw new Error(`线性代数子节点 ${nodeId} 缺少 ${namespacePrefix} 命名空间。`)
  }
  return nodeId.slice(namespacePrefix.length)
}

const sourceNodes = scene.nodes.map((sourceNode) => {
  const position = scene.layout.positions[sourceNode.id]
  const centerX = position.x + scene.nodeWidth / 2
  const centerY = position.y + scene.nodeHeight / 2
  const u = centerX / scene.worldWidth - 0.5
  const v = 0.5 - centerY / scene.worldHeight
  const supplementalRelations = linearAlgebraSupplementalRelations
    .filter(({ targetId }) => targetId === sourceNode.id)
    .map(({ sourceId, kind, label }) => ({
      sourceId: toLocalId(sourceId),
      kind: kind as ThreeSubspaceRelationKind,
      label,
    }))

  return {
    id: toLocalId(sourceNode.id),
    canonicalConceptId: sourceNode.canonicalConceptId,
    title: sourceNode.title,
    englishTitle: sourceNode.english,
    summary: sourceNode.summary,
    tags: sourceNode.tags,
    fieldTags: sourceNode.fieldTags,
    level: sourceNode.level,
    importance: sourceNode.level <= 1 ? 0.96 : sourceNode.level === 4 ? 0.84 : 0.9,
    localPosition: [u * 5.2, v * 3.4, 0] as const,
    relations: [
      ...sourceNode.prerequisites.map((sourceId) => ({
        sourceId: toLocalId(sourceId),
        kind: 'strict-prerequisite' as const,
      })),
      ...supplementalRelations,
    ],
  }
})

export const linearAlgebraThreeSubspace = createThreeKnowledgeSubspace({
  id: scene.id,
  title: scene.title,
  ownerNodeId: scene.ownerNodeId ?? 'linear-algebra',
  primaryDomain: 'mathematics',
  nodes: sourceNodes,
  nodeScale: 0.115,
  domainField: {
    label: '数学',
    color: '#a64032',
    opacity: 0.105,
    lobeRadius: 0.56,
  },
  tagFields: {
    colors: ['#d79a48', '#70a258', '#8766c4', '#4f9cae', '#b98245'],
    opacity: 0.044,
    lobeRadius: 0.42,
  },
})
