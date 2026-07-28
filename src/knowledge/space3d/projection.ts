import { knowledgeSpaceEdges, knowledgeSpaceNodes, scienceDomains } from './data'
import { knowledgeLenses } from './lenses'
import type {
  KnowledgeLensDefinition,
  KnowledgeLensId,
  KnowledgeRelationType,
  KnowledgeSpaceDataset,
  KnowledgeSpaceFocus,
  KnowledgeSpaceNode,
  KnowledgeSpaceProjection,
  KnowledgeSphereParameters,
  ProjectedKnowledgeField,
  ProjectedKnowledgeEdge,
  ProjectedKnowledgeNode,
  ProjectionOptions,
  ScienceDomainDefinition,
  ScienceDomainId,
  SpaceVector3,
} from './types'

const DOMAIN_ORDER: readonly ScienceDomainId[] = ['mathematics', 'physics', 'chemistry', 'biology']
const DEFAULT_COLLISION_PADDING = 0.18
const DEFAULT_RELAXATION_ITERATIONS = 48
export const KNOWLEDGE_NODE_COLLISION_RADIUS = 0.78
const MAX_PACKING_PASSES = 120
const FOCUS_SLOT_COUNT = 4096
const EPSILON = 1e-7
const TAG_FIELD_COLORS = ['#8aa7a2', '#b39a78', '#9a91ae', '#b88477', '#7897ad', '#9aa778', '#a47f96', '#7fa39a'] as const

export const DEFAULT_KNOWLEDGE_SPHERE: Readonly<KnowledgeSphereParameters> = {
  coreRadius: 3.2,
  outerRadius: 13.4,
  radialGamma: 0.82,
  radialJitter: 0.16,
  globalAnchorWeight: 0.28,
}

const INV_SQRT_3 = 1 / Math.sqrt(3)

/** Equal-angle vertices of a regular tetrahedron. */
export const TETRAHEDRAL_DOMAIN_DIRECTIONS: Readonly<Record<ScienceDomainId, SpaceVector3>> = {
  mathematics: [INV_SQRT_3, INV_SQRT_3, INV_SQRT_3],
  physics: [INV_SQRT_3, -INV_SQRT_3, -INV_SQRT_3],
  chemistry: [-INV_SQRT_3, INV_SQRT_3, -INV_SQRT_3],
  biology: [-INV_SQRT_3, -INV_SQRT_3, INV_SQRT_3],
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value))
const clamp01 = (value: number) => clamp(value, 0, 1)
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount
const add = (a: SpaceVector3, b: SpaceVector3): SpaceVector3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const subtract = (a: SpaceVector3, b: SpaceVector3): SpaceVector3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const multiply = (value: SpaceVector3, scalar: number): SpaceVector3 => [value[0] * scalar, value[1] * scalar, value[2] * scalar]
const dot = (a: SpaceVector3, b: SpaceVector3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const length = (value: SpaceVector3) => Math.hypot(value[0], value[1], value[2])
const normalize = (value: SpaceVector3, fallback: SpaceVector3 = [1, 0, 0]): SpaceVector3 => {
  const magnitude = length(value)
  return magnitude > EPSILON ? multiply(value, 1 / magnitude) : fallback
}
const vectorLerp = (from: SpaceVector3, to: SpaceVector3, amount: number): SpaceVector3 => [
  lerp(from[0], to[0], amount),
  lerp(from[1], to[1], amount),
  lerp(from[2], to[2], amount),
]
const tangentComponent = (force: SpaceVector3, radialUnit: SpaceVector3): SpaceVector3 =>
  subtract(force, multiply(radialUnit, dot(force, radialUnit)))

const stableHash = (input: string): number => {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const stableSigned = (input: string) => stableHash(input) / 0xffffffff * 2 - 1

const stableUnitVector = (input: string): SpaceVector3 => {
  const z = stableSigned(`${input}:z`)
  const angle = (stableHash(`${input}:angle`) / 0xffffffff) * Math.PI * 2
  const planar = Math.sqrt(Math.max(0, 1 - z * z))
  return [Math.cos(angle) * planar, Math.sin(angle) * planar, z]
}

const fibonacciDirection = (index: number, count: number, phase: number): SpaceVector3 => {
  const y = 1 - 2 * ((index + 0.5) / Math.max(1, count))
  const radius = Math.sqrt(Math.max(0, 1 - y * y))
  const angle = index * Math.PI * (3 - Math.sqrt(5)) + phase
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius]
}

const defaultDataset = (): KnowledgeSpaceDataset => ({
  domains: scienceDomains,
  nodes: knowledgeSpaceNodes,
  edges: knowledgeSpaceEdges,
  lenses: knowledgeLenses,
})

const findLens = (dataset: KnowledgeSpaceDataset, lensId: KnowledgeLensId) => {
  const lens = dataset.lenses.find((candidate) => candidate.id === lensId)
  if (!lens) throw new Error(`Unknown knowledge lens: ${lensId}`)
  return lens
}

export interface KnowledgeDepthResult {
  depthById: ReadonlyMap<string, number>
  maxDepth: number
  fallbackNodeIds: ReadonlySet<string>
}

/**
 * Longest-path depth over strict prerequisite edges. Curated levels calibrate only
 * the node they belong to and never propagate through the graph. Kahn ordering makes
 * the result deterministic. Nodes blocked by a cycle use their level as a fallback.
 */
export const computeKnowledgeDepths = (dataset: KnowledgeSpaceDataset): KnowledgeDepthResult => {
  const nodes = [...dataset.nodes].sort((a, b) => a.id.localeCompare(b.id))
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const outgoing = new Map<string, string[]>()
  const indegree = new Map(nodes.map((node) => [node.id, 0]))

  dataset.edges
    .filter((edge) => (
      edge.type === 'prerequisite'
      && edge.prerequisiteKind !== 'recommended'
      && nodeById.has(edge.source)
      && nodeById.has(edge.target)
    ))
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((edge) => {
      outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target])
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
    })
  outgoing.forEach((targets) => targets.sort())

  const graphDepth = new Map<string, number>(nodes.map((node) => [node.id, 0]))
  const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id).sort()
  const processed = new Set<string>()

  while (queue.length) {
    const source = queue.shift()!
    processed.add(source)
    const sourceGraphDepth = graphDepth.get(source) ?? 0
    for (const target of outgoing.get(source) ?? []) {
      graphDepth.set(target, Math.max(graphDepth.get(target) ?? 0, sourceGraphDepth + 1))
      const nextIndegree = (indegree.get(target) ?? 1) - 1
      indegree.set(target, nextIndegree)
      if (nextIndegree === 0) {
        queue.push(target)
        queue.sort()
      }
    }
  }

  const fallbackNodeIds = new Set<string>()
  const calibratedDepth = new Map<string, number>()
  nodes.forEach((node) => {
    if (!processed.has(node.id)) {
      fallbackNodeIds.add(node.id)
      calibratedDepth.set(node.id, node.level)
    } else {
      calibratedDepth.set(node.id, Math.max(graphDepth.get(node.id) ?? 0, node.level))
    }
  })

  return {
    depthById: calibratedDepth,
    maxDepth: Math.max(1, ...calibratedDepth.values()),
    fallbackNodeIds,
  }
}

