import { AccountsService, TransactionsService } from '@billos/firefly-iii-sdk'
import { mapRawTransactionToRecord } from '../lib/transaction'
import type {
  AccountArray,
  AccountTypeFilter,
  TransactionArray,
  TransactionSplit,
  TransactionTypeFilter,
} from '@billos/firefly-iii-sdk'

import type { TransactionRaw, TransactionRecord } from '../model/interface'
import { getFireflyClient } from '@/shared/lib/fetch-firefly'

export interface GetTransactionByAccountIdOptions {
  start?: string
  limit?: number
  page?: number
  end?: string
  type?: TransactionTypeFilter
}

function splitToRecord(t: {
  id: string
  attributes: { transactions: Array<TransactionSplit> }
}): Array<TransactionRecord> {
  return t.attributes.transactions.map((tr) =>
    mapRawTransactionToRecord({
      transactionId: Number(t.id),
      id: Number(tr.transaction_journal_id),
      description: tr.description,
      amount: Number(tr.amount),
      date: tr.date,
      has_attachments: tr.has_attachments ?? false,
      tags: tr.tags ?? [],
      transaction_journal_id: tr.transaction_journal_id ?? '',
      type: tr.type.replace(' ', '_') as TransactionRaw['type'],
    }),
  )
}

const PAGE_SIZE = 100

export async function getTransactionByAccountId(
  id: number,
  token: string,
  options?: GetTransactionByAccountIdOptions,
): Promise<Array<TransactionRecord>> {
  if (!token) throw new Error('Token required')

  const client = getFireflyClient(token)

  const recordsById = new Map<number, TransactionRecord>()
  const startPage = options?.page ?? 1
  let totalPages = startPage
  let page = startPage
  while (page <= totalPages) {
    const result: TransactionArray =
      await AccountsService.listTransactionByAccount({
        path: { id: String(id) },
        query: {
          start: options?.start,
          end: options?.end,
          type: options?.type,
          page,
          limit: options?.limit ?? PAGE_SIZE,
        },
        client,
      })

    for (const record of result.data.flatMap(splitToRecord)) {
      recordsById.set(record.id, record)
    }

    totalPages = result.meta.pagination?.total_pages ?? page
    page += 1
  }

  return [...recordsById.values()]
}

export async function getTransactionById(
  id: number,
  token: string,
): Promise<TransactionRecord | null> {
  if (!token) throw new Error('Token required')

  const client = getFireflyClient(token)

  const result = await TransactionsService.getTransaction({
    path: { id: String(id) },
    client,
  })

  const records = splitToRecord(result.data)
  return records[0] ?? null
}

export type ListAccountsOptions = Readonly<
  Partial<{
    limit: number
    page: number
    start: string
    end: string
    date: string
    type: AccountTypeFilter
  }>
>

export async function listAccounts(
  token?: string | null,
  options: ListAccountsOptions = {},
) {
  if (!token) throw new Error('Token required!')

  const client = getFireflyClient(token)

  const result: AccountArray = await AccountsService.listAccount({
    query: { type: options.type ?? 'liability' },
    client,
  })

  const data = result.data.map((r) => ({
    id: Number(r.id),
    name: r.attributes.name,
    type: r.attributes.type,
    active: r.attributes.active ?? false,
    current_balance: Number(r.attributes.current_balance),
  }))

  data.sort((a, b) => a.id - b.id)

  return data
}
