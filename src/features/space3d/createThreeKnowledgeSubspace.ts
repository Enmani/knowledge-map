import type {
  KnowledgeSpaceEdge,
  KnowledgeSpaceNode,
  ScienceDomainId,
  SpaceVector3,
} from '../../knowledge/space3d'
import type { ThreeKnowledgeSubspace } from '../../renderers/three'

export type ThreeSubspaceRelationKind =
  | 'strict-prerequisite'
  | 'recommended-prerequisite'
  | 'shared-model'
  | 'analogy'
  | 'application'

export interface ThreeSubspaceSourceRelation {
  sourceId: string
  kind: ThreeSubspaceRelationKind
  strength?: number
  label?: string
}

export interface ThreeSubspaceSourceNode {
  id: string
  canonicalConceptId?: string
  title: string
  englishTitle: string
  summary: string
  tags: readonly string[]
  fieldTags: readonly string[]
  level: KnowledgeSpaceNode['level']
  importance?: number
  domains?: readonly ScienceDomainId[]
  localPosition: SpaceVector3
  scale?: number
  relations: readonly ThreeSubspaceSourceRelation[]
}

export interface ThreeSubspaceDomainFieldOptions {
  label: string
  color: string
  opacity: number
  lobeRadius: number
  lobeOpacity?: number
}

export interface ThreeSubspaceTagFieldOptions {
  colors: readonly string[]
  opacity: number
  lobeRadius: number
  lobeOpacity?: number
  minimumMembers?: number
}

export interface ThreeSubspaceTransitionOptions {
  revealStartPx: number
  revealEndPx: number
  scopeEnterZoom: number
  scopeExitZoom: number
}

export interface CreateThreeKnowledgeSubspaceOptions {
  id: string
  title: string
  ownerNodeId: string
  primaryDomain: ScienceDomainId
  nodes: readonly ThreeSubspaceSourceNode[]
  nodeScale: number
  domainField: ThreeSubspaceDomainFieldOptions
  tagFields: ThreeSubspaceTagFieldOptions
  transition?: Partial<ThreeSubspaceTransitionOptions>
  edgeStrength?: number
}

export const THREE_SUBSPACE_TRANSITION_DEFAULTS: ThreeSubspaceTransitionOptions = {
  revealStartPx: 360,
  revealEndPx: 620,
  scopeEnterZoom: 12.45,
  scopeExitZoom: 8,
}