const sphereParameters = (options: ProjectionOptions): KnowledgeSphereParameters => {
  const candidate = { ...DEFAULT_KNOWLEDGE_SPHERE, ...options.sphere }
  return {
    coreRadius: Math.max(0.5, candidate.coreRadius),
    outerRadius: Math.max(candidate.coreRadius + 1, candidate.outerRadius),
    radialGamma: Math.max(0.1, candidate.radialGamma),
    radialJitter: clamp(candidate.radialJitter, 0, 0.35),
    globalAnchorWeight: clamp(candidate.globalAnchorWeight, 0.2, 0.35),
  }
}

const nodeRadius = (
  node: KnowledgeSpaceNode,
  depth: number,
  maxDepth: number,
  sphere: KnowledgeSphereParameters,
) => {
  const normalizedDepth = clamp01(depth / Math.max(1, maxDepth))
  const semanticRadius = sphere.coreRadius
    + (sphere.outerRadius - sphere.coreRadius) * normalizedDepth ** sphere.radialGamma
  return semanticRadius + stableSigned(`${node.id}:radial`) * sphere.radialJitter
}

const domainDirection = (node: KnowledgeSpaceNode): SpaceVector3 => {
  let total: SpaceVector3 = [0, 0, 0]
  node.domains.forEach((domain) => {
    const weight = domain === node.primaryDomain ? 1 : 0.68
    total = add(total, multiply(TETRAHEDRAL_DOMAIN_DIRECTIONS[domain], weight))
  })
  const tagDirection = node.tags.reduce<SpaceVector3>(
    (sum, tag) => add(sum, stableUnitVector(`tag:${tag}`)),
    [0, 0, 0],
  )
  total = add(total, multiply(normalize(tagDirection, stableUnitVector(node.id)), 0.16))
  return normalize(total, stableUnitVector(node.id))
}

interface FocusMembership {
  matched: ReadonlySet<string>
  prerequisites: ReadonlySet<string>
  bridges: ReadonlySet<string>
  visible: ReadonlySet<string>
}

const emptyMembership = (dataset: KnowledgeSpaceDataset): FocusMembership => {
  const all = new Set(dataset.nodes.map((node) => node.id))
  return { matched: all, prerequisites: new Set(), bridges: new Set(), visible: all }
}

