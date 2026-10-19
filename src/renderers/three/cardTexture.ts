import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type Texture,
} from 'three'
import {
  createGridPlaneGeometry,
  LINEAR_OPEN_ROTATIONS,
  LINEAR_PLANE_DEFINITIONS,
  scaleRotation,
  type GridPlaneGeometry,
  type LinearPlaneId,
} from '../../features/concept-icons/linearAlgebraGeometry'
import type {
  KnowledgeSpaceNode,
  ScienceDomainDefinition,
} from '../../knowledge/space3d/types'
import type { SpaceColorTheme } from './types'
import {
  KNOWLEDGE_BUBBLE_FONT_SIZE_PX,
  KNOWLEDGE_BUBBLE_HORIZONTAL_PADDING_PX,
  KNOWLEDGE_BUBBLE_PIXEL_HEIGHT,
} from './bubbleLayout'

const CARD_WIDTH = 768
const CARD_HEIGHT = 288
const CARD_CORNER_RADIUS = 13
const CARD_INNER_HEIGHT = CARD_HEIGHT - 52
const CARD_CORNER_RADIUS_RATIO = CARD_CORNER_RADIUS / CARD_INNER_HEIGHT
const LINEAR_ALGEBRA_NODE_ID = 'linear-algebra'
const LINEAR_ICON_CENTER = { x: 575, y: 139 }
const LINEAR_ICON_SIZE = 208
const BUBBLE_MAX_WIDTH_PX = 220
const BUBBLE_TEXTURE_SCALE = 2

