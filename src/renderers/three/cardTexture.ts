import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
} from 'three'
import type {
  KnowledgeSpaceNode,
  ScienceDomainDefinition,
} from '../../knowledge/space3d/types'
import type { SpaceColorTheme } from './types'

const CARD_WIDTH = 768
const CARD_HEIGHT = 288

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

export function createKnowledgeCardTexture(
  node: KnowledgeSpaceNode,
  domain: ScienceDomainDefinition,
  selected: boolean,
  colorTheme: SpaceColorTheme = 'light',
  related = false,
): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建三维知识卡片纹理。')

  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  const dark = colorTheme === 'dark'
  context.shadowColor = dark
    ? selected ? 'rgba(0, 0, 0, 0.56)' : related ? `${domain.color}66` : 'rgba(0, 0, 0, 0.36)'
    : selected ? 'rgba(46, 67, 61, 0.24)' : related ? `${domain.color}52` : 'rgba(65, 54, 43, 0.14)'
  context.shadowBlur = selected ? 24 : related ? 21 : 15
  context.shadowOffsetY = selected ? 9 : related ? 7 : 6
  roundedRect(context, 24, 22, CARD_WIDTH - 48, CARD_HEIGHT - 52, 13)
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

  context.fillStyle = dark ? '#f0ebe2' : '#2d2b27'
  context.font = '600 43px "Noto Serif SC", "Songti SC", SimSun, serif'
  context.fillText(node.title, 142, 100, 500)

  context.fillStyle = dark ? '#aaa398' : '#746f66'
  context.font = '25px Georgia, serif'
  context.fillText(node.englishTitle, 142, 139, 490)

  const tags = node.tags.slice(0, 3).map((tag) => `#${tag}`).join('  ')
  context.fillStyle = domain.color
  context.font = '500 22px "Noto Sans SC", "Microsoft YaHei", sans-serif'
  context.fillText(tags, 142, 191, 500)

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

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
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

export function createNodeGlowTexture(color: string): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建三维知识节点光点纹理。')
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  gradient.addColorStop(0, '#fffdf5')
  gradient.addColorStop(0.13, `${color}ff`)
  gradient.addColorStop(0.42, `${color}8c`)
  gradient.addColorStop(0.72, `${color}28`)
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