const resolveFocusMembership = (
  dataset: KnowledgeSpaceDataset,
  focus: KnowledgeSpaceFocus | undefined,
): FocusMembership => {
  if (!focus) return emptyMembership(dataset)
  const hasSelector = focus.domain || focus.tags?.length || focus.nodeIds?.length
  if (!hasSelector) return emptyMembership(dataset)

  const explicitIds = focus.nodeIds ? new Set(focus.nodeIds) : undefined
  const matched = new Set(dataset.nodes.filter((node) => (
    (!focus.domain || node.domains.includes(focus.domain))
    && (!focus.tags?.length || focus.tags.some((tag) => node.tags.includes(tag)))
    && (!explicitIds || explicitIds.has(node.id))
  )).map((node) => node.id))
  const prerequisites = new Set<string>()
  if (focus.includePrerequisites !== false) {
    const incoming = new Map<string, string[]>()
    dataset.edges.filter((edge) => edge.type === 'prerequisite' && edge.prerequisiteKind !== 'recommended').forEach((edge) => {
      incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source])
    })
    const queue = [...matched].sort()
    while (queue.length) {
      const target = queue.shift()!
      for (const source of (incoming.get(target) ?? []).sort()) {
        if (matched.has(source) || prerequisites.has(source)) continue
        prerequisites.add(source)
        queue.push(source)
      }
    }
  }

  const bridges = new Set<string>()
  if (focus.includeBridges !== false) {
    const visibleCore = new Set([...matched, ...prerequisites])
    const nodeById = new Map(dataset.nodes.map((node) => [node.id, node]))
    dataset.edges
      .filter((edge) => edge.strength >= 0.78 && (edge.type === 'shared-model' || edge.type === 'application'))
      .forEach((edge) => {
        const source = nodeById.get(edge.source)
        const target = nodeById.get(edge.target)
        if (!source || !target) return
        const crossDomain = source.primaryDomain !== target.primaryDomain
          || source.domains.length > 1
          || target.domains.length > 1
        if (!crossDomain) return
        if (visibleCore.has(edge.source) && !visibleCore.has(edge.target)) bridges.add(edge.target)
        if (visibleCore.has(edge.target) && !visibleCore.has(edge.source)) bridges.add(edge.source)
      })
  }
  const visible = new Set([...matched, ...prerequisites, ...bridges])
  return { matched, prerequisites, bridges, visible }
}

const focusTargetDirections = (
  dataset: KnowledgeSpaceDataset,
  membership: FocusMembership,
  globalDirections: ReadonlyMap<string, SpaceVector3>,
  focus: KnowledgeSpaceFocus | undefined,
  defaultAnchorWeight: number,
) => {
  const result = new Map(globalDirections)
  if (!focus) return result
  const visibleNodes = dataset.nodes.filter((node) => membership.visible.has(node.id))
  const anchorWeight = clamp(focus.globalAnchorWeight ?? defaultAnchorWeight, 0.2, 0.35)
  const focusSignature = JSON.stringify({ domain: focus.domain, tags: focus.tags, nodeIds: focus.nodeIds })
  const phase = (stableHash(focusSignature) / 0xffffffff) * Math.PI * 2
  visibleNodes.forEach((node) => {
    const publicDirection = globalDirections.get(node.id) ?? stableUnitVector(node.id)
    const stableSlot = stableHash(`${focusSignature}:${node.id}`) % FOCUS_SLOT_COUNT
    const redistributed = fibonacciDirection(stableSlot, FOCUS_SLOT_COUNT, phase)
    result.set(node.id, normalize(add(
      multiply(publicDirection, anchorWeight),
      multiply(redistributed, 1 - anchorWeight),
    ), publicDirection))
  })
  return result
}

const connectedContext = (dataset: KnowledgeSpaceDataset, focusDomain: ScienceDomainId) => {
  const direct = new Set(dataset.nodes.filter((node) => node.domains.includes(focusDomain)).map((node) => node.id))
  const context = new Set<string>()
  dataset.edges.forEach((edge) => {
    if (direct.has(edge.source) && !direct.has(edge.target)) context.add(edge.target)
    if (direct.has(edge.target) && !direct.has(edge.source)) context.add(edge.source)
  })
  return context
}

const crossDomainIncidentNodes = (dataset: KnowledgeSpaceDataset) => {
  const nodeById = new Map(dataset.nodes.map((node) => [node.id, node]))
  const incident = new Set<string>()
  dataset.edges.forEach((edge) => {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)
    if (!source || !target) return
    if (source.primaryDomain !== target.primaryDomain || source.domains.length > 1 || target.domains.length > 1) {
      incident.add(source.id)
      incident.add(target.id)
    }
  })
  return incident
}

interface NodeVisualWeight {
  opacity: number
  emphasis: number
  scale: number
}

const visualWeightForNode = (
  node: KnowledgeSpaceNode,
  lens: KnowledgeLensDefinition,
  context: ReadonlySet<string>,
  crossDomainNodes: ReadonlySet<string>,
): NodeVisualWeight => {
  const importance = node.importance ?? 1
  if (lens.id === 'world') {
    const emphasis = clamp01(0.68 + (importance - 0.8) * 0.45)
    return { opacity: 0.92, emphasis, scale: 0.92 + emphasis * 0.13 }
  }
  if (lens.id === 'bridges') {
    const multiDomain = node.domains.length > 1
    const incident = crossDomainNodes.has(node.id)
    const emphasis = multiDomain ? 1 : incident ? 0.78 : 0.26
    return { opacity: multiDomain ? 1 : incident ? 0.8 : 0.22, emphasis, scale: multiDomain ? 1.16 : incident ? 0.98 : 0.78 }
  }
  const focusDomain = lens.focusDomains[0]
  const isPrimary = node.primaryDomain === focusDomain
  const isBridge = node.domains.includes(focusDomain)
  const isContext = context.has(node.id)
  const ownDomainWeight = lens.domainWeights[node.primaryDomain]
  const emphasis = isPrimary ? 1 : isBridge ? 0.9 : isContext ? 0.56 : ownDomainWeight * 0.35
  return {
    opacity: isPrimary ? 1 : isBridge ? 0.9 : isContext ? 0.56 : 0.16 + ownDomainWeight * 0.18,
    emphasis,
    scale: isPrimary ? 1.14 : isBridge ? 1.04 : isContext ? 0.9 : 0.72 + ownDomainWeight * 0.12,
  }
}

