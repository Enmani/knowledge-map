import { sceneCatalog, type MapScene, type MapSceneId } from './sceneCatalog'

export interface CameraTransform {
  x: number
  y: number
  scale: number
}

export interface SceneEmbedding {
  parentSceneId: MapSceneId
  childSceneId: MapSceneId
  ownerNodeId: string
  offsetX: number
  offsetY: number
  scale: number
  width: number
  height: number
}

export interface WorldPoint {
  x: number
  y: number
}

const EMBEDDING_PADDING = 4

function createSceneEmbedding(parent: MapScene, child: MapScene): SceneEmbedding {
  if (child.parentSceneId !== parent.id || !child.ownerNodeId) {
    throw new Error(`场景“${child.id}”缺少有效的父场景嵌入关系。`)
  }

  const ownerPosition = parent.layout.positions[child.ownerNodeId]
  if (!ownerPosition) throw new Error(`父场景中不存在容器节点“${child.ownerNodeId}”。`)

  const referenceWidth = child.embeddingReferenceWidth ?? child.worldWidth
  const referenceHeight = child.embeddingReferenceHeight ?? child.worldHeight
  const scale = Math.min(
    (parent.nodeWidth - EMBEDDING_PADDING * 2) / referenceWidth,
    (parent.nodeHeight - EMBEDDING_PADDING * 2) / referenceHeight,
  )
  const width = child.worldWidth * scale
  const height = child.worldHeight * scale

  return {
    parentSceneId: parent.id,
    childSceneId: child.id,
    ownerNodeId: child.ownerNodeId,
    offsetX: ownerPosition.x + (parent.nodeWidth - width) / 2,
    offsetY: ownerPosition.y + (parent.nodeHeight - height) / 2,
    scale,
    width,
    height,
  }
}

const childScenes = Object.values(sceneCatalog).filter((scene) => scene.parentSceneId !== undefined)

export const sceneEmbeddings: ReadonlyMap<MapSceneId, SceneEmbedding> = new Map(
  childScenes.map((child) => {
    const parent = child.parentSceneId ? sceneCatalog[child.parentSceneId] : undefined
    if (!parent) throw new Error(`场景“${child.id}”缺少父场景。`)
    return [child.id, createSceneEmbedding(parent, child)]
  }),
)

export const calculusEmbedding = sceneEmbeddings.get('calculus') as SceneEmbedding

export function getSceneEmbedding(sceneId: MapSceneId): SceneEmbedding | undefined {
  return sceneEmbeddings.get(sceneId)
}

export function getChildScene(parentSceneId: MapSceneId, ownerNodeId: string): MapScene | undefined {
  return childScenes.find((scene) => (
    scene.parentSceneId === parentSceneId && scene.ownerNodeId === ownerNodeId
  ))
}

export function getChildScenes(parentSceneId: MapSceneId): readonly MapScene[] {
  return childScenes.filter((scene) => scene.parentSceneId === parentSceneId)
}

export function mapScenePointToRoot(sceneId: MapSceneId, point: WorldPoint): WorldPoint {
  let currentSceneId = sceneId
  let mappedPoint = { ...point }
  const visited = new Set<MapSceneId>()

  while (currentSceneId !== 'root') {
    if (visited.has(currentSceneId)) throw new Error(`场景“${sceneId}”的坐标映射形成循环。`)
    visited.add(currentSceneId)
    const embedding = sceneEmbeddings.get(currentSceneId)
    if (!embedding) throw new Error(`场景“${currentSceneId}”还没有父坐标映射。`)
    mappedPoint = {
      x: embedding.offsetX + mappedPoint.x * embedding.scale,
      y: embedding.offsetY + mappedPoint.y * embedding.scale,
    }
    currentSceneId = embedding.parentSceneId
  }

  return mappedPoint
}

export function sceneScaleInRoot(sceneId: MapSceneId): number {
  let currentSceneId = sceneId
  let scale = 1
  const visited = new Set<MapSceneId>()

  while (currentSceneId !== 'root') {
    if (visited.has(currentSceneId)) throw new Error(`场景“${sceneId}”的缩放映射形成循环。`)
    visited.add(currentSceneId)
    const embedding = sceneEmbeddings.get(currentSceneId)
    if (!embedding) throw new Error(`场景“${currentSceneId}”还没有根坐标缩放。`)
    scale *= embedding.scale
    currentSceneId = embedding.parentSceneId
  }

  return scale
}

export function sceneTransformInRoot(sceneId: MapSceneId): { x: number; y: number; scale: number } {
  const origin = mapScenePointToRoot(sceneId, { x: 0, y: 0 })
  return { ...origin, scale: sceneScaleInRoot(sceneId) }
}

export function composeEmbeddedCamera(
  rootCamera: CameraTransform,
  embedding: SceneEmbedding,
): CameraTransform {
  return {
    x: rootCamera.x + rootCamera.scale * embedding.offsetX,
    y: rootCamera.y + rootCamera.scale * embedding.offsetY,
    scale: rootCamera.scale * embedding.scale,
  }
}

export function decomposeEmbeddedCamera(
  childCamera: CameraTransform,
  embedding: SceneEmbedding,
): CameraTransform {
  const scale = childCamera.scale / embedding.scale
  return {
    x: childCamera.x - scale * embedding.offsetX,
    y: childCamera.y - scale * embedding.offsetY,
    scale,
  }
}

export function sceneBoundsInRoot(scene: MapScene): { x: number; y: number; width: number; height: number } {
  const origin = mapScenePointToRoot(scene.id, { x: 0, y: 0 })
  const scale = sceneScaleInRoot(scene.id)
  return {
    x: origin.x,
    y: origin.y,
    width: scene.worldWidth * scale,
    height: scene.worldHeight * scale,
  }
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) return value < edge0 ? 0 : 1
  const normalized = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return normalized * normalized * (3 - 2 * normalized)
}
