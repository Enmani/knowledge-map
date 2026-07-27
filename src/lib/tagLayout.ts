import type { DomainId, FieldTagId, MathNode, TagField } from '../data/mathMap'
import { alignRadialClusters } from './radialClusterLayout'

type Point = { x: number; y: number }

export type GeneratedTagField = TagField & {
  members: string[]
  center: Point
  links: Array<{ from: Point; to: Point }>
  domains: DomainId[]
}

export type TagLayout = {
  positions: Record<string, Point>
  fields: GeneratedTagField[]
}

export type TagLayoutStrategy = 'organic' | 'progression' | 'radial-clusters'

export type TagLayoutOptions = {
  collisionGap?: number
  fieldScale?: number
  strategy?: TagLayoutStrategy
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

const DEFAULT_COLLISION_GAP = 16

/**
 * Resolve collisions as axis-aligned rectangles instead of circles. Moving on
 * the axis with the least overlap keeps the correction small, while alternating
 * the tie-break direction prevents coincident nodes from always drifting toward
 * the same edge. The in-place Gauss-Seidel pass converges quickly for this map
 * and avoids adding another long force simulation.
 */
function resolveNodeCollisions(
  nodes: MathNode[],
  positions: Record<string, Point>,
  nodeWidth: number,
  nodeHeight: number,
  worldWidth: number,
  worldHeight: number,
  maxPasses: number,
  collisionGap: number,
) {
  const minimumX = 20
  const minimumY = 20
  const maximumX = worldWidth - nodeWidth - 40
  const maximumY = worldHeight - nodeHeight - 40

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let collisionCount = 0

    for (let a = 0; a < nodes.length; a += 1) {
      for (let b = a + 1; b < nodes.length; b += 1) {
        const pointA = positions[nodes[a].id]
        const pointB = positions[nodes[b].id]
        const dx = pointB.x - pointA.x
        const dy = pointB.y - pointA.y
        const overlapX = nodeWidth + collisionGap - Math.abs(dx)
        const overlapY = nodeHeight + collisionGap - Math.abs(dy)

        if (overlapX <= 0 || overlapY <= 0) continue
        collisionCount += 1

        // Prefer vertical separation on exact ties so prerequisite order on the
        // horizontal reading axis is disturbed as little as possible.
        const axis = overlapX < overlapY ? 'x' : 'y'
        const distance = axis === 'x' ? dx : dy
        const amount = (axis === 'x' ? overlapX : overlapY) + 0.01
        const direction =
          Math.abs(distance) > 0.01 ? Math.sign(distance) : (a + b + pass) % 2 === 0 ? 1 : -1

        separateAlongAxis(
          pointA,
          pointB,
          axis,
          direction,
          amount,
          axis === 'x' ? minimumX : minimumY,
          axis === 'x' ? maximumX : maximumY,
        )
      }
    }

    if (collisionCount === 0) break
  }
}

function hasNodeCollisions(
  nodes: MathNode[],
  positions: Record<string, Point>,
  nodeWidth: number,
  nodeHeight: number,
  collisionGap: number,
) {
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = positions[nodes[leftIndex].id]
      const right = positions[nodes[rightIndex].id]
      if (
        Math.abs(left.x - right.x) < nodeWidth + collisionGap &&
        Math.abs(left.y - right.y) < nodeHeight + collisionGap
      ) return true
    }
  }
  return false
}

