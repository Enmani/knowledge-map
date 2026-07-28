import { getMapScene } from '../map'
import type { KnowledgeSpaceEdge, KnowledgeSpaceNode } from '../../knowledge/space3d'
import type { ThreeKnowledgeSubspace } from '../../renderers/three'

const scene = getMapScene('calculus')

if (!scene) throw new Error('三维微积分子域缺少二维微积分场景。')

const instanceId = (nodeId: string) => `${scene.id}:${nodeId}`

const nodes = scene.nodes.map((sourceNode) => {
  const position = scene.layout.positions[sourceNode.id]
  const centerX = position.x + scene.nodeWidth / 2
  const centerY = position.y + scene.nodeHeight / 2
  const u = centerX / scene.worldWidth - 0.5
  const v = 0.5 - centerY / scene.worldHeight
  const node: KnowledgeSpaceNode = {
    id: instanceId(sourceNode.id),
    title: sourceNode.title,
    englishTitle: sourceNode.english,
    summary: sourceNode.summary,
    primaryDomain: 'mathematics',
    domains: ['mathematics'],
    tags: [...new Set([...sourceNode.fieldTags, ...sourceNode.tags])],
    level: sourceNode.level,
    importance: 0.86,
  }
  return {
    node,
    localPosition: [u * 3.5, v * 2.7, 0] as const,
    scale: 0.144,
  }
})

const edges: KnowledgeSpaceEdge[] = scene.nodes.flatMap((targetNode) => (
  targetNode.prerequisites.map((sourceNodeId) => ({
    id: `${scene.id}:prerequisite:${sourceNodeId}:${targetNode.id}`,
    source: instanceId(sourceNodeId),
    target: instanceId(targetNode.id),
    type: 'prerequisite' as const,
    prerequisiteKind: 'strict' as const,
    strength: 0.92,
    label: '前置',
  }))
))

export const calculusThreeSubspace: ThreeKnowledgeSubspace = {
  id: scene.id,
  title: scene.title,
  ownerNodeId: scene.ownerNodeId ?? 'calculus',
  nodes,
  edges,
  revealStartPx: 360,
  revealEndPx: 620,
}
