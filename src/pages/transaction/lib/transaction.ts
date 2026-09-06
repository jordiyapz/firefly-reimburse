import dayjs from 'dayjs'
import type { TransactionRaw, TransactionRecord } from '../model/interface'

export const TODO_TAG = 'todo'
export const REIMBURSED_PREFIX = 'reimbursed:'

export type TransactionStatus = 'assigned' | 'todo' | 'non-reimbursable'

export type TagTransition =
  | { type: 'mark-todo' }
  | { type: 'exclude' }
  | { type: 'assign'; groupName: string }

export function isTodoTransaction(record: Pick<TransactionRaw, 'tags'>) {
  return record.tags.includes(TODO_TAG)
}

export function getPeriodName(tags: Array<string>): string | null {
  const tag = tags.find((t) => t.startsWith(REIMBURSED_PREFIX))
  return tag ? tag.slice(REIMBURSED_PREFIX.length) : null
}

export function getGroupNameFromTags(
  tags: Array<string> | undefined,
  fallback = 'attachments',
): string {
  return getPeriodName(tags ?? []) ?? fallback
}

export function getStatus(tags: Array<string>): TransactionStatus {
  if (getPeriodName(tags) !== null) return 'assigned'
  if (isTodoTransaction({ tags })) return 'todo'
  return 'non-reimbursable'
}

export function makeReimbursedTag(groupName: string): string {
  return `${REIMBURSED_PREFIX}${groupName}`
}

const RESERVED_GROUP_NAMES = [TODO_TAG]

export function validatePeriodName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'Name must not be empty'
  if (trimmed.includes(':')) return "Name must not contain ':'"
  if (RESERVED_GROUP_NAMES.includes(trimmed))
    return `"${trimmed}" is a reserved name`
  return null
}

function normalizeTags(tags: Array<string>): Array<string> {
  return [...new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0))]
}

export function buildTransitionTags(
  transaction: Pick<TransactionRaw, 'tags'>,
  transition: TagTransition,
): Array<string> {
  const current = normalizeTags(transaction.tags)
  const withoutTodo = current.filter((tag) => tag !== TODO_TAG)
  const foreign = withoutTodo.filter(
    (tag) => !tag.startsWith(REIMBURSED_PREFIX),
  )

  switch (transition.type) {
    case 'mark-todo':
      return [...foreign, TODO_TAG]
    case 'exclude':
      return foreign
    case 'assign': {
      const error = validatePeriodName(transition.groupName)
      if (error) throw new Error(`Invalid group name: ${error}`)
      return [...foreign, makeReimbursedTag(transition.groupName.trim())]
    }
  }
}

export interface ReimbursementGroup {
  name: string
  items: Array<TransactionRecord>
  total: number
}

export interface DerivedBuckets {
  pool: Array<TransactionRecord>
  groups: Array<ReimbursementGroup>
  nonReimbursable: Array<TransactionRecord>
}

export function deriveGroups(
  transactions: Array<TransactionRecord>,
): DerivedBuckets {
  const pool: Array<TransactionRecord> = []
  const nonReimbursable: Array<TransactionRecord> = []
  const groupMap = new Map<string, Array<TransactionRecord>>()

  for (const tx of transactions) {
    switch (tx.status) {
      case 'todo':
        pool.push(tx)
        break
      case 'assigned': {
        const name = getPeriodName(tx.tags)!
        const bucket = groupMap.get(name)
        if (bucket) bucket.push(tx)
        else groupMap.set(name, [tx])
        break
      }
      case 'non-reimbursable':
        nonReimbursable.push(tx)
        break
    }
  }

  const groups: Array<ReimbursementGroup> = [...groupMap.entries()]
    .map(([name, items]) => ({
      name,
      items,
      total: items.reduce((acc, item) => acc + item.amount, 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { pool, groups, nonReimbursable }
}

export function collectGroupNames(
  transactions: Array<TransactionRecord>,
): Array<string> {
  return transactions
    .map((tx) => getPeriodName(tx.tags))
    .filter((name): name is string => name !== null)
    .reduce<Array<string>>(
      (names, name) => (names.includes(name) ? names : [...names, name]),
      [],
    )
    .sort((a, b) => a.localeCompare(b))
}

export function appendStatusField(data: Array<TransactionRecord> | null) {
  const res = data?.map((row) => ({
    ...row,
  }))
  if (!res) return []

  res.sort((a, b) => a.date.diff(b.date))

  return res
}

function parseAccountName(description: string): string | undefined {
  const match = String(description).match(/[-|]\s([\w\s]+)/)
  return match?.[1] ?? undefined
}

export function mapRawTransactionToRecord(
  transaction: TransactionRaw,
): TransactionRecord {
  return {
    transactionId: Number(transaction.transactionId),
    id: Number(transaction.transaction_journal_id),
    description: transaction.description,
    amount:
      transaction.type === 'withdrawal'
        ? -Number(transaction.amount)
        : Number(transaction.amount),
    date: dayjs(transaction.date),
    has_attachments: transaction.has_attachments,
    tags: transaction.tags,
    transaction_journal_id: transaction.transaction_journal_id,
    type: transaction.type,
    account: parseAccountName(transaction.description),
    status: getStatus(transaction.tags),
  }
}

export function computeOutstandingTotal(
  transactions: Array<TransactionRecord>,
) {
  return transactions
    .filter((row) => row.status === 'todo')
    .reduce((acc, row) => acc + row.amount, 0)
}

export function countTodoTransactions(transactions: Array<TransactionRecord>) {
  return transactions.filter((r) => r.status === 'todo').length
}