interface MutableProjectedNode extends ProjectedKnowledgeNode {
  position: [number, number, number]
}

const addForce = (forces: [number, number, number][], index: number, force: SpaceVector3) => {
  forces[index][0] += force[0]
  forces[index][1] += force[1]
  forces[index][2] += force[2]
}

const forEachNearbyPair = (
  nodes: readonly MutableProjectedNode[],
  cellSize: number,
  visit: (leftIndex: number, rightIndex: number) => void,
) => {
  const cells = new Map<string, number[]>()
  const coordinates: [number, number, number][] = nodes.map((node, index) => {
    const coordinate: [number, number, number] = [
      Math.floor(node.position[0] / cellSize),
      Math.floor(node.position[1] / cellSize),
      Math.floor(node.position[2] / cellSize),
    ]
    if (!node.visible) return coordinate
    const key = coordinate.join(':')
    const members = cells.get(key)
    if (members) members.push(index)
    else cells.set(key, [index])
    return coordinate
  })

  nodes.forEach((left, leftIndex) => {
    if (!left.visible) return
    const [cellX, cellY, cellZ] = coordinates[leftIndex]
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
          const candidates = cells.get(`${cellX + offsetX}:${cellY + offsetY}:${cellZ + offsetZ}`) ?? []
          candidates.forEach((rightIndex) => {
            if (rightIndex > leftIndex) visit(leftIndex, rightIndex)
          })
        }
      }
    }
  })
}

