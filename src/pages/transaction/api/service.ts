import {
  
  AccountsService
  
  
} from '@billos/firefly-iii-sdk'
import { mapRawTransactionToRecord } from '../lib/transaction'
import type {AccountArray, TransactionArray, TransactionSplit} from '@billos/firefly-iii-sdk';
import type { TransactionRaw, TransactionRecord } from '../model/interface'
import { getFireflyClient } from '@/shared/lib/fetch-firefly'

export interface GetTransactionByAccountIdOptions {
  start?: string
  limit?: number
  page?: number
  end?: string
  type?: string
}

export async function getTransactionByAccountId(
  id: number,
  token: string,
  options?: GetTransactionByAccountIdOptions,
): Promise<Array<TransactionRecord>> {
  if (!token) throw new Error('Token required')

  const client = getFireflyClient(token)

  const result: TransactionArray = await AccountsService.listTransactionByAccount({
    path: { id: String(id) },
    query: {
      start: options?.start,
      end: options?.end,
      page: options?.page,
      limit: options?.limit,
    },
    client,
  })

  return result.data.flatMap((t) =>
    t.attributes.transactions.map((tr: TransactionSplit) =>
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
    ),
  )
}

export type ListAccountsOptions = Readonly<
  Partial<{
    limit: number
    page: number
    start: string
    end: string
    date: string
    type: string
  }>
>

export async function listAccounts(
  token?: string | null,
  _options: ListAccountsOptions = {},
) {
  if (!token) throw new Error('Token required!')

  const client = getFireflyClient(token)

  const result: AccountArray = await AccountsService.listAccount({
    query: { type: 'liability' },
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
