export { ScopeBreadcrumbs } from './components/ScopeBreadcrumbs'
export { useScopeNavigation } from './hooks/useScopeNavigation'
export { knowledgeAtlas, knowledgeAtlasValidation, knownConceptIds } from './atlasAdapter'
export {
  getMapScene,
  sceneCatalog,
  validateMapScene,
} from './sceneCatalog'
export {
  calculusEmbedding,
  composeEmbeddedCamera,
  decomposeEmbeddedCamera,
  getChildScene,
  getChildScenes,
  getSceneEmbedding,
  mapScenePointToRoot,
  sceneEmbeddings,
  sceneBoundsInRoot,
  sceneScaleInRoot,
  sceneTransformInRoot,
  smoothstep,
} from './sceneEmbedding'
export type { CameraTransform, SceneEmbedding, WorldPoint } from './sceneEmbedding'
export type { ScopeBreadcrumbsProps } from './components/ScopeBreadcrumbs'
export type {
  ScopeCameraSnapshot,
  ScopeNavigationResult,
  ScopeNavigationTransition,
  UseScopeNavigationOptions,
} from './hooks/useScopeNavigation'
export type {
  MapScene,
  MapSceneId,
  MapSceneValidationResult,
} from './sceneCatalog'
