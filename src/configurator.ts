import { props } from './content'
import type { HotspotId, PropId, PropPlacement } from './types'

export const initialPlacements: PropPlacement = Object.fromEntries(
  props.map((prop) => [prop.id, prop.initialHotspot]),
) as PropPlacement

export function hotspotOccupant(placements: PropPlacement, hotspotId: HotspotId) {
  return (Object.entries(placements) as [PropId, HotspotId | null][])
    .find(([, placement]) => placement === hotspotId)?.[0] ?? null
}

export function placeProp(
  placements: PropPlacement,
  propId: PropId,
  hotspotId: HotspotId,
): PropPlacement {
  const previousHotspot = placements[propId]
  const occupant = hotspotOccupant(placements, hotspotId)

  if (occupant === propId) return placements

  if (occupant) {
    return {
      ...placements,
      [propId]: hotspotId,
      [occupant]: previousHotspot,
    }
  }

  return { ...placements, [propId]: hotspotId }
}
