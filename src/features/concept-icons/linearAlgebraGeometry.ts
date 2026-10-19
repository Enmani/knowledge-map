export type LinearPlaneId = 'xy' | 'yz' | 'xz'

export type Vector3 = readonly [number, number, number]

export interface Rotation3 {
  x?: number
  y?: number
  z?: number
}

export interface Point2 {
  x: number
  y: number
}

export interface Line2 {
  from: Point2
  to: Point2
}

export interface GridPlaneGeometry {
  corners: readonly Point2[]
  gridLines: readonly Line2[]
}

export interface GridPlanePaths {
  fill: string
  grid: string
}

export interface LinearPlaneDefinition {
  id: LinearPlaneId
  firstAxis: Vector3
  secondAxis: Vector3
}

const LINEAR_ORIGIN = { x: 80, y: 80 }
const LINEAR_GRID_STEPS = 6

export const LINEAR_PLANE_DEFINITIONS: readonly LinearPlaneDefinition[] = [
  { id: 'xy', firstAxis: [1, 0, 0], secondAxis: [0, 1, 0] },
  { id: 'yz', firstAxis: [0, 1, 0], secondAxis: [0, 0, 1] },
  { id: 'xz', firstAxis: [1, 0, 0], secondAxis: [0, 0, 1] },
]

export const LINEAR_OPEN_ROTATIONS: Readonly<Record<LinearPlaneId, Rotation3>> = {
  xy: { x: -52, z: 28 },
  yz: { y: -46, z: -34 },
  xz: { y: 38, z: 32 },
}

export const LINEAR_CYCLE_ROTATIONS: Readonly<Record<LinearPlaneId, Rotation3>> = {
  xy: { x: 180 },
  yz: { y: 180 },
  xz: { z: 180 },
}

function rotateVector([x, y, z]: Vector3, rotation: Rotation3): Vector3 {
  const xAngle = (rotation.x ?? 0) * Math.PI / 180
  const yAngle = (rotation.y ?? 0) * Math.PI / 180
  const zAngle = (rotation.z ?? 0) * Math.PI / 180

  const afterX: Vector3 = [
    x,
    y * Math.cos(xAngle) - z * Math.sin(xAngle),
    y * Math.sin(xAngle) + z * Math.cos(xAngle),
  ]
  const afterY: Vector3 = [
    afterX[0] * Math.cos(yAngle) + afterX[2] * Math.sin(yAngle),
    afterX[1],
    -afterX[0] * Math.sin(yAngle) + afterX[2] * Math.cos(yAngle),
  ]
  return [
    afterY[0] * Math.cos(zAngle) - afterY[1] * Math.sin(zAngle),
    afterY[0] * Math.sin(zAngle) + afterY[1] * Math.cos(zAngle),
    afterY[2],
  ]
}

function addVector(left: Vector3, right: Vector3): Vector3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]]
}

function scaleVector([x, y, z]: Vector3, scale: number): Vector3 {
  return [x * scale, y * scale, z * scale]
}

function projectOrthographic([x, y, z]: Vector3): Point2 {
  return {
    x: LINEAR_ORIGIN.x + x * 43 + y * 29,
    y: LINEAR_ORIGIN.y - y * 22 - z * 50,
  }
}

export function scaleRotation(rotation: Rotation3, progress: number): Rotation3 {
  return {
    x: (rotation.x ?? 0) * progress,
    y: (rotation.y ?? 0) * progress,
    z: (rotation.z ?? 0) * progress,
  }
}

export function createGridPlaneGeometry(
  firstAxis: Vector3,
  secondAxis: Vector3,
  rotation: Rotation3 = {},
): GridPlaneGeometry {
  const first = rotateVector(firstAxis, rotation)
  const second = rotateVector(secondAxis, rotation)
  const negativeFirst = scaleVector(first, -1)
  const negativeSecond = scaleVector(second, -1)
  const corners = [
    addVector(negativeFirst, negativeSecond),
    addVector(first, negativeSecond),
    addVector(first, second),
    addVector(negativeFirst, second),
  ].map(projectOrthographic)
  const gridLines: Line2[] = []

  for (let index = 0; index <= LINEAR_GRID_STEPS; index += 1) {
    const progress = -1 + 2 * index / LINEAR_GRID_STEPS
    const alongFirst = scaleVector(first, progress)
    const alongSecond = scaleVector(second, progress)
    gridLines.push({
      from: projectOrthographic(addVector(alongFirst, negativeSecond)),
      to: projectOrthographic(addVector(alongFirst, second)),
    })
    gridLines.push({
      from: projectOrthographic(addVector(alongSecond, negativeFirst)),
      to: projectOrthographic(addVector(alongSecond, first)),
    })
  }

  return { corners, gridLines }
}

function pathPoint(point: Point2): string {
  return `${point.x.toFixed(2)} ${point.y.toFixed(2)}`
}

export function createGridPlanePaths(
  firstAxis: Vector3,
  secondAxis: Vector3,
  rotation: Rotation3 = {},
): GridPlanePaths {
  const geometry = createGridPlaneGeometry(firstAxis, secondAxis, rotation)
  const [first, second, third, fourth] = geometry.corners
  const fill = [
    `M${pathPoint(first)}`,
    `L${pathPoint(second)}`,
    `L${pathPoint(third)}`,
    `L${pathPoint(fourth)}Z`,
  ].join(' ')
  const grid = geometry.gridLines
    .map((line) => `M${pathPoint(line.from)} L${pathPoint(line.to)}`)
    .join(' ')

  return { fill, grid }
}
