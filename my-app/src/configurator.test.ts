import { describe, expect, it } from 'vitest'
import { hotspotOccupant, initialPlacements, placeProp } from './configurator'

describe('configurator placement rules', () => {
  it('starts props on the approved hotspots', () => {
    expect(initialPlacements).toEqual({
      'potion-stats': 'ancient-stone-top',
      'character-status': 'secret-academy-bottom',
      'character-class': 'wanted-top',
    })
  })

  it('moves a prop to an open hotspot', () => {
    const next = placeProp(initialPlacements, 'potion-stats', 'noble-palace-bottom')
    expect(next['potion-stats']).toBe('noble-palace-bottom')
    expect(hotspotOccupant(next, 'noble-palace-bottom')).toBe('potion-stats')
  })

  it('rejects a drop on an occupied hotspot', () => {
    const next = placeProp(initialPlacements, 'potion-stats', 'secret-academy-bottom')
    expect(next).toBe(initialPlacements)
    expect(next['potion-stats']).toBe('ancient-stone-top')
  })
})