function halton(index: number, base: number) {
  let fraction = 1
  let result = 0
  let value = index
  while (value > 0) {
    fraction /= base
    result += fraction * (value % base)
    value = Math.floor(value / base)
  }
  return result
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function alignProgressionColumns(
  nodes: MathNode[],
  positions: Record<string, Point>,
  bases: Record<string, Point>,
  nodeWidth: number,
  nodeHeight: number,
  worldWidth: number,
  worldHeight: number,
  collisionGap: number,
) {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const ranks = new Map<string, number>()
  const visiting = new Set<string>()

  const resolveRank = (node: MathNode): number => {
    const cached = ranks.get(node.id)
    if (cached !== undefined) return cached
    if (visiting.has(node.id)) return 0

    visiting.add(node.id)
    const localPrerequisites = node.prerequisites
      .filter((prerequisiteId) => nodeIds.has(prerequisiteId))
      .map((prerequisiteId) => nodes.find((candidate) => candidate.id === prerequisiteId))
      .filter((prerequisite): prerequisite is MathNode => prerequisite !== undefined)
    const rank = localPrerequisites.length > 0
      ? Math.max(...localPrerequisites.map((prerequisite) => resolveRank(prerequisite) + 1))
      : 0
    visiting.delete(node.id)
    ranks.set(node.id, rank)
    return rank
  }

  nodes.forEach(resolveRank)
  const maximumRank = Math.max(0, ...ranks.values())
  const margin = Math.max(20, collisionGap)
  const availableWidth = worldWidth - nodeWidth - margin * 2
  const layerStep = maximumRank > 0 ? availableWidth / maximumRank : 0

  if (maximumRank > 0 && layerStep < nodeWidth + collisionGap) {
    throw new Error('推进式布局的世界宽度不足以容纳依赖分列。')
  }

  nodes.forEach((node) => {
    positions[node.id].x = clamp(
      maximumRank === 0
        ? (worldWidth - nodeWidth) / 2
        : margin + (ranks.get(node.id) ?? 0) * layerStep,
      20,
      worldWidth - nodeWidth - 40,
    )
    positions[node.id].y = clamp(bases[node.id].y, 20, worldHeight - nodeHeight - 40)
  })
}

function relaxRemainingCollisions(
  nodes: MathNode[],
  positions: Record<string, Point>,
  nodeWidth: number,
  nodeHeight: number,
  worldWidth: number,
  worldHeight: number,
  collisionGap: number,
) {
  if (!hasNodeCollisions(nodes, positions, nodeWidth, nodeHeight, collisionGap)) return

  const minimumX = 20
  const minimumY = 20
  const maximumX = worldWidth - nodeWidth - 40
  const maximumY = worldHeight - nodeHeight - 40
  const horizontalStep = nodeWidth + collisionGap
  const verticalStep = nodeHeight + collisionGap
  const worldDiagonal = Math.hypot(worldWidth, worldHeight)
  const packed: Array<{ node: MathNode; point: Point }> = []
  const packedById = new Map<string, Point>()
  const orderedNodes = [...nodes].sort((left, right) => {
    return left.level - right.level || left.x - right.x || left.y - right.y || left.id.localeCompare(right.id)
  })

  for (const node of orderedNodes) {
    const desired = positions[node.id]
    const seed = stableHash(node.id)
    const candidates: Point[] = [{
      x: clamp(desired.x, minimumX, maximumX),
      y: clamp(desired.y, minimumY, maximumY),
    }]
    for (let index = 1; index <= 4096; index += 1) {
      const sampleIndex = index + (seed % 997)
      candidates.push({
        x: minimumX + halton(sampleIndex, 2) * (maximumX - minimumX),
        y: minimumY + halton(sampleIndex, 3) * (maximumY - minimumY),
      })
    }

    const available = candidates.filter((candidate) => packed.every(({ point }) => (
      Math.abs(candidate.x - point.x) >= horizontalStep ||
      Math.abs(candidate.y - point.y) >= verticalStep
    )))
    let target: Point | undefined
    let targetScore = Number.POSITIVE_INFINITY

    available.forEach((candidate, candidateIndex) => {
      let score = Math.hypot(candidate.x - desired.x, candidate.y - desired.y) / worldDiagonal
      node.prerequisites.forEach((prerequisiteId) => {
        const prerequisite = packedById.get(prerequisiteId)
        if (!prerequisite) return
        const forwardGap = Math.max(collisionGap, nodeWidth * 0.22)
        const backwardDistance = prerequisite.x + forwardGap - candidate.x
        if (backwardDistance > 0) score += (backwardDistance / worldWidth) ** 2 * 12
      })
      packed.forEach(({ node: placedNode, point }) => {
        const sharedTags = node.fieldTags.filter((tag) => placedNode.fieldTags.includes(tag)).length
        if (sharedTags === 0) return
        const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y)
        const preferredDistance = Math.hypot(horizontalStep, verticalStep) * 0.82
        score += Math.abs(distance - preferredDistance) / worldDiagonal * sharedTags * 0.035
      })
      score += candidateIndex * 1e-10
      if (score >= targetScore) return
      target = candidate
      targetScore = score
    })

    if (target) {
      positions[node.id] = target
      packed.push({ node, point: target })
      packedById.set(node.id, target)
    } else {
      packed.push({ node, point: desired })
      packedById.set(node.id, desired)
    }
  }
}

