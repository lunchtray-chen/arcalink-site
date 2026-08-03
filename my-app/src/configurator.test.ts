import { describe, expect, it } from 'vitest'
import { detachProp, hotspotOccupant, initialPlacements, placeProp } from './configurator'

describe('configurator placement rules', () => {
  it('starts props on the approved hotspots', () => {
    expect(initialPlacements).toEqual({
      'potion-stats': 'ancient-stone-left',
      'character-status': 'secret-academy-bottom',
      'character-class': 'wanted-top',
    })
  })

  it('moves a prop to an open hotspot', () => {
    const next = placeProp(initialPlacements, 'potion-stats', 'noble-palace-right')
    expect(next['potion-stats']).toBe('noble-palace-right')
    expect(hotspotOccupant(next, 'noble-palace-right')).toBe('potion-stats')
  })

  it('rejects a drop on an occupied hotspot', () => {
    const next = placeProp(initialPlacements, 'potion-stats', 'secret-academy-bottom')
    expect(next).toBe(initialPlacements)
    expect(next['potion-stats']).toBe('ancient-stone-left')
  })

  it('detaches a prop into the shared tray without changing other props', () => {
    const next = detachProp(initialPlacements, 'character-class')
    expect(next['character-class']).toBeNull()
    expect(next['character-status']).toBe('secret-academy-bottom')
  })
})
