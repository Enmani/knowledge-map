import type {
  KnowledgeRelationType,
  KnowledgeSpaceDataset,
  KnowledgeSphereParameters,
  SpaceVector3,
} from './types'

const EPSILON = 1e-9
const SPECTRAL_ITERATIONS = 72
const TAG_AFFINITY = 0.12
const DOMAIN_AFFINITY = 0.035
const PRIMARY_DOMAIN_AFFINITY = 0.025
const FOUNDATION_DEPTH_WEIGHT = 0.72
const FOUNDATION_DECAY = 0.55
const STRICT_RADIAL_MARGIN = 0.018
const HYPERBOLIC_BOUNDARY_RATIO = 0.94

export const SEMANTIC_RELATION_AFFINITY: Readonly<Record<KnowledgeRelationType, number>> = {
  prerequisite: 1,
  'shared-model': 0.85,
  application: 0.65,
  analogy: 0.35,
  historical: 0.2,
}

export interface SemanticStressPair {
  leftIndex: number
  rightIndex: number
  targetDistance: number
  weight: number
}

export interface SemanticLayoutNode {
  nodeId: string
  direction: SpaceVector3
  radius: number
  foundationScore: number
}

export interface SemanticKnowledgeLayout {
  nodes: readonly SemanticLayoutNode[]
  nodeById: ReadonlyMap<string, SemanticLayoutNode>
  stressPairs: readonly SemanticStressPair[]
  poincareBoundary: number
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value))

