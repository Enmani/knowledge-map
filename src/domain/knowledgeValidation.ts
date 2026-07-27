import type {
  ConceptId,
  KnowledgeAtlas,
  Placement,
  Relation,
  SpaceId,
} from './knowledge'

export type KnowledgeValidationCode =
  | 'duplicate-concept-id'
  | 'duplicate-space-id'
  | 'duplicate-placement-id'
  | 'duplicate-relation-id'
  | 'missing-concept-reference'
  | 'missing-space-reference'
  | 'missing-placement-reference'
  | 'invalid-placement-bounds'
  | 'invalid-space-bounds'
  | 'invalid-layout-version'
  | 'invalid-alias'
  | 'multiple-canonical-placements'
  | 'missing-canonical-placement'
  | 'multiple-space-parents'
  | 'space-owner-mismatch'
  | 'containment-cycle'
  | 'required-cycle'

export interface KnowledgeValidationIssue {
  code: KnowledgeValidationCode
  severity: 'error' | 'warning'
  message: string
  ids: readonly string[]
}

export interface KnowledgeValidationResult {
  valid: boolean
  issues: readonly KnowledgeValidationIssue[]
}

function collectDuplicateIds<T extends { id: string }>(
  values: readonly T[],
  code: KnowledgeValidationCode,
  label: string,
  issues: KnowledgeValidationIssue[],
) {
  const seen = new Set<string>()
  const reported = new Set<string>()

  for (const value of values) {
    if (seen.has(value.id) && !reported.has(value.id)) {
      issues.push({
        code,
        severity: 'error',
        message: `${label} ID “${value.id}” 重复。`,
        ids: [value.id],
      })
      reported.add(value.id)
    }
    seen.add(value.id)
  }
}

function findDirectedCycles(
  nodes: readonly string[],
  neighbors: (id: string) => readonly string[],
): string[][] {
  const state = new Map<string, 'visiting' | 'visited'>()
  const stack: string[] = []
  const stackIndex = new Map<string, number>()
  const cycles: string[][] = []

  const visit = (id: string) => {
    state.set(id, 'visiting')
    stackIndex.set(id, stack.length)
    stack.push(id)

    for (const neighbor of neighbors(id)) {
      const neighborState = state.get(neighbor)
      if (!neighborState) {
        visit(neighbor)
      } else if (neighborState === 'visiting') {
        const cycleStart = stackIndex.get(neighbor)
        if (cycleStart !== undefined) {
          cycles.push([...stack.slice(cycleStart), neighbor])
        }
      }
    }

    stack.pop()
    stackIndex.delete(id)
    state.set(id, 'visited')
  }

  for (const id of nodes) {
    if (!state.has(id)) visit(id)
  }

  return cycles
}

function validatePlacementBounds(placement: Placement, issues: KnowledgeValidationIssue[]) {
  const values = [placement.x, placement.y, placement.width, placement.height]
  if (!values.every(Number.isFinite) || placement.width <= 0 || placement.height <= 0) {
    issues.push({
      code: 'invalid-placement-bounds',
      severity: 'error',
      message: `节点实例 “${placement.id}” 的坐标或尺寸无效。`,
      ids: [placement.id],
    })
  }
}

function validateAlias(
  placement: Placement,
  placementById: ReadonlyMap<string, Placement>,
  issues: KnowledgeValidationIssue[],
) {
  if (placement.role === 'canonical') {
    if (placement.aliasOfPlacementId) {
      issues.push({
        code: 'invalid-alias',
        severity: 'error',
        message: `规范实例 “${placement.id}” 不能声明 aliasOfPlacementId。`,
        ids: [placement.id, placement.aliasOfPlacementId],
      })
    }
    return
  }

  if (!placement.aliasOfPlacementId) {
    issues.push({
      code: 'invalid-alias',
      severity: 'error',
      message: `别名实例 “${placement.id}” 缺少 aliasOfPlacementId。`,
      ids: [placement.id],
    })
    return
  }

  const canonical = placementById.get(placement.aliasOfPlacementId)
  if (!canonical) {
    issues.push({
      code: 'missing-placement-reference',
      severity: 'error',
      message: `别名实例 “${placement.id}” 指向不存在的实例 “${placement.aliasOfPlacementId}”。`,
      ids: [placement.id, placement.aliasOfPlacementId],
    })
  } else if (canonical.role !== 'canonical' || canonical.conceptId !== placement.conceptId) {
    issues.push({
      code: 'invalid-alias',
      severity: 'error',
      message: `别名实例 “${placement.id}” 必须指向同一概念的规范实例。`,
      ids: [placement.id, canonical.id],
    })
  }

}

