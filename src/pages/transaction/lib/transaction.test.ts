import { describe, expect, it } from 'vitest'
import {
  buildTransitionTags,
  collectGroupNames,
  deriveGroups,
  getPeriodName,
  getStatus,
  validatePeriodName,
} from './transaction'

const tx = (
  transactionId: number,
  tags: Array<string>,
  amount = -100,
) => ({
  transactionId,
  id: transactionId * 10,
  description: `tx-${transactionId}`,
  amount,
  date: undefined as never,
  has_attachments: false,
  tags,
  transaction_journal_id: String(transactionId * 10),
  type: 'withdrawal' as const,
  status: 'todo' as const,
})

describe('getStatus', () => {
  it('classifies reimbursed:* as assigned regardless of other tags', () => {
    expect(getStatus(['reimbursed:Jan-2025'])).toBe('assigned')
    expect(getStatus(['todo', 'reimbursed:Jan-2025'])).toBe('assigned')
  })

  it('classifies todo without reimbursed tag as todo', () => {
    expect(getStatus(['todo'])).toBe('todo')
  })

  it('classifies no tags / only foreign tags as non-reimbursable', () => {
    expect(getStatus([])).toBe('non-reimbursable')
    expect(getStatus(['personal'])).toBe('non-reimbursable')
  })
})

describe('getPeriodName', () => {
  it('extracts group name and returns null when absent', () => {
    expect(getPeriodName(['reimbursed:Q1-2025'])).toBe('Q1-2025')
    expect(getPeriodName(['reimbursed:a:b'])).toBe('a:b')
    expect(getPeriodName(['todo'])).toBeNull()
    expect(getPeriodName([])).toBeNull()
  })
})

describe('validatePeriodName', () => {
  it('rejects empty names, colons, and reserved words', () => {
    expect(validatePeriodName('')).not.toBeNull()
    expect(validatePeriodName('   ')).not.toBeNull()
    expect(validatePeriodName('Jan:2025')).not.toBeNull()
    expect(validatePeriodName('todo')).not.toBeNull()
  })

  it('accepts ordinary names', () => {
    expect(validatePeriodName('Jan-2025')).toBeNull()
    expect(validatePeriodName('ad-hoc 1')).toBeNull()
  })
})

describe('buildTransitionTags', () => {
  it('mark-todo adds todo, drops reimbursed:*, preserves foreign tags', () => {
    const tags = buildTransitionTags(tx(1, ['water', 'reimbursed:Old']), {
      type: 'mark-todo',
    })
    expect(tags).toHaveLength(2)
    expect(tags).toContain('todo')
    expect(tags).toContain('water')
  })

  it('exclude drops todo and reimbursed:*, preserves foreign tags', () => {
    const tags = buildTransitionTags(
      tx(1, ['water', 'todo', 'reimbursed:Old']),
      { type: 'exclude' },
    )
    expect(tags).toEqual(['water'])
  })

  it('assign replaces existing group with exactly one reimbursed tag', () => {
    const tags = buildTransitionTags(
      tx(1, ['water', 'reimbursed:Old']),
      { type: 'assign', groupName: 'New' },
    )
    expect(tags).toEqual(['water', 'reimbursed:New'])
  })

  it('assign removes todo (never coexists with reimbursed)', () => {
    const tags = buildTransitionTags(tx(1, ['todo']), {
      type: 'assign',
      groupName: 'Aug-2026',
    })
    expect(tags).toEqual(['reimbursed:Aug-2026'])
  })

  it('assign rejects invalid group names by throwing', () => {
    expect(() =>
      buildTransitionTags(tx(1, []), { type: 'assign', groupName: 'bad:name' }),
    ).toThrow()
    expect(() =>
      buildTransitionTags(tx(1, []), { type: 'assign', groupName: '' }),
    ).toThrow()
  })

  it('never mutates the input array', () => {
    const original = ['todo']
    buildTransitionTags(tx(1, original), { type: 'exclude' })
    expect(original).toEqual(['todo'])
  })
})

describe('deriveGroups', () => {
  const rows = [
    { ...tx(1, ['todo'], -100), status: getStatus(['todo']) },
    { ...tx(2, ['todo'], -50), status: getStatus(['todo']) },
    { ...tx(3, ['reimbursed:B'], -70), status: getStatus(['reimbursed:B']) },
    { ...tx(4, ['reimbursed:A'], -30), status: getStatus(['reimbursed:A']) },
    { ...tx(5, [], -20), status: getStatus([]) },
    { ...tx(6, ['water'], 200), status: getStatus(['water']) },
  ]

  it('partitions into pool, named groups sorted, and non-reimbursable', () => {
    const result = deriveGroups(rows as never)
    expect(result.pool.map((r) => r.transactionId)).toEqual([1, 2])
    expect(result.groups.map((g) => g.name)).toEqual(['A', 'B'])
    expect(result.nonReimbursable.map((r) => r.transactionId)).toEqual([5, 6])
  })

  it('computes signed totals per group', () => {
    const result = deriveGroups(rows as never)
    expect(result.groups.find((g) => g.name === 'B')!.total).toBe(-70)
    expect(result.groups.find((g) => g.name === 'A')!.total).toBe(-30)
  })
})

describe('collectGroupNames', () => {
  it('returns unique sorted group names', () => {
    const rows = [
      tx(1, ['reimbursed:B']),
      tx(2, ['reimbursed:A']),
      tx(3, ['reimbursed:A']),
      tx(4, ['todo']),
    ]
    expect(collectGroupNames(rows as never)).toEqual(['A', 'B'])
  })
})