/** Three-dimensional constrained relaxation with tangential semantic forces. */
const relaxKnowledgeSphere = (
  input: readonly ProjectedKnowledgeNode[],
  targetDirections: ReadonlyMap<string, SpaceVector3>,
  lens: KnowledgeLensDefinition,
  dataset: KnowledgeSpaceDataset,
  padding: number,
  iterations: number,
): readonly ProjectedKnowledgeNode[] => {
  const nodes: MutableProjectedNode[] = input.map((item) => ({ ...item, position: [...item.position] }))
  const indexById = new Map(nodes.map((item, index) => [item.node.id, index]))
  const tagSets = nodes.map((item) => new Set(item.node.tags))
  const tagPairs: [number, number, number][] = []
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      let sharedTags = 0
      tagSets[leftIndex].forEach((tag) => {
        if (tagSets[rightIndex].has(tag)) sharedTags += 1
      })
      if (sharedTags) tagPairs.push([leftIndex, rightIndex, sharedTags])
    }
  }
  const collisionCellSize = KNOWLEDGE_NODE_COLLISION_RADIUS * 2.5 + padding

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const forces: [number, number, number][] = nodes.map(() => [0, 0, 0])

    dataset.edges.forEach((edge) => {
      const sourceIndex = indexById.get(edge.source)
      const targetIndex = indexById.get(edge.target)
      if (sourceIndex === undefined || targetIndex === undefined) return
      const source = nodes[sourceIndex]
      const target = nodes[targetIndex]
      if (!source.visible || !target.visible) return
      const delta = subtract(target.position, source.position)
      const distance = Math.max(EPSILON, length(delta))
      const desired = Math.abs(source.radius - target.radius) + 2.7
      if (distance <= desired) return
      const relationWeight = lens.relationWeights[edge.type]
      const magnitude = (distance - desired) * edge.strength * relationWeight * 0.012
      const direction = multiply(delta, magnitude / distance)
      addForce(forces, sourceIndex, tangentComponent(direction, normalize(source.position)))
      addForce(forces, targetIndex, tangentComponent(multiply(direction, -1), normalize(target.position)))
    })

    forEachNearbyPair(nodes, collisionCellSize, (leftIndex, rightIndex) => {
        const left = nodes[leftIndex]
        const right = nodes[rightIndex]
        const delta = subtract(right.position, left.position)
        let distance = length(delta)
        let unit = distance > EPSILON ? multiply(delta, 1 / distance) : stableUnitVector(`${left.node.id}:${right.node.id}`)
        if (distance <= EPSILON) distance = EPSILON

        const minimum = KNOWLEDGE_NODE_COLLISION_RADIUS * (left.scale + right.scale) + padding
        if (distance < minimum) {
          const repulsion = multiply(unit, (minimum - distance) * 0.72)
          addForce(forces, leftIndex, multiply(repulsion, -1))
          addForce(forces, rightIndex, repulsion)
        }
    })

    tagPairs.forEach(([leftIndex, rightIndex, sharedTags]) => {
      const left = nodes[leftIndex]
      const right = nodes[rightIndex]
      if (!left.visible || !right.visible) return
      const delta = subtract(right.position, left.position)
      const distance = Math.max(EPSILON, length(delta))
      const minimum = KNOWLEDGE_NODE_COLLISION_RADIUS * (left.scale + right.scale) + padding
      if (distance <= minimum * 1.35) return
      const unit = multiply(delta, 1 / distance)
      const attraction = multiply(unit, Math.min(0.055, sharedTags * 0.009 * (distance - minimum)))
      addForce(forces, leftIndex, tangentComponent(attraction, normalize(left.position)))
      addForce(forces, rightIndex, tangentComponent(multiply(attraction, -1), normalize(right.position)))
    })

    nodes.forEach((node, index) => {
      if (!node.visible) return
      const radialUnit = normalize(node.position, targetDirections.get(node.node.id))
      const targetDirection = targetDirections.get(node.node.id) ?? radialUnit
      const angularError = tangentComponent(subtract(targetDirection, radialUnit), radialUnit)
      addForce(forces, index, multiply(angularError, 0.12))
      addForce(forces, index, multiply(radialUnit, (node.radius - length(node.position)) * 0.22))
    })

    const progress = iteration / Math.max(1, iterations - 1)
    const step = lerp(0.42, 0.12, progress)
    nodes.forEach((node, index) => {
      if (!node.visible) return
      const moved = add(node.position, multiply(forces[index], step))
      const currentRadius = length(moved)
      const boundedRadius = clamp(currentRadius, node.radius - 0.28, node.radius + 0.28)
      node.position = [...multiply(normalize(moved, targetDirections.get(node.node.id)), boundedRadius)]
    })
  }

  nodes.forEach((node) => {
    if (!node.visible) return
    node.position = [...multiply(normalize(node.position), node.radius)]
  })

  // Final spherical packing pass removes residual overlaps without changing semantic radius.
  for (let pass = 0; pass < MAX_PACKING_PASSES; pass += 1) {
    let maximumOverlap = 0
    forEachNearbyPair(nodes, collisionCellSize, (leftIndex, rightIndex) => {
      const left = nodes[leftIndex]
      const right = nodes[rightIndex]
      const delta = subtract(right.position, left.position)
      const distance = length(delta)
      const minimum = KNOWLEDGE_NODE_COLLISION_RADIUS * (left.scale + right.scale) + padding
      const overlap = minimum - distance
      if (overlap <= 0) return
      maximumOverlap = Math.max(maximumOverlap, overlap)
      const pairUnit = normalize(delta, stableUnitVector(`${left.node.id}:${right.node.id}:packing`))
      const leftRadial = normalize(left.position)
      const rightRadial = normalize(right.position)
      const fallback = stableUnitVector(`${left.node.id}:${right.node.id}:tangent`)
      const leftTangent = normalize(tangentComponent(multiply(pairUnit, -1), leftRadial), tangentComponent(fallback, leftRadial))
      const rightTangent = normalize(tangentComponent(pairUnit, rightRadial), tangentComponent(multiply(fallback, -1), rightRadial))
      const displacement = overlap * 0.42
      left.position = [...multiply(normalize(add(left.position, multiply(leftTangent, displacement))), left.radius)]
      right.position = [...multiply(normalize(add(right.position, multiply(rightTangent, displacement))), right.radius)]
    })
    if (maximumOverlap < 0.01) break
  }
  return nodes
}

