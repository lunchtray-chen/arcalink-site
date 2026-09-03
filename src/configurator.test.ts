import { describe, expect, it } from 'vitest'
import { hotspotOccupant, initialPlacements, placeProp } from './configurator'

describe('configurator placement rules', () => {
  it('starts props on the approved hotspots', () => {
    expect(initialPlacements).toEqual({
      burning: 'secret-academy-bottom',
      charmed: 'noble-palace-bottom',
      dragon: 'secret-academy-top',
      gauntlet: 'noble-palace-top',
      owl: 'ancient-stone-left',
      potion: 'wanted-left',
      spider: 'wanted-top',
      staff: 'ancient-stone-right',
    })
  })

  it('moves a prop to an open hotspot', () => {
    const next = placeProp(initialPlacements, 'burning', 'ancient-stone-bottom')
    expect(next.burning).toBe('ancient-stone-bottom')
    expect(hotspotOccupant(next, 'ancient-stone-bottom')).toBe('burning')
  })

  it('exchanges props when a prop is dropped on an occupied hotspot', () => {
    const next = placeProp(initialPlacements, 'burning', 'noble-palace-bottom')
    expect(next.burning).toBe('noble-palace-bottom')
    expect(next.charmed).toBe('secret-academy-bottom')
    expect(hotspotOccupant(next, 'noble-palace-bottom')).toBe('burning')
    expect(hotspotOccupant(next, 'secret-academy-bottom')).toBe('charmed')
  })
})
