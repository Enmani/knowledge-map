import type { KnowledgeRelationType } from '../../knowledge/space3d/types'
import {
  getCardFocusEdgeRole,
  type CardFocusEdgeRole,
  type CardFocusState,
} from '../core/cardFocus'
import type { SpaceColorTheme } from './types'

export const EDGE_PULSE_PERIOD_SECONDS = 1.8

const LIGHT_EDGE_COLORS: Readonly<Record<KnowledgeRelationType, string>> = {
  prerequisite: '#5b625e',
  application: '#7b6a4e',
  'shared-model': '#4d7773',
  analogy: '#777080',
  historical: '#947861',
}

const DARK_EDGE_COLORS: Readonly<Record<KnowledgeRelationType, string>> = {
  prerequisite: '#b9cbc3',
  application: '#d7b879',
  'shared-model': '#76c9c1',
  analogy: '#c6b8d2',
  historical: '#d8a77c',
}

export function knowledgeEdgeColor(
  relationType: KnowledgeRelationType,
  colorTheme: SpaceColorTheme,
): string {
  return (colorTheme === 'dark' ? DARK_EDGE_COLORS : LIGHT_EDGE_COLORS)[relationType]
}

export function knowledgeEdgeOpacity(
  projectedOpacity: number,
  role: CardFocusEdgeRole,
  colorTheme: SpaceColorTheme,
): number {
  const opacity = Math.max(0, Math.min(1, projectedOpacity))
  const base = opacity * (colorTheme === 'dark' ? 0.36 : 0.24)
  if (role === 'default') return base
  if (role === 'connected') {
    return colorTheme === 'dark'
      ? Math.min(0.92, 0.28 + opacity * 0.72)
      : Math.min(0.72, 0.2 + opacity * 0.62)
  }
  return base * (colorTheme === 'dark' ? 0.09 : 0.12)
}

export function displayKnowledgeEdgeOpacity(
  projectedOpacity: number,
  cardFocus: CardFocusState,
  sourceId: string,
  targetId: string,
  colorTheme: SpaceColorTheme,
): number {
  return knowledgeEdgeOpacity(
    projectedOpacity,
    getCardFocusEdgeRole(cardFocus, sourceId, targetId),
    colorTheme,
  )
}

export function focusedKnowledgeEdgePulse(
  cardFocus: CardFocusState,
  sourceId: string,
  targetId: string,
): number {
  if (cardFocus.primaryNodeIds.size === 0) return 0
  const sourcePrimary = cardFocus.primaryNodeIds.has(sourceId)
  const targetPrimary = cardFocus.primaryNodeIds.has(targetId)
  const sourceRelated = cardFocus.relatedNodeIds.has(sourceId)
  const targetRelated = cardFocus.relatedNodeIds.has(targetId)
  return (sourcePrimary && targetRelated) || (targetPrimary && sourceRelated) ? 1 : 0
}