const projectFields = (
  dataset: KnowledgeSpaceDataset,
  nodes: readonly ProjectedKnowledgeNode[],
  lens: KnowledgeLensDefinition,
): readonly ProjectedKnowledgeField[] => {
  const buildField = ({
    id,
    kind,
    label,
    color,
    members,
    opacity,
    domain,
    tag,
  }: {
    id: string
    kind: ProjectedKnowledgeField['kind']
    label: string
    color: string
    members: readonly ProjectedKnowledgeNode[]
    opacity: number
    domain?: ScienceDomainDefinition
    tag?: string
  }): ProjectedKnowledgeField => {
    const visibleMembers = members.filter((item) => item.visible)
    const weightSum = visibleMembers.reduce((sum, item) => sum + item.opacity * item.emphasis, 0) || 1
    const center: SpaceVector3 = visibleMembers.length
      ? [
          visibleMembers.reduce((sum, item) => sum + item.position[0] * item.opacity * item.emphasis, 0) / weightSum,
          visibleMembers.reduce((sum, item) => sum + item.position[1] * item.opacity * item.emphasis, 0) / weightSum,
          visibleMembers.reduce((sum, item) => sum + item.position[2] * item.opacity * item.emphasis, 0) / weightSum,
        ]
      : [0, 0, 0]
    const lobes = members.map((item) => ({
      nodeId: item.node.id,
      center: item.position,
      radius: kind === 'domain' ? 2.7 + item.scale * 0.9 : 2.1 + item.scale * 0.72,
      opacity: item.visible ? item.opacity * (0.62 + item.emphasis * 0.38) : 0,
    }))
    const radius = visibleMembers.reduce((distance, item) => {
      const lobe = lobes.find((candidate) => candidate.nodeId === item.node.id)
      return Math.max(distance, length(subtract(item.position, center)) + (lobe?.radius ?? 0))
    }, 0)
    return {
      id,
      kind,
      label,
      color,
      domain,
      tag,
      center,
      radius,
      opacity: visibleMembers.length ? opacity : 0,
      lobes,
    }
  }

  const domainFields = dataset.domains.map((domain) => {
    const members = nodes.filter(({ node }) => node.domains.includes(domain.id))
    const focused = lens.id === 'world' || lens.focusDomains.includes(domain.id)
    const opacity = lens.id === 'bridges'
      ? 0.065
      : focused
        ? 0.105
        : 0.022 + lens.domainWeights[domain.id] * 0.034
    return buildField({
      id: `domain:${domain.id}`,
      kind: 'domain',
      label: domain.label,
      color: domain.fieldColor,
      domain,
      members,
      opacity,
    })
  })

  const tagMembers = new Map<string, ProjectedKnowledgeNode[]>()
  nodes.forEach((item) => item.node.tags.forEach((tag) => {
    tagMembers.set(tag, [...(tagMembers.get(tag) ?? []), item])
  }))
  const tagFields = [...tagMembers.entries()]
    .filter(([, members]) => members.length >= 2)
    .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
    .map(([tag, members]) => buildField({
      id: `tag:${tag}`,
      kind: 'tag',
      label: `#${tag}`,
      color: TAG_FIELD_COLORS[stableHash(tag) % TAG_FIELD_COLORS.length],
      tag,
      members,
      opacity: lens.id === 'world' ? 0.044 : 0.032,
    }))

  return [...domainFields, ...tagFields]
}

const projectionVisibility = (
  nodeId: string,
  focus: KnowledgeSpaceFocus | undefined,
  membership: FocusMembership,
) => {
  if (!focus) return 'context' as const
  if (membership.matched.has(nodeId)) return 'matched' as const
  if (membership.prerequisites.has(nodeId)) return 'prerequisite' as const
  if (membership.bridges.has(nodeId)) return 'bridge' as const
  return 'hidden' as const
}

export const projectKnowledgeDataset = (
  dataset: KnowledgeSpaceDataset,
  lensId: KnowledgeLensId,
  options: ProjectionOptions = {},
): KnowledgeSpaceProjection => {
  const lens = findLens(dataset, lensId)
  const sphere = sphereParameters(options)
  const depths = computeKnowledgeDepths(dataset)
  const domainFocus: KnowledgeSpaceFocus | undefined = options.domainFilter && options.filterMode !== 'none'
    ? {
        domain: options.domainFilter,
        includePrerequisites: options.filterMode === 'focus',
        includeBridges: options.filterMode === 'focus',
      }
    : undefined
  const effectiveFocus = options.focus ?? domainFocus
  const redistributeFocus = options.focus ?? (options.filterMode === 'focus' ? domainFocus : undefined)
  const temporaryFilter = Boolean(domainFocus && options.filterMode === 'temporary' && !options.focus)
  const membership = resolveFocusMembership(dataset, effectiveFocus)
  const globalDirections = new Map(dataset.nodes.map((node) => [node.id, domainDirection(node)]))
  const targetDirections = focusTargetDirections(
    dataset,
    membership,
    globalDirections,
    redistributeFocus,
    sphere.globalAnchorWeight,
  )
  const focusDomain = lens.id !== 'world' && lens.id !== 'bridges' ? lens.focusDomains[0] : undefined
  const context = focusDomain ? connectedContext(dataset, focusDomain) : new Set<string>()
  const crossDomainNodes = crossDomainIncidentNodes(dataset)

  const rawNodes = dataset.nodes.map((node): ProjectedKnowledgeNode => {
    const radius = nodeRadius(node, depths.depthById.get(node.id) ?? node.level, depths.maxDepth, sphere)
    const direction = targetDirections.get(node.id) ?? globalDirections.get(node.id) ?? stableUnitVector(node.id)
    const visibility = projectionVisibility(node.id, effectiveFocus, membership)
    const visible = visibility !== 'hidden'
    const lensVisual = visualWeightForNode(node, lens, context, crossDomainNodes)
    const focusVisual: NodeVisualWeight = visibility === 'matched'
      ? { opacity: 1, emphasis: 1, scale: Math.max(1.03, lensVisual.scale) }
      : visibility === 'prerequisite'
        ? { opacity: 0.78, emphasis: 0.7, scale: 0.92 }
        : visibility === 'bridge'
          ? { opacity: 0.62, emphasis: 0.58, scale: 0.86 }
          : lensVisual
    const layoutVisual = temporaryFilter ? lensVisual : focusVisual
    return {
      node,
      position: multiply(direction, radius),
      opacity: temporaryFilter ? layoutVisual.opacity : visible ? focusVisual.opacity : 0,
      scale: temporaryFilter ? layoutVisual.scale : visible ? focusVisual.scale : 0.72,
      emphasis: temporaryFilter ? layoutVisual.emphasis : visible ? focusVisual.emphasis : 0,
      knowledgeDepth: depths.depthById.get(node.id) ?? node.level,
      radius,
      visible: temporaryFilter ? true : visible,
      interactive: temporaryFilter ? true : visible,
      visibility,
    }
  })

  const relaxedNodes = relaxKnowledgeSphere(
    rawNodes,
    targetDirections,
    lens,
    dataset,
    options.collisionPadding ?? DEFAULT_COLLISION_PADDING,
    options.relaxationIterations ?? DEFAULT_RELAXATION_ITERATIONS,
  )
  const nodes = temporaryFilter
    ? relaxedNodes.map((item): ProjectedKnowledgeNode => {
        const visibility = projectionVisibility(item.node.id, effectiveFocus, membership)
        const visible = visibility !== 'hidden'
        return {
          ...item,
          opacity: visible ? item.opacity : 0,
          emphasis: visible ? item.emphasis : 0,
          visible,
          interactive: visible,
          visibility,
        }
      })
    : relaxedNodes
  const projectedById = new Map(nodes.map((item) => [item.node.id, item]))
  const edges: readonly ProjectedKnowledgeEdge[] = dataset.edges.map((edge) => {
    const source = projectedById.get(edge.source)
    const target = projectedById.get(edge.target)
    const endpointVisibility = Math.min(source?.opacity ?? 0, target?.opacity ?? 0)
    const emphasis = clamp01(edge.strength * lens.relationWeights[edge.type] * (0.6 + endpointVisibility * 0.4))
    return {
      edge,
      emphasis,
      opacity: source?.visible && target?.visible
        ? clamp01(endpointVisibility * emphasis * (lens.id === 'world' ? 0.78 : 0.92))
        : 0,
    }
  })
  return { lens, sphere, nodes, edges, fields: projectFields(dataset, nodes, lens) }
}

