import { describe, expect, it } from 'vitest'
import {
  formatBytes,
  groupAttachmentsByJournal,
  pickAttachmentKind,
} from '../model/interface'

const att = (id: number, journalId: number) => ({
  id,
  journalId,
  title: `att-${id}`,
  filename: `att-${id}.bin`,
  mime: 'application/octet-stream',
  size: 100,
})

describe('pickAttachmentKind', () => {
  it('classifies images, pdfs and everything else', () => {
    expect(pickAttachmentKind('image/jpeg')).toBe('image')
    expect(pickAttachmentKind('image/png')).toBe('image')
    expect(pickAttachmentKind('application/pdf')).toBe('pdf')
    expect(pickAttachmentKind('application/octet-stream')).toBe('file')
    expect(pickAttachmentKind('')).toBe('file')
  })
})

describe('formatBytes', () => {
  it('formats kilo- and megabyte ranges', () => {
    expect(formatBytes(0)).toBe('0 KB')
    expect(formatBytes(500)).toBe('1 KB')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(1536 * 1024)).toBe('1.5 MB')
  })
})

describe('groupAttachmentsByJournal', () => {
  it('groups by journal id preserving order', () => {
    const grouped = groupAttachmentsByJournal([
      att(1, 10),
      att(2, 20),
      att(3, 10),
    ])
    expect(grouped.get(10)?.map((a) => a.id)).toEqual([1, 3])
    expect(grouped.get(20)?.map((a) => a.id)).toEqual([2])
    expect(grouped.get(99)).toBeUndefined()
  })
})
