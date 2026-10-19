import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
} from 'three'
import type { ScienceDomainDefinition } from '../../knowledge/space3d/types'
import type { SpaceColorTheme } from './types'

export const DOMAIN_OVERVIEW_START_ZOOM = 1
export const DOMAIN_OVERVIEW_FULL_ZOOM = 0.7
export const DOMAIN_LABEL_PIXEL_HEIGHT = 48
export const DOMAIN_LABEL_MAX_OPACITY = 0.5
const DOMAIN_LABEL_FONT_SIZE_PX = 27
const DOMAIN_LABEL_HORIZONTAL_PADDING_PX = 18
const DOMAIN_LABEL_TEXTURE_SCALE = 2

export interface DomainLabelTextureResult {
  texture: CanvasTexture
  pixelWidth: number
  pixelHeight: number
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function domainOverviewProgress(zoom: number): number {
  const linear = clamp01(
    (DOMAIN_OVERVIEW_START_ZOOM - zoom)
      / (DOMAIN_OVERVIEW_START_ZOOM - DOMAIN_OVERVIEW_FULL_ZOOM),
  )
  return linear * linear * (3 - 2 * linear)
}

export function nodeNameOverviewOpacity(zoom: number, interactionFocused: boolean): number {
  return interactionFocused ? 1 : 1 - domainOverviewProgress(zoom)
}

function mixHexColor(source: string, target: string, amount: number): string {
  const normalize = (value: string) => value.replace('#', '').slice(0, 6)
  const sourceHex = normalize(source)
  const targetHex = normalize(target)
  const channel = (hex: string, offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16)
  const mixed = [0, 2, 4].map((offset) => Math.round(
    channel(sourceHex, offset) * (1 - amount) + channel(targetHex, offset) * amount,
  ))
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export function domainLabelTextColor(
  domainColor: string,
  colorTheme: SpaceColorTheme,
): string {
  return colorTheme === 'dark'
    ? mixHexColor(domainColor, '#000000', 0.58)
    : mixHexColor(domainColor, '#000000', 0.12)
}

export function createDomainLabelTexture(
  domain: ScienceDomainDefinition,
  colorTheme: SpaceColorTheme,
): DomainLabelTextureResult {
  const measurementCanvas = document.createElement('canvas')
  const measurementContext = measurementCanvas.getContext('2d')
  if (!measurementContext) throw new Error('无法测量三维知识大域名称。')
  measurementContext.font = `700 ${DOMAIN_LABEL_FONT_SIZE_PX}px "Noto Serif SC", "Songti SC", SimSun, serif`
  const pixelWidth = Math.ceil(
    measurementContext.measureText(domain.label).width + DOMAIN_LABEL_HORIZONTAL_PADDING_PX * 2,
  )
  const canvas = document.createElement('canvas')
  canvas.width = pixelWidth * DOMAIN_LABEL_TEXTURE_SCALE
  canvas.height = DOMAIN_LABEL_PIXEL_HEIGHT * DOMAIN_LABEL_TEXTURE_SCALE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建三维知识大域名称纹理。')

  context.scale(DOMAIN_LABEL_TEXTURE_SCALE, DOMAIN_LABEL_TEXTURE_SCALE)
  context.font = `700 ${DOMAIN_LABEL_FONT_SIZE_PX}px "Noto Serif SC", "Songti SC", SimSun, serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = domainLabelTextColor(domain.color, colorTheme)
  context.fillText(domain.label, pixelWidth / 2, DOMAIN_LABEL_PIXEL_HEIGHT / 2 + 1)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return {
    texture,
    pixelWidth,
    pixelHeight: DOMAIN_LABEL_PIXEL_HEIGHT,
  }
}