function relationNeighbors(
  relations: readonly Relation[],
  conceptIds: ReadonlySet<ConceptId>,
) {
  const adjacency = new Map<ConceptId, ConceptId[]>()
  for (const relation of relations) {
    if (
      relation.type !== 'required' ||
      !conceptIds.has(relation.from) ||
      !conceptIds.has(relation.to)
    ) {
      continue
    }
    const neighbors = adjacency.get(relation.from)
    if (neighbors) neighbors.push(relation.to)
    else adjacency.set(relation.from, [relation.to])
  }
  return adjacency
}

export function validateKnowledgeAtlas(atlas: KnowledgeAtlas): KnowledgeValidationResult {
  const issues: KnowledgeValidationIssue[] = []

  collectDuplicateIds(atlas.concepts, 'duplicate-concept-id', '概念', issues)
  collectDuplicateIds(atlas.spaces, 'duplicate-space-id', '空间', issues)
  collectDuplicateIds(atlas.placements, 'duplicate-placement-id', '节点实例', issues)
  collectDuplicateIds(atlas.relations, 'duplicate-relation-id', '关系', issues)

  const conceptById = new Map(atlas.concepts.map((concept) => [concept.id, concept]))
  const spaceById = new Map(atlas.spaces.map((space) => [space.id, space]))
  const placementById = new Map(atlas.placements.map((placement) => [placement.id, placement]))
  const canonicalByConcept = new Map<ConceptId, Placement[]>()
  const parentsByChildSpace = new Map<SpaceId, Placement[]>()

  for (const space of atlas.spaces) {
    if (!Number.isFinite(space.width) || !Number.isFinite(space.height) || space.width <= 0 || space.height <= 0) {
      issues.push({
        code: 'invalid-space-bounds',
        severity: 'error',
        message: `空间 “${space.id}” 的尺寸无效。`,
        ids: [space.id],
      })
    }
    if (!Number.isInteger(space.layoutVersion) || space.layoutVersion < 0) {
      issues.push({
        code: 'invalid-layout-version',
        severity: 'error',
        message: `空间 “${space.id}” 的 layoutVersion 必须是非负整数。`,
        ids: [space.id],
      })
    }
    if (space.ownerConceptId && !conceptById.has(space.ownerConceptId)) {
      issues.push({
        code: 'missing-concept-reference',
        severity: 'error',
        message: `空间 “${space.id}” 的所有者概念不存在。`,
        ids: [space.id, space.ownerConceptId],
      })
    }
  }

  for (const placement of atlas.placements) {
    validatePlacementBounds(placement, issues)
    validateAlias(placement, placementById, issues)

    if (!conceptById.has(placement.conceptId)) {
      issues.push({
        code: 'missing-concept-reference',
        severity: 'error',
        message: `节点实例 “${placement.id}” 引用了不存在的概念。`,
        ids: [placement.id, placement.conceptId],
      })
    }
    if (!spaceById.has(placement.spaceId)) {
      issues.push({
        code: 'missing-space-reference',
        severity: 'error',
        message: `节点实例 “${placement.id}” 所在的空间不存在。`,
        ids: [placement.id, placement.spaceId],
      })
    }

    if (placement.role === 'canonical') {
      const canonical = canonicalByConcept.get(placement.conceptId)
      if (canonical) canonical.push(placement)
      else canonicalByConcept.set(placement.conceptId, [placement])
    }

    if (placement.childSpaceId) {
      const childSpace = spaceById.get(placement.childSpaceId)
      if (!childSpace) {
        issues.push({
          code: 'missing-space-reference',
          severity: 'error',
          message: `节点实例 “${placement.id}” 的子空间不存在。`,
          ids: [placement.id, placement.childSpaceId],
        })
      } else if (childSpace.ownerConceptId && childSpace.ownerConceptId !== placement.conceptId) {
        issues.push({
          code: 'space-owner-mismatch',
          severity: 'error',
          message: `子空间 “${childSpace.id}” 的所有者与节点实例 “${placement.id}” 不一致。`,
          ids: [placement.id, childSpace.id, childSpace.ownerConceptId],
        })
      }

      const parents = parentsByChildSpace.get(placement.childSpaceId)
      if (parents) parents.push(placement)
      else parentsByChildSpace.set(placement.childSpaceId, [placement])
    }
  }

  for (const concept of atlas.concepts) {
    const canonical = canonicalByConcept.get(concept.id) ?? []
    if (canonical.length === 0) {
      issues.push({
        code: 'missing-canonical-placement',
        severity: 'warning',
        message: `概念 “${concept.id}” 尚无规范实例。`,
        ids: [concept.id],
      })
    } else if (canonical.length > 1) {
      issues.push({
        code: 'multiple-canonical-placements',
        severity: 'error',
        message: `概念 “${concept.id}” 只能有一个规范实例。`,
        ids: canonical.map((placement) => placement.id),
      })
    }

    const unlockRefs = [...(concept.unlockRule?.allOf ?? []), ...(concept.unlockRule?.anyOf ?? [])]
    for (const requiredId of unlockRefs) {
      if (!conceptById.has(requiredId)) {
        issues.push({
          code: 'missing-concept-reference',
          severity: 'error',
          message: `概念 “${concept.id}” 的解锁条件引用了不存在的概念 “${requiredId}”。`,
          ids: [concept.id, requiredId],
        })
      }
    }
  }

  for (const [childSpaceId, parents] of parentsByChildSpace) {
    if (parents.length > 1) {
      issues.push({
        code: 'multiple-space-parents',
        severity: 'error',
        message: `空间 “${childSpaceId}” 被多个节点实例包含；请保留一个规范父级并改用别名。`,
        ids: [childSpaceId, ...parents.map((parent) => parent.id)],
      })
    }
  }

  for (const relation of atlas.relations) {
    if (!conceptById.has(relation.from)) {
      issues.push({
        code: 'missing-concept-reference',
        severity: 'error',
        message: `关系 “${relation.id}” 的起点概念不存在。`,
        ids: [relation.id, relation.from],
      })
    }
    if (!conceptById.has(relation.to)) {
      issues.push({
        code: 'missing-concept-reference',
        severity: 'error',
        message: `关系 “${relation.id}” 的终点概念不存在。`,
        ids: [relation.id, relation.to],
      })
    }
  }

  const containmentAdjacency = new Map<SpaceId, SpaceId[]>()
  for (const placement of atlas.placements) {
    if (!placement.childSpaceId || !spaceById.has(placement.spaceId) || !spaceById.has(placement.childSpaceId)) {
      continue
    }
    const children = containmentAdjacency.get(placement.spaceId)
    if (children) children.push(placement.childSpaceId)
    else containmentAdjacency.set(placement.spaceId, [placement.childSpaceId])
  }

  for (const cycle of findDirectedCycles(
    atlas.spaces.map((space) => space.id),
    (id) => containmentAdjacency.get(id) ?? [],
  )) {
    issues.push({
      code: 'containment-cycle',
      severity: 'error',
      message: `空间包含关系形成循环：${cycle.join(' → ')}。`,
      ids: cycle,
    })
  }

  const conceptIds = new Set(atlas.concepts.map((concept) => concept.id))
  const requiredAdjacency = relationNeighbors(atlas.relations, conceptIds)
  for (const cycle of findDirectedCycles(
    atlas.concepts.map((concept) => concept.id),
    (id) => requiredAdjacency.get(id) ?? [],
  )) {
    issues.push({
      code: 'required-cycle',
      severity: 'error',
      message: `严格前置关系形成循环：${cycle.join(' → ')}。`,
      ids: cycle,
    })
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    issues,
  }
}

export function assertValidKnowledgeAtlas(
  atlas: KnowledgeAtlas,
): asserts atlas is KnowledgeAtlas {
  const result = validateKnowledgeAtlas(atlas)
  if (!result.valid) {
    const messages = result.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.message)
    throw new Error(`知识地图数据校验失败：\n${messages.join('\n')}`)
  }
}