export interface KnowledgeBubbleMetrics {
  width: number
  height: number
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function tracePlane(
  context: CanvasRenderingContext2D,
  geometry: GridPlaneGeometry,
) {
  const [first, ...rest] = geometry.corners
  context.beginPath()
  context.moveTo(first.x, first.y)
  rest.forEach((point) => context.lineTo(point.x, point.y))
  context.closePath()
}

function drawPlaneGrid(
  context: CanvasRenderingContext2D,
  geometry: GridPlaneGeometry,
) {
  context.beginPath()
  geometry.gridLines.forEach(({ from, to }) => {
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
  })
  context.stroke()
}

function drawLinearAlgebraIcon(
  context: CanvasRenderingContext2D,
  domainColor: string,
  dark: boolean,
  progress: number,
) {
  const clampedProgress = Math.min(1, Math.max(0, progress))
  const iconScale = LINEAR_ICON_SIZE / 160
  const ink = dark ? '#eee8df' : '#38352f'
  const planeStyles: Readonly<Record<LinearPlaneId, {
    fillAlpha: number
    strokeAlpha: number
    color: string
  }>> = {
    xy: { fillAlpha: 0.018, strokeAlpha: 0.44, color: ink },
    yz: { fillAlpha: 0.035, strokeAlpha: 0.62, color: ink },
    xz: { fillAlpha: 0.07, strokeAlpha: 0.9, color: domainColor },
  }

  context.save()
  context.beginPath()
  context.rect(
    LINEAR_ICON_CENTER.x - LINEAR_ICON_SIZE / 2,
    LINEAR_ICON_CENTER.y - LINEAR_ICON_SIZE / 2,
    LINEAR_ICON_SIZE,
    LINEAR_ICON_SIZE,
  )
  context.clip()
  context.translate(
    LINEAR_ICON_CENTER.x - 80 * iconScale,
    LINEAR_ICON_CENTER.y - 80 * iconScale,
  )
  context.scale(iconScale, iconScale)
  context.lineJoin = 'round'
  context.lineCap = 'round'

  for (const plane of LINEAR_PLANE_DEFINITIONS) {
    const geometry = createGridPlaneGeometry(plane.firstAxis, plane.secondAxis)
    tracePlane(context, geometry)
    context.globalAlpha = plane.id === 'xz' ? 0.34 : 0.22
    context.strokeStyle = plane.id === 'xz' ? domainColor : ink
    context.lineWidth = 0.9
    context.stroke()
  }

  for (const plane of LINEAR_PLANE_DEFINITIONS) {
    const style = planeStyles[plane.id]
    const geometry = createGridPlaneGeometry(
      plane.firstAxis,
      plane.secondAxis,
      scaleRotation(LINEAR_OPEN_ROTATIONS[plane.id], clampedProgress),
    )
    tracePlane(context, geometry)
    context.globalAlpha = style.fillAlpha
    context.fillStyle = style.color
    context.fill()
    context.globalAlpha = style.strokeAlpha
    context.strokeStyle = style.color
    context.lineWidth = plane.id === 'xz' ? 1.05 : 0.82
    context.stroke()
    drawPlaneGrid(context, geometry)
  }
  context.restore()
}

function paintKnowledgeCard(
  context: CanvasRenderingContext2D,
  node: KnowledgeSpaceNode,
  domain: ScienceDomainDefinition,
  selected: boolean,
  colorTheme: SpaceColorTheme,
  related: boolean,
  iconProgress: number,
) {
  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  const dark = colorTheme === 'dark'
  context.shadowColor = dark
    ? selected ? 'rgba(0, 0, 0, 0.56)' : related ? `${domain.color}66` : 'rgba(0, 0, 0, 0.36)'
    : selected ? 'rgba(46, 67, 61, 0.24)' : related ? `${domain.color}52` : 'rgba(65, 54, 43, 0.14)'
  context.shadowBlur = selected ? 24 : related ? 21 : 15
  context.shadowOffsetY = selected ? 9 : related ? 7 : 6
  roundedRect(
    context,
    24,
    22,
    CARD_WIDTH - 48,
    CARD_INNER_HEIGHT,
    CARD_CORNER_RADIUS,
  )
  context.fillStyle = dark
    ? selected ? 'rgba(43, 47, 45, 0.97)' : related ? 'rgba(35, 37, 36, 0.94)' : 'rgba(32, 32, 32, 0.86)'
    : selected ? 'rgba(238, 241, 232, 0.97)' : related ? 'rgba(248, 245, 237, 0.94)' : 'rgba(248, 243, 233, 0.86)'
  context.fill()
  context.shadowColor = 'transparent'
  context.lineWidth = selected ? 5 : related ? 4 : 2
  context.strokeStyle = selected
    ? dark ? '#88aba1' : '#315f58'
    : related ? domain.color
      : dark ? 'rgba(225, 218, 207, 0.42)' : 'rgba(92, 84, 73, 0.52)'
  context.stroke()

  context.fillStyle = domain.color
  context.fillRect(42, 43, selected ? 8 : related ? 7 : 6, CARD_HEIGHT - 94)

  context.fillStyle = domain.color
  context.font = 'italic 500 26px Georgia, serif'
  context.fillText(String(node.level).padStart(2, '0'), 71, 164)

  const reservesIconSpace = node.id === LINEAR_ALGEBRA_NODE_ID
  const textWidth = reservesIconSpace ? 330 : 500
  context.fillStyle = dark ? '#f0ebe2' : '#2d2b27'
  context.font = '600 43px "Noto Serif SC", "Songti SC", SimSun, serif'
  context.fillText(node.title, 142, 100, textWidth)

  context.fillStyle = dark ? '#aaa398' : '#746f66'
  context.font = '25px Georgia, serif'
  context.fillText(node.englishTitle, 142, 139, textWidth)

  const tags = node.tags.slice(0, 3).map((tag) => `#${tag}`).join('  ')
  context.fillStyle = domain.color
  context.font = '500 22px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  context.fillText(tags, 142, 191, textWidth)

  if (reservesIconSpace) {
    drawLinearAlgebraIcon(context, domain.color, dark, iconProgress)
    return
  }

  context.beginPath()
  context.arc(673, 128, 32, 0, Math.PI * 2)
  context.fillStyle = selected || related ? domain.color : dark ? '#292929' : '#f2ede3'
  context.fill()
  context.lineWidth = 3
  context.strokeStyle = domain.color
  context.stroke()
  context.beginPath()
  context.arc(673, 128, 7, 0, Math.PI * 2)
  context.fillStyle = selected || related ? dark ? '#181818' : '#f8f3e9' : domain.color
  context.fill()
}

export function createKnowledgeCardTexture(
  node: KnowledgeSpaceNode,
  domain: ScienceDomainDefinition,
  selected: boolean,
  colorTheme: SpaceColorTheme = 'light',
  related = false,
  iconProgress = 0,
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建三维知识卡片纹理。')

  paintKnowledgeCard(context, node, domain, selected, colorTheme, related, iconProgress)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

export function redrawKnowledgeCardTexture(
  texture: Texture,
  node: KnowledgeSpaceNode,
  domain: ScienceDomainDefinition,
  selected: boolean,
  colorTheme: SpaceColorTheme = 'light',
  related = false,
  iconProgress = 0,
) {
  const canvas = texture.image as HTMLCanvasElement | undefined
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return
  paintKnowledgeCard(context, node, domain, selected, colorTheme, related, iconProgress)
  texture.needsUpdate = true
}

export function createKnowledgeTitleTexture(
  node: KnowledgeSpaceNode,
  domain: ScienceDomainDefinition,
  selected: boolean,
  colorTheme: SpaceColorTheme = 'light',
  related = false,
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建三维知识标题纹理。')

  context.clearRect(0, 0, canvas.width, canvas.height)
  roundedRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 18)
  const dark = colorTheme === 'dark'
  context.fillStyle = dark
    ? selected ? 'rgba(43, 47, 45, 0.98)' : related ? 'rgba(35, 37, 36, 0.95)' : 'rgba(32, 32, 32, 0.86)'
    : selected ? 'rgba(238, 241, 232, 0.98)' : related ? 'rgba(248, 245, 237, 0.95)' : 'rgba(248, 243, 233, 0.86)'
  context.fill()
  context.lineWidth = selected ? 5 : related ? 4 : 2
  context.strokeStyle = selected
    ? dark ? '#88aba1' : '#315f58'
    : related ? domain.color : `${domain.color}${dark ? 'c8' : 'a8'}`
  context.stroke()
  context.fillStyle = domain.color
  context.fillRect(28, 28, selected ? 7 : related ? 6 : 5, 72)
  context.fillStyle = dark ? '#f0ebe2' : '#2d2b27'
  context.font = '600 34px "Noto Serif SC", "Songti SC", SimSun, serif'
  context.fillText(node.title, 54, 65, 410)
  context.fillStyle = domain.color
  context.font = '500 20px Georgia, serif'
  context.fillText(node.englishTitle, 54, 94, 410)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

export function measureKnowledgeBubble(title: string): KnowledgeBubbleMetrics {
  const fallbackTextWidth = [...title].reduce((width, character) => (
    width + (/^[\u0000-\u00ff]$/.test(character) ? 8 : KNOWLEDGE_BUBBLE_FONT_SIZE_PX)
  ), 0)
  let textWidth = fallbackTextWidth
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) {
      context.font = `600 ${KNOWLEDGE_BUBBLE_FONT_SIZE_PX}px "Noto Serif SC", "Songti SC", SimSun, serif`
      textWidth = context.measureText(title).width
    }
  }
  return {
    width: Math.min(
      BUBBLE_MAX_WIDTH_PX,
      Math.max(
        KNOWLEDGE_BUBBLE_PIXEL_HEIGHT,
        Math.ceil(textWidth + KNOWLEDGE_BUBBLE_HORIZONTAL_PADDING_PX * 2),
      ),
    ),
    height: KNOWLEDGE_BUBBLE_PIXEL_HEIGHT,
  }
}