const stableHash = (input: string): number => {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const stableSigned = (input: string) => stableHash(input) / 0xffffffff * 2 - 1

const vectorLength = (value: readonly number[]) => Math.hypot(...value)

const normalizeVector = (value: readonly number[], fallback: SpaceVector3 = [1, 0, 0]): SpaceVector3 => {
  const magnitude = vectorLength(value)
  if (magnitude <= EPSILON) return fallback
  return [value[0] / magnitude, value[1] / magnitude, value[2] / magnitude]
}

const dotVector = (left: Float64Array, right: Float64Array) => {
  let result = 0
  for (let index = 0; index < left.length; index += 1) result += left[index] * right[index]
  return result
}

const normalizeDenseVector = (value: Float64Array) => {
  const magnitude = Math.sqrt(Math.max(EPSILON, dotVector(value, value)))
  for (let index = 0; index < value.length; index += 1) value[index] /= magnitude
  return value
}

const subtractProjection = (value: Float64Array, basis: Float64Array) => {
  const projection = dotVector(value, basis)
  for (let index = 0; index < value.length; index += 1) value[index] -= projection * basis[index]
}

const jaccard = (left: ReadonlySet<string>, right: ReadonlySet<string>) => {
  let intersection = 0
  left.forEach((value) => { if (right.has(value)) intersection += 1 })
  const union = left.size + right.size - intersection
  return union ? intersection / union : 0
}

const cosineMembership = (left: ReadonlySet<string>, right: ReadonlySet<string>) => {
  let intersection = 0
  left.forEach((value) => { if (right.has(value)) intersection += 1 })
  return intersection / Math.sqrt(Math.max(1, left.size * right.size))
}

const pairOffset = (size: number, left: number, right: number) => left * size + right

const relationAffinity = (
  type: KnowledgeRelationType,
  prerequisiteKind: 'strict' | 'recommended' | undefined,
  strength: number,
) => {
  const typeWeight = type === 'prerequisite' && prerequisiteKind === 'recommended'
    ? 0.55
    : SEMANTIC_RELATION_AFFINITY[type]
  return clamp(typeWeight * strength, 0, 0.995)
}

const buildAffinityMatrix = (dataset: KnowledgeSpaceDataset) => {
  const size = dataset.nodes.length
  const affinity = new Float64Array(size * size)
  const indexById = new Map(dataset.nodes.map((node, index) => [node.id, index]))
  const tagSets = dataset.nodes.map((node) => new Set(node.tags))
  const domainSets = dataset.nodes.map((node) => new Set(node.domains))

  for (let left = 0; left < size; left += 1) {
    for (let right = left + 1; right < size; right += 1) {
      const tagSimilarity = jaccard(tagSets[left], tagSets[right])
      const domainSimilarity = cosineMembership(domainSets[left], domainSets[right])
      const samePrimaryDomain = dataset.nodes[left].primaryDomain === dataset.nodes[right].primaryDomain
      const combined = 1
        - (1 - TAG_AFFINITY * tagSimilarity)
        * (1 - DOMAIN_AFFINITY * domainSimilarity)
        * (1 - (samePrimaryDomain ? PRIMARY_DOMAIN_AFFINITY : 0))
      affinity[pairOffset(size, left, right)] = combined
      affinity[pairOffset(size, right, left)] = combined
    }
  }

  dataset.edges.forEach((edge) => {
    const left = indexById.get(edge.source)
    const right = indexById.get(edge.target)
    if (left === undefined || right === undefined) return
    const edgeAffinity = relationAffinity(edge.type, edge.prerequisiteKind, edge.strength)
    const offset = pairOffset(size, left, right)
    const combined = 1 - (1 - affinity[offset]) * (1 - edgeAffinity)
    affinity[offset] = combined
    affinity[pairOffset(size, right, left)] = combined
  })

  return affinity
}

const multiplyNormalizedAffinity = (
  affinity: Float64Array,
  degrees: Float64Array,
  value: Float64Array,
) => {
  const size = degrees.length
  const result = new Float64Array(size)
  for (let left = 0; left < size; left += 1) {
    let sum = 0
    const leftDegree = Math.sqrt(Math.max(EPSILON, degrees[left]))
    for (let right = 0; right < size; right += 1) {
      const pairAffinity = affinity[pairOffset(size, left, right)]
      if (pairAffinity <= EPSILON) continue
      sum += pairAffinity * value[right] / (leftDegree * Math.sqrt(Math.max(EPSILON, degrees[right])))
    }
    result[left] = sum
  }
  return result
}

const spectralDirections = (dataset: KnowledgeSpaceDataset, affinity: Float64Array): readonly SpaceVector3[] => {
  const size = dataset.nodes.length
  const degrees = new Float64Array(size)
  for (let left = 0; left < size; left += 1) {
    let degree = 0
    for (let right = 0; right < size; right += 1) degree += affinity[pairOffset(size, left, right)]
    degrees[left] = Math.max(EPSILON, degree)
  }

  const trivial = normalizeDenseVector(Float64Array.from(degrees, (degree) => Math.sqrt(degree)))
  const eigenvectors: Float64Array[] = []

  for (let component = 0; component < 3; component += 1) {
    const seed = Float64Array.from(dataset.nodes, (node) => stableSigned(`${node.id}:spectral:${component}`))
    subtractProjection(seed, trivial)
    eigenvectors.forEach((basis) => subtractProjection(seed, basis))
    let vector = normalizeDenseVector(seed)

    for (let iteration = 0; iteration < SPECTRAL_ITERATIONS; iteration += 1) {
      const next = multiplyNormalizedAffinity(affinity, degrees, vector)
      // Shift the normalized adjacency spectrum from [-1, 1] to [0, 1]. This
      // preserves eigenvectors while preventing a bipartite graph's negative
      // mode from winning ordinary power iteration by absolute magnitude.
      for (let index = 0; index < size; index += 1) next[index] = (next[index] + vector[index]) * 0.5
      subtractProjection(next, trivial)
      eigenvectors.forEach((basis) => subtractProjection(next, basis))
      normalizeDenseVector(next)
      if (dotVector(next, vector) < 0) {
        for (let index = 0; index < size; index += 1) next[index] *= -1
      }
      vector = next
    }

    if (dotVector(vector, seed) < 0) {
      for (let index = 0; index < size; index += 1) vector[index] *= -1
    }
    eigenvectors.push(vector)
  }

  return dataset.nodes.map((node, index) => normalizeVector(
    [eigenvectors[0][index], eigenvectors[1][index], eigenvectors[2][index]],
    normalizeVector([
      stableSigned(`${node.id}:fallback:x`),
      stableSigned(`${node.id}:fallback:y`),
      stableSigned(`${node.id}:fallback:z`),
    ]),
  ))
}

const foundationScores = (dataset: KnowledgeSpaceDataset) => {
  const indexById = new Map(dataset.nodes.map((node, index) => [node.id, index]))
  const outgoing = dataset.nodes.map(() => [] as number[])
  dataset.edges.forEach((edge) => {
    if (edge.type !== 'prerequisite' || edge.prerequisiteKind === 'recommended') return
    const source = indexById.get(edge.source)
    const target = indexById.get(edge.target)
    if (source === undefined || target === undefined) return
    outgoing[source].push(target)
  })
  outgoing.forEach((targets) => targets.sort((left, right) => left - right))

  const raw = dataset.nodes.map((_, start) => {
    const distance = new Map<number, number>()
    const queue: Array<readonly [number, number]> = outgoing[start].map((target) => [target, 1] as const)
    let head = 0
    while (head < queue.length) {
      const [current, currentDistance] = queue[head]
      head += 1
      const known = distance.get(current)
      if (known !== undefined && known <= currentDistance) continue
      distance.set(current, currentDistance)
      outgoing[current].forEach((target) => queue.push([target, currentDistance + 1]))
    }
    let score = 0
    distance.forEach((steps) => { score += Math.exp(-FOUNDATION_DECAY * (steps - 1)) })
    return Math.log1p(score)
  })
  const maximum = Math.max(EPSILON, ...raw)
  return raw.map((score) => score / maximum)
}

const enforceStrictRadialOrder = (
  dataset: KnowledgeSpaceDataset,
  progress: number[],
  fallbackNodeIds: ReadonlySet<string>,
) => {
  const indexById = new Map(dataset.nodes.map((node, index) => [node.id, index]))
  const strictEdges = dataset.edges
    .filter((edge) => edge.type === 'prerequisite' && edge.prerequisiteKind !== 'recommended')
    .map((edge) => [indexById.get(edge.source), indexById.get(edge.target)] as const)
    .filter((pair): pair is readonly [number, number] => pair[0] !== undefined && pair[1] !== undefined)
    .filter(([source, target]) => (
      !fallbackNodeIds.has(dataset.nodes[source].id)
      && !fallbackNodeIds.has(dataset.nodes[target].id)
    ))

  for (let pass = 0; pass < dataset.nodes.length; pass += 1) {
    let changed = false
    strictEdges.forEach(([source, target]) => {
      const minimum = Math.min(1, progress[source] + STRICT_RADIAL_MARGIN)
      if (progress[target] + EPSILON >= minimum) return
      progress[target] = minimum
      changed = true
    })
    if (!changed) break
  }
}

const radialLayout = (
  dataset: KnowledgeSpaceDataset,
  depthById: ReadonlyMap<string, number>,
  maxDepth: number,
  sphere: KnowledgeSphereParameters,
  fallbackNodeIds: ReadonlySet<string>,
) => {
  const foundation = foundationScores(dataset)
  const progress = dataset.nodes.map((node, index) => {
    const normalizedDepth = clamp((depthById.get(node.id) ?? node.level) / Math.max(1, maxDepth), 0, 1)
    const semanticProgress = FOUNDATION_DEPTH_WEIGHT * normalizedDepth
      + (1 - FOUNDATION_DEPTH_WEIGHT) * (1 - foundation[index])
    const jitter = stableSigned(`${node.id}:semantic-radial`) * sphere.radialJitter
      / Math.max(1, sphere.outerRadius - sphere.coreRadius)
    return clamp(semanticProgress + jitter, 0, 1)
  })
  enforceStrictRadialOrder(dataset, progress, fallbackNodeIds)

  return {
    foundation,
    radii: progress.map((value) => (
      sphere.coreRadius
      + (sphere.outerRadius - sphere.coreRadius) * value ** sphere.radialGamma
    )),
  }
}

const quantile = (values: readonly number[], fraction: number) => {
  if (!values.length) return 1
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))]
}