function assertValidSourceGraph(options: CreateThreeKnowledgeSubspaceOptions) {
  if (options.nodes.length === 0) throw new Error(`三维子域 ${options.id} 至少需要一个内部节点。`)
  if (!Number.isFinite(options.nodeScale) || options.nodeScale <= 0) {
    throw new Error(`三维子域 ${options.id} 的默认节点尺寸无效。`)
  }

  const sourceById = new Map<string, ThreeSubspaceSourceNode>()
  for (const node of options.nodes) {
    if (sourceById.has(node.id)) throw new Error(`三维子域 ${options.id} 包含重复节点：${node.id}`)
    if (!node.localPosition.every(Number.isFinite)) {
      throw new Error(`三维子域 ${options.id} 的节点 ${node.id} 缺少有效局部坐标。`)
    }
    sourceById.set(node.id, node)
  }
  const relationIds = new Set<string>()
  for (const node of options.nodes) {
    for (const relation of node.relations) {
      if (!sourceById.has(relation.sourceId)) {
        throw new Error(`三维子域 ${options.id} 的节点 ${node.id} 引用了域外关系源：${relation.sourceId}`)
      }
      if (relation.sourceId === node.id) {
        throw new Error(`三维子域 ${options.id} 的节点 ${node.id} 不能引用自身。`)
      }
      if (
        relation.strength !== undefined
        && (!Number.isFinite(relation.strength) || relation.strength < 0 || relation.strength > 1)
      ) {
        throw new Error(`三维子域 ${options.id} 的节点 ${node.id} 包含无效关系强度。`)
      }
      const relationId = `${relation.kind}:${relation.sourceId}:${node.id}`
      if (relationIds.has(relationId)) {
        throw new Error(`三维子域 ${options.id} 包含重复关系：${relationId}`)
      }
      relationIds.add(relationId)
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) throw new Error(`三维子域 ${options.id} 的严格前置关系形成循环：${nodeId}`)
    if (visited.has(nodeId)) return
    visiting.add(nodeId)
    for (const relation of sourceById.get(nodeId)?.relations ?? []) {
      if (relation.kind === 'strict-prerequisite') visit(relation.sourceId)
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
  }
  for (const node of options.nodes) visit(node.id)
}

function resolveTransition(
  options: CreateThreeKnowledgeSubspaceOptions,
): ThreeSubspaceTransitionOptions {
  const transition = {
    ...THREE_SUBSPACE_TRANSITION_DEFAULTS,
    ...options.transition,
  }
  if (
    !Number.isFinite(transition.revealStartPx)
    || !Number.isFinite(transition.revealEndPx)
    || transition.revealStartPx < 0
    || transition.revealEndPx <= transition.revealStartPx
    || !Number.isFinite(transition.scopeEnterZoom)
    || !Number.isFinite(transition.scopeExitZoom)
    || transition.scopeExitZoom <= 0
    || transition.scopeExitZoom >= transition.scopeEnterZoom
  ) {
    throw new Error(`三维子域 ${options.id} 的显隐或进入退出阈值无效。`)
  }
  return transition
}

export function createThreeKnowledgeSubspace(
  options: CreateThreeKnowledgeSubspaceOptions,
): ThreeKnowledgeSubspace {
  assertValidSourceGraph(options)
  const transition = resolveTransition(options)
  const instanceId = (nodeId: string) => `${options.id}:${nodeId}`
  const entries = options.nodes.map((source) => {
    const node: KnowledgeSpaceNode = {
      id: instanceId(source.id),
      canonicalConceptId: source.canonicalConceptId,
      title: source.title,
      englishTitle: source.englishTitle,
      summary: source.summary,
      primaryDomain: options.primaryDomain,
      domains: source.domains ?? [options.primaryDomain],
      tags: [...new Set([...source.fieldTags, ...source.tags])],
      level: source.level,
      importance: source.importance ?? 0.86,
    }
    return {
      source,
      node,
      localPosition: source.localPosition,
      scale: source.scale ?? options.nodeScale,
    }
  })
  const relationDefaults: Readonly<Record<ThreeSubspaceRelationKind, {
    type: KnowledgeSpaceEdge['type']
    prerequisiteKind?: KnowledgeSpaceEdge['prerequisiteKind']
    strength: number
    label: string
  }>> = {
    'strict-prerequisite': { type: 'prerequisite', prerequisiteKind: 'strict', strength: options.edgeStrength ?? 0.92, label: '前置' },
    'recommended-prerequisite': { type: 'prerequisite', prerequisiteKind: 'recommended', strength: 0.64, label: '建议前置' },
    'shared-model': { type: 'shared-model', strength: 0.82, label: '共享模型' },
    analogy: { type: 'analogy', strength: 0.58, label: '类比' },
    application: { type: 'application', strength: 0.78, label: '应用' },
  }
  const edges: KnowledgeSpaceEdge[] = entries.flatMap(({ source: target }) => (
    target.relations.map((relation) => {
      const defaults = relationDefaults[relation.kind]
      return {
        id: `${options.id}:relation:${relation.kind}:${relation.sourceId}:${target.id}`,
        source: instanceId(relation.sourceId),
        target: instanceId(target.id),
        type: defaults.type,
        ...(defaults.prerequisiteKind ? { prerequisiteKind: defaults.prerequisiteKind } : {}),
        strength: relation.strength ?? defaults.strength,
        label: relation.label ?? defaults.label,
      }
    })
  ))

  const tagMembers = new Map<string, typeof entries>()
  entries.forEach((entry) => entry.source.fieldTags.forEach((tag) => {
    tagMembers.set(tag, [...(tagMembers.get(tag) ?? []), entry])
  }))
  const minimumTagMembers = options.tagFields.minimumMembers ?? 2
  if (options.tagFields.colors.length === 0) {
    throw new Error(`三维子域 ${options.id} 至少需要一种标签场颜色。`)
  }
  const fields: NonNullable<ThreeKnowledgeSubspace['fields']> = [
    {
      id: `${options.id}:field:domain:${options.primaryDomain}`,
      kind: 'domain',
      label: options.domainField.label,
      color: options.domainField.color,
      domainId: options.primaryDomain,
      opacity: options.domainField.opacity,
      lobes: entries.map(({ node, localPosition }) => ({
        nodeId: node.id,
        localPosition,
        radius: options.domainField.lobeRadius,
        opacity: options.domainField.lobeOpacity ?? 0.96,
      })),
    },
    ...[...tagMembers.entries()]
      .filter(([, members]) => members.length >= minimumTagMembers)
      .map(([tag, members], index) => ({
        id: `${options.id}:field:tag:${tag}`,
        kind: 'tag' as const,
        label: `#${tag}`,
        color: options.tagFields.colors[index % options.tagFields.colors.length],
        tag,
        opacity: options.tagFields.opacity,
        lobes: members.map(({ node, localPosition }) => ({
          nodeId: node.id,
          localPosition,
          radius: options.tagFields.lobeRadius,
          opacity: options.tagFields.lobeOpacity ?? 0.9,
        })),
      })),
  ]

  return {
    id: options.id,
    title: options.title,
    ownerNodeId: options.ownerNodeId,
    nodes: entries.map(({ node, localPosition, scale }) => ({ node, localPosition, scale })),
    edges,
    fields,
    ...transition,
  }
}