const publicProjectionCache = new Map<string, KnowledgeSpaceProjection>()

export const projectKnowledgeSpace = (
  lensId: KnowledgeLensId,
  options?: ProjectionOptions,
): KnowledgeSpaceProjection => {
  const normalizedOptions = options ?? {}
  const cacheKey = `${lensId}:${JSON.stringify(normalizedOptions)}`
  const cached = publicProjectionCache.get(cacheKey)
  if (cached) return cached
  const projection = projectKnowledgeDataset(defaultDataset(), lensId, normalizedOptions)
  publicProjectionCache.set(cacheKey, projection)
  return projection
}

export const projectFocusedKnowledgeSpace = (
  focus: KnowledgeSpaceFocus,
  lensId: KnowledgeLensId = 'world',
  options: Omit<ProjectionOptions, 'focus'> = {},
): KnowledgeSpaceProjection => projectKnowledgeSpace(lensId, { ...options, focus })

/** Interpolates projections while preserving node identity and semantic radii. */
export const interpolateKnowledgeProjections = (
  from: KnowledgeSpaceProjection,
  to: KnowledgeSpaceProjection,
  progress: number,
): KnowledgeSpaceProjection => {
  const amount = clamp01(progress)
  const eased = amount * amount * (3 - 2 * amount)
  const fromNodes = new Map(from.nodes.map((item) => [item.node.id, item]))
  const fromEdges = new Map(from.edges.map((item) => [item.edge.id, item]))
  const fromFields = new Map(from.fields.map((item) => [item.id, item]))
  return {
    lens: to.lens,
    sphere: to.sphere,
    nodes: to.nodes.map((target) => {
      const source = fromNodes.get(target.node.id) ?? target
      return {
        ...target,
        position: vectorLerp(source.position, target.position, eased),
        opacity: lerp(source.opacity, target.opacity, eased),
        scale: lerp(source.scale, target.scale, eased),
        emphasis: lerp(source.emphasis, target.emphasis, eased),
        visible: amount >= 1 ? target.visible : source.visible || target.visible,
        interactive: amount >= 1 ? target.interactive : source.interactive && target.interactive,
      }
    }),
    edges: to.edges.map((target) => {
      const source = fromEdges.get(target.edge.id) ?? target
      return { edge: target.edge, opacity: lerp(source.opacity, target.opacity, eased), emphasis: lerp(source.emphasis, target.emphasis, eased) }
    }),
    fields: to.fields.map((target) => {
      const source = fromFields.get(target.id) ?? target
      const sourceLobes = new Map(source.lobes.map((lobe) => [lobe.nodeId, lobe]))
      return {
        ...target,
        center: vectorLerp(source.center, target.center, eased),
        radius: lerp(source.radius, target.radius, eased),
        opacity: lerp(source.opacity, target.opacity, eased),
        lobes: target.lobes.map((targetLobe) => {
          const sourceLobe = sourceLobes.get(targetLobe.nodeId) ?? targetLobe
          return {
            ...targetLobe,
            center: vectorLerp(sourceLobe.center, targetLobe.center, eased),
            radius: lerp(sourceLobe.radius, targetLobe.radius, eased),
            opacity: lerp(sourceLobe.opacity, targetLobe.opacity, eased),
          }
        }),
      }
    }),
  }
}

