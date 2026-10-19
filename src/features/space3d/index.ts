export { ThreeKnowledgeSurface } from './ThreeKnowledgeSurface'
export { arithmeticThreeSubspace } from './arithmeticSubspace'
export { calculusThreeSubspace } from './calculusSubspace'
export { linearAlgebraThreeSubspace } from './linearAlgebraSubspace'
export {
  getThreeKnowledgeSubspaceByOwnerNodeId,
  threeKnowledgeSubspaces,
} from './subspaceRegistry'
export {
  THREE_SUBSPACE_TRANSITION_DEFAULTS,
  createThreeKnowledgeSubspace,
} from './createThreeKnowledgeSubspace'
export type {
  CreateThreeKnowledgeSubspaceOptions,
  ThreeSubspaceDomainFieldOptions,
  ThreeSubspaceRelationKind,
  ThreeSubspaceSourceNode,
  ThreeSubspaceSourceRelation,
  ThreeSubspaceTagFieldOptions,
  ThreeSubspaceTransitionOptions,
} from './createThreeKnowledgeSubspace'
export type {
  ThreeKnowledgeSurfaceHandle,
  ThreeKnowledgeSurfaceProps,
} from './ThreeKnowledgeSurface'
