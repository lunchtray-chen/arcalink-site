export type ModelId = 'ancient-stone' | 'secret-academy' | 'wanted' | 'noble-palace'
export type HotspotSide = 'top' | 'bottom'
export type HotspotId = `${ModelId}-${HotspotSide}`
export type PropId = 'potion-stats' | 'character-status' | 'character-class'

export interface ModelConfig {
  id: ModelId
  label: string
  modelUrl: string
  artworkUrl: string
}

export interface PropConfig {
  id: PropId
  label: string
  modelUrl: string
  initialHotspot: HotspotId
}

export interface Hotspot {
  id: HotspotId
  modelId: ModelId
  side: HotspotSide
  position: readonly [number, number, number]
}

export type PropPlacement = Record<PropId, HotspotId | null>

export interface Slide {
  src: string
  alt: string
}

export interface Review {
  name: string
  role: string
  quote: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}
