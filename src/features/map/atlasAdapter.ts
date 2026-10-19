import type { Concept, KnowledgeAtlas, KnowledgeSpace, Placement, Relation } from '../../domain/knowledge'
import { assertValidKnowledgeAtlas, validateKnowledgeAtlas } from '../../domain/knowledgeValidation'
import { sceneCatalog } from './sceneCatalog'

const scenes = Object.values(sceneCatalog)

const concepts: Concept[] = [...new Map(scenes.flatMap((scene) => scene.nodes).map((node) => [node.id, {
  id: node.id,
  title: node.title,
  summary: node.summary,
  tags: [...node.fieldTags, ...node.tags],
  contentRef: node.canonicalConceptId
    ? `content:${node.canonicalConceptId}`
    : node.id === 'calculus' ? 'content:calculus' : undefined,
  metadata: node.canonicalConceptId ? { canonicalConceptId: node.canonicalConceptId } : undefined,
} satisfies Concept])).values()]

const spaces: KnowledgeSpace[] = scenes.map((scene) => ({
  id: scene.id,
  title: scene.title,
  ownerConceptId: scene.ownerNodeId,
  width: scene.worldWidth,
  height: scene.worldHeight,
  layoutVersion: 1,
}))

const placements: Placement[] = []
const canonicalPlacementIds = new Map<string, string>()
for (const scene of scenes) {
  for (const node of scene.nodes) {
    const id = `${scene.id}:${node.id}`
    const position = scene.layout.positions[node.id]
    const childScene = scenes.find((candidate) => candidate.parentSceneId === scene.id && candidate.ownerNodeId === node.id)
    const canonicalId = canonicalPlacementIds.get(node.id)
    placements.push({
      id,
      spaceId: scene.id,
      conceptId: node.id,
      role: canonicalId ? 'alias' : 'canonical',
      x: position.x,
      y: position.y,
      width: scene.nodeWidth,
      height: scene.nodeHeight,
      childSpaceId: childScene?.id,
      aliasOfPlacementId: canonicalId,
      importance: Math.max(0.2, 1 - node.level * 0.12),
    })
    if (!canonicalId) canonicalPlacementIds.set(node.id, id)
  }
}

const localRelations: Relation[] = scenes.flatMap((scene) => scene.nodes.flatMap((node) => (
  [
    ...node.prerequisites.map((prerequisiteId) => ({
      id: `${scene.id}:${prerequisiteId}>${node.id}`,
      from: prerequisiteId,
      to: node.id,
      type: 'required' as const,
    })),
    ...(node.recommendedPrerequisites ?? []).map((prerequisiteId) => ({
      id: `${scene.id}:recommended:${prerequisiteId}>${node.id}`,
      from: prerequisiteId,
      to: node.id,
      type: 'recommended' as const,
    })),
  ]
)))

const containmentRelations: Relation[] = scenes.flatMap((scene) => {
  if (!scene.ownerNodeId) return []
  return scene.nodes
    .filter((node) => node.prerequisites.length === 0)
    .map((node) => ({
      id: `${scene.id}:${scene.ownerNodeId}>${node.id}`,
      from: scene.ownerNodeId as string,
      to: node.id,
      type: 'required' as const,
    }))
})

const relations: Relation[] = [...localRelations, ...containmentRelations]

export const knowledgeAtlas: KnowledgeAtlas = { concepts, spaces, placements, relations }
export const knownConceptIds: ReadonlySet<string> = new Set(concepts.map((concept) => concept.id))
export const knowledgeAtlasValidation = validateKnowledgeAtlas(knowledgeAtlas)
assertValidKnowledgeAtlas(knowledgeAtlas)
