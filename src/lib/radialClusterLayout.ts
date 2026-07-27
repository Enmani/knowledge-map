import type { DomainId, MathNode } from '../data/mathMap'

type Point = { x: number; y: number }

const DOMAIN_ANGLES: Partial<Record<DomainId, number>> = {
  algebra: -Math.PI / 2,
  discrete: -Math.PI / 6,
  probability: Math.PI / 6,
  geometry: Math.PI / 2,
  analysis: Math.PI * 5 / 6,
  applied: Math.PI * 7 / 6,
}

function resolveDependencyDepths(nodes: MathNode[]): Map<string, number> {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const depths = new Map<string, number>()
  const visiting = new Set<string>()

  const resolveDepth = (node: MathNode): number => {
    const cached = depths.get(node.id)
    if (cached !== undefined) return cached
    if (visiting.has(node.id)) return 0

    visiting.add(node.id)
    const prerequisiteDepths = node.prerequisites
      .map((id) => nodeById.get(id))
      .filter((prerequisite): prerequisite is MathNode => prerequisite !== undefined)
      .map(resolveDepth)
    visiting.delete(node.id)

    const depth = prerequisiteDepths.length > 0 ? Math.max(...prerequisiteDepths) + 1 : 0
    depths.set(node.id, depth)
    return depth
  }

  nodes.forEach(resolveDepth)
  return depths
}

export function alignRadialClusters(
  nodes: MathNode[],
  positions: Record<string, Point>,
  nodeWidth: number,
  nodeHeight: number,
  worldWidth: number,
  worldHeight: number,
  collisionGap: number,
): void {
  const center = { x: worldWidth / 2, y: worldHeight / 2 }
  const depths = resolveDependencyDepths(nodes)
  const foundationNodes = nodes
    .filter((node) => node.domain === 'foundation')
    .sort((left, right) => (
      (depths.get(left.id) ?? 0) - (depths.get(right.id) ?? 0) ||
      left.x - right.x ||
      left.y - right.y ||
      left.id.localeCompare(right.id)
    ))

  const foundationOffsets = [
    { x: 0, y: 0 },
    { x: -240, y: 0 },
    { x: 240, y: 0 },
    { x: 0, y: -180 },
    { x: 0, y: 180 },
  ]
  foundationNodes.forEach((node, index) => {
    const offset = foundationOffsets[index] ?? { x: 0, y: 0 }
    positions[node.id] = {
      x: center.x + offset.x - nodeWidth / 2,
      y: center.y + offset.y - nodeHeight / 2,
    }
  })

  const branchNodes = nodes.filter((node) => node.domain !== 'foundation')
  const byDomain = new Map<DomainId, MathNode[]>()
  branchNodes.forEach((node) => {
    const group = byDomain.get(node.domain) ?? []
    group.push(node)
    byDomain.set(node.domain, group)
  })

  const tangentPattern = [0, -150, 150, -75, 75, -225, 225]
  byDomain.forEach((domainNodes, domainId) => {
    const baseAngle = DOMAIN_ANGLES[domainId] ?? 0
    const radialDirection = { x: Math.cos(baseAngle), y: Math.sin(baseAngle) }
    const tangentDirection = { x: -radialDirection.y, y: radialDirection.x }
    const depthGroups = [...new Set(domainNodes.map((node) => depths.get(node.id) ?? 0))].sort((a, b) => a - b)

    depthGroups.forEach((depth, depthIndex) => {
      const group = domainNodes
        .filter((node) => (depths.get(node.id) ?? 0) === depth)
        .sort((left, right) => left.y - right.y || left.x - right.x || left.id.localeCompare(right.id))
      const radius = 560 + depthIndex * 145
      const baseTangent = tangentPattern[depthIndex] ?? 0
      const laneSpacing = nodeWidth + collisionGap + 16

      group.forEach((node, index) => {
        const tangentOffset = baseTangent + (index - (group.length - 1) / 2) * laneSpacing
        positions[node.id] = {
          x: center.x + radialDirection.x * radius + tangentDirection.x * tangentOffset - nodeWidth / 2,
          y: center.y + radialDirection.y * radius + tangentDirection.y * tangentOffset - nodeHeight / 2,
        }
      })
    })
  })
}
