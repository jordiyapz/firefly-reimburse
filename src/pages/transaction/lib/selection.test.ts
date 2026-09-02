import { describe, expect, it } from 'vitest'
import { buildSelectionPatch } from './selection'

const IDS = ['10', '20', '30', '40', '50']

describe('buildSelectionPatch', () => {
  it('selects forward ranges inclusive', () => {
    expect(buildSelectionPatch(IDS, '20', '40', true)).toEqual({
      20: true,
      30: true,
      40: true,
    })
  })

  it('selects backward ranges identically', () => {
    expect(buildSelectionPatch(IDS, '50', '30', false)).toEqual({
      50: false,
      40: false,
      30: false,
    })
  })

  it('handles single-row anchors', () => {
    expect(buildSelectionPatch(IDS, '30', '30', true)).toEqual({ 30: true })
  })

  it('returns null when anchor left the visible rows', () => {
    expect(buildSelectionPatch(IDS, '999', '30', true)).toBeNull()
    expect(buildSelectionPatch(IDS, '20', '999', true)).toBeNull()
  })
})