function separateAlongAxis(
  pointA: Point,
  pointB: Point,
  axis: 'x' | 'y',
  direction: number,
  amount: number,
  minimum: number,
  maximum: number,
) {
  const coordinateA = pointA[axis]
  const coordinateB = pointB[axis]
  const capacityA = direction > 0 ? coordinateA - minimum : maximum - coordinateA
  const capacityB = direction > 0 ? maximum - coordinateB : coordinateB - minimum
  let movementA = Math.min(amount / 2, capacityA)
  let movementB = Math.min(amount / 2, capacityB)
  let remainder = amount - movementA - movementB

  const extraA = Math.min(remainder, capacityA - movementA)
  movementA += extraA
  remainder -= extraA
  movementB += Math.min(remainder, capacityB - movementB)

  pointA[axis] = clamp(coordinateA - direction * movementA, minimum, maximum)
  pointB[axis] = clamp(coordinateB + direction * movementB, minimum, maximum)
}

/**
 * A deterministic force pass. Shared field tags attract, card-sized nodes repel,
 * prerequisite edges preserve the left-to-right reading direction, and the
 * original coordinates act only as soft anchors.
 */
export function buildTagLayout(
  nodes: MathNode[],
  fieldDefinitions: TagField[],
  nodeWidth: number,
  nodeHeight: number,
  worldWidth: number,
  worldHeight: number,
  options: TagLayoutOptions = {},
): TagLayout {
  const collisionGap = options.collisionGap ?? DEFAULT_COLLISION_GAP
  const fieldScale = options.fieldScale ?? 1
  const strategy = options.strategy ?? 'organic'
  const geometryScale = Math.sqrt(Math.max(nodeWidth / 208, nodeHeight / 96, 1))
  const positions: Record<string, Point> = Object.fromEntries(
    nodes.map((node) => [node.id, { x: node.x, y: node.y }]),
  )
  const bases: Record<string, Point> = Object.fromEntries(
    nodes.map((node) => [node.id, { x: node.x, y: node.y }]),
  )
  const indexes = Object.fromEntries(nodes.map((node, index) => [node.id, index])) as Record<string, number>

  if (strategy === 'organic') {
    for (let iteration = 0; iteration < 160; iteration += 1) {
    const alpha = 1 - iteration / 185
    const delta = nodes.map(() => ({ x: 0, y: 0 }))

    for (let a = 0; a < nodes.length; a += 1) {
      for (let b = a + 1; b < nodes.length; b += 1) {
        const nodeA = nodes[a]
        const nodeB = nodes[b]
        const pointA = positions[nodeA.id]
        const pointB = positions[nodeB.id]
        let dx = pointB.x - pointA.x
        let dy = pointB.y - pointA.y
        let distance = Math.hypot(dx, dy)
        if (distance < 0.01) {
          dx = 1
          dy = 0
          distance = 1
        }

        const sharedTags = nodeA.fieldTags.filter((tag) => nodeB.fieldTags.includes(tag)).length
        const minimumDistance = 255 * geometryScale

        if (distance < minimumDistance) {
          const repel = (minimumDistance - distance) * 0.075 * alpha
          const rx = (dx / distance) * repel
          const ry = (dy / distance) * repel
          delta[a].x -= rx
          delta[a].y -= ry
          delta[b].x += rx
          delta[b].y += ry
        }

        if (sharedTags > 0) {
          const preferredDistance = (sharedTags > 1 ? 270 : 345) * geometryScale
          const pull = clamp((distance - preferredDistance) * 0.0105 * sharedTags * alpha, -5 * geometryScale, 20 * geometryScale)
          const px = (dx / distance) * pull
          const py = (dy / distance) * pull
          delta[a].x += px
          delta[a].y += py
          delta[b].x -= px
          delta[b].y -= py
        }
      }
    }

    nodes.forEach((target) => {
      target.prerequisites.forEach((sourceId) => {
        const source = positions[sourceId]
        const destination = positions[target.id]
        const gap = destination.x - source.x
        const preferredGap = 260 * geometryScale
        if (gap < preferredGap) {
          const correction = (preferredGap - gap) * 0.035 * alpha
          delta[indexes[sourceId]].x -= correction
          delta[indexes[target.id]].x += correction
        }
      })
    })

    nodes.forEach((node, index) => {
      const point = positions[node.id]
      const base = bases[node.id]
      delta[index].x += (base.x - point.x) * 0.008
      delta[index].y += (base.y - point.y) * 0.005
      point.x = clamp(point.x + delta[index].x, 20, worldWidth - nodeWidth - 40)
      point.y = clamp(point.y + delta[index].y, 20, worldHeight - nodeHeight - 40)
    })

    // Periodic single passes keep the force simulation out of heavily
    // overlapping states without multiplying the cost of every iteration.
    if (iteration % 8 === 7) {
      resolveNodeCollisions(nodes, positions, nodeWidth, nodeHeight, worldWidth, worldHeight, 1, collisionGap)
    }
    }
  }

  if (strategy === 'progression') {
    alignProgressionColumns(
      nodes,
      positions,
      bases,
      nodeWidth,
      nodeHeight,
      worldWidth,
      worldHeight,
      collisionGap,
    )
  } else if (strategy === 'radial-clusters') {
    alignRadialClusters(
      nodes,
      positions,
      nodeWidth,
      nodeHeight,
      worldWidth,
      worldHeight,
      collisionGap,
    )
  }

  // Attractions and soft anchors may reintroduce slight intersections. Finish
  // with a bounded deterministic projection so rendered card rectangles never
  // overlap, including when several nodes started at the same coordinates.
  resolveNodeCollisions(nodes, positions, nodeWidth, nodeHeight, worldWidth, worldHeight, 512, collisionGap)
  relaxRemainingCollisions(nodes, positions, nodeWidth, nodeHeight, worldWidth, worldHeight, collisionGap)

  const fields = fieldDefinitions
    .map((definition) => {
      const members = nodes.filter((node) => node.fieldTags.includes(definition.id))
      if (members.length < 3) return null
      const points = members.map((node) => ({
        x: positions[node.id].x + nodeWidth / 2,
        y: positions[node.id].y + nodeHeight / 2,
      }))
      const maximumLinkDistance = Math.max(
        560 * Math.min(fieldScale, 1.35),
        Math.hypot(nodeWidth + collisionGap, nodeHeight + collisionGap) * 1.15,
      )
      const links = minimumSpanningTree(points).filter(
        (link) => Math.hypot(link.to.x - link.from.x, link.to.y - link.from.y) <= maximumLinkDistance,
      )
      const center = points.reduce(
        (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
        { x: 0, y: 0 },
      )
      return {
        ...definition,
        members: members.map((node) => node.id),
        center,
        links,
        domains: [...new Set(members.map((node) => node.domain))],
      } satisfies GeneratedTagField
    })
    .filter((field): field is GeneratedTagField => field !== null)

  return { positions, fields }
}

function minimumSpanningTree(points: Point[]) {
  if (points.length < 2) return []
  const connected = new Set([0])
  const links: Array<{ from: Point; to: Point }> = []

  while (connected.size < points.length) {
    let best: { from: number; to: number; distance: number } | null = null
    connected.forEach((from) => {
      points.forEach((target, to) => {
        if (connected.has(to)) return
        const distance = Math.hypot(target.x - points[from].x, target.y - points[from].y)
        if (!best || distance < best.distance) best = { from, to, distance }
      })
    })
    if (!best) break
    const edge = best as { from: number; to: number; distance: number }
    connected.add(edge.to)
    links.push({ from: points[edge.from], to: points[edge.to] })
  }

  return links
}

export function fieldColor(tag: FieldTagId, fields: TagField[]) {
  return fields.find((field) => field.id === tag)?.color ?? '#6d5842'
}