const stressPairs = (affinity: Float64Array, size: number): readonly SemanticStressPair[] => {
  const distance = new Float64Array(size * size)
  distance.fill(Number.POSITIVE_INFINITY)
  for (let index = 0; index < size; index += 1) distance[pairOffset(size, index, index)] = 0
  for (let left = 0; left < size; left += 1) {
    for (let right = left + 1; right < size; right += 1) {
      const pairAffinity = affinity[pairOffset(size, left, right)]
      if (pairAffinity <= EPSILON) continue
      const cost = 0.3 - Math.log(pairAffinity + EPSILON)
      distance[pairOffset(size, left, right)] = cost
      distance[pairOffset(size, right, left)] = cost
    }
  }

  for (let middle = 0; middle < size; middle += 1) {
    for (let left = 0; left < size; left += 1) {
      const leftToMiddle = distance[pairOffset(size, left, middle)]
      if (!Number.isFinite(leftToMiddle)) continue
      for (let right = 0; right < size; right += 1) {
        const throughMiddle = leftToMiddle + distance[pairOffset(size, middle, right)]
        const offset = pairOffset(size, left, right)
        if (throughMiddle < distance[offset]) distance[offset] = throughMiddle
      }
    }
  }

  const finiteDistances: number[] = []
  for (let left = 0; left < size; left += 1) {
    for (let right = left + 1; right < size; right += 1) {
      const value = distance[pairOffset(size, left, right)]
      if (Number.isFinite(value)) finiteDistances.push(value)
    }
  }
  const scale = Math.max(EPSILON, quantile(finiteDistances, 0.9))

  const result: SemanticStressPair[] = []
  for (let left = 0; left < size; left += 1) {
    for (let right = left + 1; right < size; right += 1) {
      const graphDistance = distance[pairOffset(size, left, right)]
      const normalized = Number.isFinite(graphDistance) ? clamp(graphDistance / scale, 0, 1.35) : 1.35
      const targetDistance = 0.42 + 2.9 * normalized ** 0.72
      result.push({
        leftIndex: left,
        rightIndex: right,
        targetDistance,
        weight: 1 / (0.3 + targetDistance * targetDistance),
      })
    }
  }
  return result
}

