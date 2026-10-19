import { getMapScene } from '../map'
import { createThreeKnowledgeSubspace } from './createThreeKnowledgeSubspace'

const scene = getMapScene('calculus')

if (!scene) throw new Error('三维微积分子域缺少二维微积分场景。')

const sourceNodes = scene.nodes.map((sourceNode) => {
  const position = scene.layout.positions[sourceNode.id]
  const centerX = position.x + scene.nodeWidth / 2
  const centerY = position.y + scene.nodeHeight / 2
  const u = centerX / scene.worldWidth - 0.5
  const v = 0.5 - centerY / scene.worldHeight
  return {
    id: sourceNode.id,
    title: sourceNode.title,
    englishTitle: sourceNode.english,
    summary: sourceNode.summary,
    tags: sourceNode.tags,
    fieldTags: sourceNode.fieldTags,
    level: sourceNode.level,
    importance: 0.86,
    localPosition: [u * 3.5, v * 2.7, 0] as const,
    relations: sourceNode.prerequisites.map((sourceId) => ({
      sourceId,
      kind: 'strict-prerequisite' as const,
    })),
  }
})

export const calculusThreeSubspace = createThreeKnowledgeSubspace({
  id: scene.id,
  title: scene.title,
  ownerNodeId: scene.ownerNodeId ?? 'calculus',
  primaryDomain: 'mathematics',
  nodes: sourceNodes,
  nodeScale: 0.144,
  domainField: {
    label: '数学',
    color: '#8fb8d7',
    opacity: 0.105,
    lobeRadius: 0.66,
  },
  tagFields: {
    colors: ['#7897ad', '#b39a78', '#9a91ae', '#7fa39a'],
    opacity: 0.044,
    lobeRadius: 0.48,
  },
})