export interface KnowledgeDatasetValidation {
  valid: boolean
  errors: readonly string[]
  warnings: readonly string[]
  stats: { domains: number; nodes: number; edges: number; lenses: number; crossDomainNodes: number; crossDomainEdges: number }
}

export const validateKnowledgeSpaceDataset = (
  dataset: KnowledgeSpaceDataset = defaultDataset(),
): KnowledgeDatasetValidation => {
  const errors: string[] = []
  const warnings: string[] = []
  const domainIds = new Set<ScienceDomainId>()
  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()
  const lensIds = new Set<KnowledgeLensId>()
  dataset.domains.forEach((domain) => {
    if (domainIds.has(domain.id)) errors.push(`Duplicate domain id: ${domain.id}`)
    domainIds.add(domain.id)
  })
  DOMAIN_ORDER.forEach((domain) => { if (!domainIds.has(domain)) errors.push(`Missing required domain: ${domain}`) })
  dataset.nodes.forEach((node) => {
    if (nodeIds.has(node.id)) errors.push(`Duplicate node id: ${node.id}`)
    nodeIds.add(node.id)
    if (!node.domains.length) errors.push(`Node ${node.id} has no domains`)
    if (!node.domains.includes(node.primaryDomain)) errors.push(`Node ${node.id} primary domain is not in domains`)
    node.domains.forEach((domain) => { if (!domainIds.has(domain)) errors.push(`Node ${node.id} references unknown domain ${domain}`) })
    if (!node.title.trim() || !node.englishTitle.trim()) errors.push(`Node ${node.id} has an empty title`)
  })
  dataset.edges.forEach((edge) => {
    if (edgeIds.has(edge.id)) errors.push(`Duplicate edge id: ${edge.id}`)
    edgeIds.add(edge.id)
    if (!nodeIds.has(edge.source)) errors.push(`Edge ${edge.id} references unknown source ${edge.source}`)
    if (!nodeIds.has(edge.target)) errors.push(`Edge ${edge.id} references unknown target ${edge.target}`)
    if (edge.source === edge.target) errors.push(`Edge ${edge.id} cannot reference itself`)
    if (!Number.isFinite(edge.strength) || edge.strength < 0 || edge.strength > 1) errors.push(`Edge ${edge.id} strength must be between 0 and 1`)
    if (edge.prerequisiteKind && edge.type !== 'prerequisite') errors.push(`Edge ${edge.id} declares prerequisiteKind without prerequisite type`)
  })
  const depthResult = computeKnowledgeDepths(dataset)
  if (depthResult.fallbackNodeIds.size) {
    errors.push(`Strict prerequisite cycle affects: ${[...depthResult.fallbackNodeIds].sort().join(', ')}`)
  }
  dataset.lenses.forEach((lens) => {
    if (lensIds.has(lens.id)) errors.push(`Duplicate lens id: ${lens.id}`)
    lensIds.add(lens.id)
    DOMAIN_ORDER.forEach((domain) => {
      const weight = lens.domainWeights[domain]
      if (!Number.isFinite(weight) || weight < 0 || weight > 1) errors.push(`Lens ${lens.id} has invalid ${domain} weight`)
    })
    const relations: readonly KnowledgeRelationType[] = ['prerequisite', 'application', 'analogy', 'historical', 'shared-model']
    relations.forEach((relation) => {
      const weight = lens.relationWeights[relation]
      if (!Number.isFinite(weight) || weight < 0 || weight > 1) errors.push(`Lens ${lens.id} has invalid ${relation} weight`)
    })
  })
  const requiredLenses: readonly KnowledgeLensId[] = ['world', 'mathematics', 'physics', 'chemistry', 'biology', 'bridges']
  requiredLenses.forEach((lens) => { if (!lensIds.has(lens)) errors.push(`Missing required lens: ${lens}`) })
  const nodeById = new Map(dataset.nodes.map((node) => [node.id, node]))
  const crossDomainEdges = dataset.edges.filter((edge) => {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)
    return source && target && source.primaryDomain !== target.primaryDomain
  }).length
  const domainCounts = new Map<ScienceDomainId, number>()
  dataset.nodes.forEach((node) => domainCounts.set(node.primaryDomain, (domainCounts.get(node.primaryDomain) ?? 0) + 1))
  DOMAIN_ORDER.forEach((domain) => { if ((domainCounts.get(domain) ?? 0) < 8) warnings.push(`Domain ${domain} has fewer than 8 primary nodes`) })
  if (crossDomainEdges < 10) warnings.push('Fewer than 10 explicit cross-domain edges')
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      domains: dataset.domains.length,
      nodes: dataset.nodes.length,
      edges: dataset.edges.length,
      lenses: dataset.lenses.length,
      crossDomainNodes: dataset.nodes.filter((node) => node.domains.length > 1).length,
      crossDomainEdges,
    },
  }
}