export const poincareDistance = (
  left: SpaceVector3,
  right: SpaceVector3,
  boundary: number,
) => {
  const safeBoundary = Math.max(EPSILON, boundary)
  const leftX = left[0] / safeBoundary
  const leftY = left[1] / safeBoundary
  const leftZ = left[2] / safeBoundary
  const rightX = right[0] / safeBoundary
  const rightY = right[1] / safeBoundary
  const rightZ = right[2] / safeBoundary
  const leftSquared = clamp(leftX * leftX + leftY * leftY + leftZ * leftZ, 0, 0.9999)
  const rightSquared = clamp(rightX * rightX + rightY * rightY + rightZ * rightZ, 0, 0.9999)
  const deltaX = leftX - rightX
  const deltaY = leftY - rightY
  const deltaZ = leftZ - rightZ
  const deltaSquared = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ
  const argument = 1 + 2 * deltaSquared / Math.max(EPSILON, (1 - leftSquared) * (1 - rightSquared))
  return Math.acosh(Math.max(1, argument))
}

export const buildSemanticKnowledgeLayout = (
  dataset: KnowledgeSpaceDataset,
  depthById: ReadonlyMap<string, number>,
  maxDepth: number,
  sphere: KnowledgeSphereParameters,
  fallbackNodeIds: ReadonlySet<string> = new Set(),
): SemanticKnowledgeLayout => {
  const affinity = buildAffinityMatrix(dataset)
  const directions = spectralDirections(dataset, affinity)
  const radial = radialLayout(dataset, depthById, maxDepth, sphere, fallbackNodeIds)
  const nodes = dataset.nodes.map((node, index): SemanticLayoutNode => ({
    nodeId: node.id,
    direction: directions[index],
    radius: radial.radii[index],
    foundationScore: radial.foundation[index],
  }))
  return {
    nodes,
    nodeById: new Map(nodes.map((node) => [node.nodeId, node])),
    stressPairs: stressPairs(affinity, dataset.nodes.length),
    poincareBoundary: sphere.outerRadius / HYPERBOLIC_BOUNDARY_RATIO,
  }
}
