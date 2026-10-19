import { knowledgeSpaceNodes } from '../../knowledge/space3d'
import type { ThreeKnowledgeSubspace } from '../../renderers/three'
import { arithmeticThreeSubspace } from './arithmeticSubspace'
import { calculusThreeSubspace } from './calculusSubspace'
import { linearAlgebraThreeSubspace } from './linearAlgebraSubspace'
import {
  memoryThreeSubspace,
  sensationPerceptionThreeSubspace,
} from './cognitiveScienceSubspaces'
import {
  cellularMolecularNeuroscienceThreeSubspace,
  cognitiveNeuroscienceThreeSubspace,
} from './neuroscienceSubspaces'

const defineThreeKnowledgeSubspaceRegistry = (
  subspaces: readonly ThreeKnowledgeSubspace[],
): readonly ThreeKnowledgeSubspace[] => {
  const publicNodeIds = new Set(knowledgeSpaceNodes.map((node) => node.id))
  const subspaceIds = new Set<string>()
  const ownerNodeIds = new Set<string>()
  const internalNodeIds = new Set<string>()

  subspaces.forEach((subspace) => {
    if (subspaceIds.has(subspace.id)) throw new Error(`三维子域注册表包含重复 ID：${subspace.id}`)
    if (ownerNodeIds.has(subspace.ownerNodeId)) {
      throw new Error(`三维子域父节点重复注册：${subspace.ownerNodeId}`)
    }
    if (!publicNodeIds.has(subspace.ownerNodeId)) {
      throw new Error(`三维子域 ${subspace.id} 引用了不存在的公共父节点：${subspace.ownerNodeId}`)
    }
    subspace.nodes.forEach(({ node }) => {
      if (internalNodeIds.has(node.id)) throw new Error(`三维子域内部节点 ID 重复：${node.id}`)
      if (node.canonicalConceptId && !publicNodeIds.has(node.canonicalConceptId)) {
        throw new Error(`三维子域投影 ${node.id} 引用了不存在的公共规范概念：${node.canonicalConceptId}`)
      }
      internalNodeIds.add(node.id)
    })
    subspaceIds.add(subspace.id)
    ownerNodeIds.add(subspace.ownerNodeId)
  })

  return subspaces
}

export const threeKnowledgeSubspaces = defineThreeKnowledgeSubspaceRegistry([
  arithmeticThreeSubspace,
  calculusThreeSubspace,
  linearAlgebraThreeSubspace,
  memoryThreeSubspace,
  sensationPerceptionThreeSubspace,
  cellularMolecularNeuroscienceThreeSubspace,
  cognitiveNeuroscienceThreeSubspace,
])

const threeSubspaceByOwnerNodeId = new Map(
  threeKnowledgeSubspaces.map((subspace) => [subspace.ownerNodeId, subspace]),
)

export const getThreeKnowledgeSubspaceByOwnerNodeId = (ownerNodeId: string) => (
  threeSubspaceByOwnerNodeId.get(ownerNodeId)
)
