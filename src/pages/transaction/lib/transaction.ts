import dayjs from 'dayjs'
import type { TransactionRaw, TransactionRecord } from '../model/interface'

const TODO_TAG = 'todo'

export function isTodoTransaction(record: Pick<TransactionRaw, 'tags'>) {
  return record.tags.includes(TODO_TAG)
}

export function appendTodoField(data: TransactionRecord[] | null) {
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

function parseAccountName(description: string) {
  const match = String(description).match(/[-|]\s([\w\s]+)/)
  return match?.[1] ?? null
}

export function mapRawTransactionToRecord(transaction: TransactionRaw) {
  return {
    ...transaction,
    transactionId: Number(transaction.transactionId),
    id: Number(transaction.transaction_journal_id),
    amount:
      transaction.type === 'withdrawal'
        ? -Number(transaction.amount)
        : Number(transaction.amount),
    account: parseAccountName(transaction.description),
    date: dayjs(transaction.date),
    isTodo: isTodoTransaction(transaction),
  } as unknown as TransactionRecord
}