export function createKnowledgeBubbleTexture(
  node: KnowledgeSpaceNode,
  domain: ScienceDomainDefinition,
  colorTheme: SpaceColorTheme = 'light',
  metrics = measureKnowledgeBubble(node.title),
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = metrics.width * BUBBLE_TEXTURE_SCALE
  canvas.height = metrics.height * BUBBLE_TEXTURE_SCALE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建三维知识气泡纹理。')

  context.scale(BUBBLE_TEXTURE_SCALE, BUBBLE_TEXTURE_SCALE)
  const dark = colorTheme === 'dark'
  const inset = 1.5
  roundedRect(
    context,
    inset,
    inset,
    metrics.width - inset * 2,
    metrics.height - inset * 2,
    Math.max(3, (metrics.height - inset * 2) * CARD_CORNER_RADIUS_RATIO),
  )
  context.fillStyle = dark ? 'rgba(31, 33, 32, 0.91)' : 'rgba(248, 245, 237, 0.92)'
  context.fill()
  context.lineWidth = 1
  context.strokeStyle = `${domain.color}${dark ? 'd8' : 'b8'}`
  context.stroke()

  context.fillStyle = dark ? '#eee9df' : '#302e2a'
  context.font = `600 ${KNOWLEDGE_BUBBLE_FONT_SIZE_PX}px "Noto Serif SC", "Songti SC", SimSun, serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(
    node.title,
    metrics.width / 2,
    metrics.height / 2 + 0.5,
    metrics.width - KNOWLEDGE_BUBBLE_HORIZONTAL_PADDING_PX * 2,
  )

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

export function createNodeGlowTexture(color: string): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建三维知识节点光点纹理。')
  const center = size / 2
  const paintDiffractionRay = (rotation: number, thickness: number, opacity: string) => {
    context.save()
    context.translate(center, center)
    context.rotate(rotation)
    context.scale(1, thickness)
    const ray = context.createRadialGradient(0, 0, 0, 0, 0, size * 0.46)
    ray.addColorStop(0, `#fffdf5${opacity}`)
    ray.addColorStop(0.08, `${color}44`)
    ray.addColorStop(1, `${color}00`)
    context.fillStyle = ray
    context.beginPath()
    context.arc(0, 0, size * 0.46, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
  context.globalCompositeOperation = 'lighter'
  paintDiffractionRay(0, 0.045, '70')
  paintDiffractionRay(Math.PI / 2, 0.045, '70')
  paintDiffractionRay(Math.PI / 4, 0.022, '2e')
  paintDiffractionRay(-Math.PI / 4, 0.022, '2e')
  const gradient = context.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    center,
  )
  gradient.addColorStop(0, '#fffef8')
  gradient.addColorStop(0.05, '#fffef8')
  gradient.addColorStop(0.13, '#fff8e8f8')
  gradient.addColorStop(0.24, `${color}dc`)
  gradient.addColorStop(0.44, `${color}58`)
  gradient.addColorStop(0.66, `${color}00`)
  gradient.addColorStop(1, `${color}00`)
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}
