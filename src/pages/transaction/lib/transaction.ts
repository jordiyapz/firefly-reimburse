import dayjs from 'dayjs'
import type { TransactionRaw, TransactionRecord } from '../model/interface'

const TODO_TAG = 'todo'

export function isTodoTransaction(record: Pick<TransactionRaw, 'tags'>) {
  return record.tags.includes(TODO_TAG)
}

export function appendTodoField(data: Array<TransactionRecord> | null) {
  const res = data?.map((row) => ({
    ...row,
    isTodo: row.tags ? isTodoTransaction(row) : false,
  }))
  if (!res) return []

  res.sort((a, b) => a.date.diff(b.date))
  res.sort((a, b) => {
    if (!a.account || !b.account) return 0
    return a.account.localeCompare(b.account)
  })

  return res
}

export function updateTodoTagsImmutable(
  transaction: Pick<TransactionRaw, 'tags'>,
  value: boolean,
) {
  return value
    ? [...transaction.tags, TODO_TAG]
    : transaction.tags.filter((tag) => tag !== TODO_TAG)
}

function parseAccountName(description: string): string | undefined {
  const match = String(description).match(/[-|]\s([\w\s]+)/)
  return match?.[1] ?? undefined
}

export function mapRawTransactionToRecord(transaction: TransactionRaw): TransactionRecord {
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
    isTodo: isTodoTransaction(transaction),
  }
}

export function computeOutstandingTotal(transactions: Array<TransactionRecord>) {
  return transactions
    .filter((row) => row.isTodo)
    .reduce((acc, row) => acc + row.amount, 0)
}

export function countTodoTransactions(transactions: Array<TransactionRecord>) {
  return transactions.filter((r) => r.isTodo).length
}
