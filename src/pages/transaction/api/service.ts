import type {
  AccountType,
  TransactionRaw,
  TransactionRecord,
  TransactionType,
} from '../model/interface'

import { fetchFirefly } from '@/shared/lib/fetch-firefly'
import { mapRawTransactionToRecord } from '../lib/transaction'

export interface GetTransactionByAccountIdOptions {
  start?: string
  limit?: number
  page?: number
  end?: string
  type?: TransactionType
}

export async function getTransactionByAccountId(
  id: number,
  token: string,
  options?: GetTransactionByAccountIdOptions,
) {
  if (!token) throw new Error('Token required')

  const url = `/accounts/${id}/transactions`
  const searchParams = new URLSearchParams(
    Object.entries(options ?? {}).map(([key, val]) => [key, String(val)]),
  )

  const result = await fetchFirefly(`${url}?${searchParams.toString()}`, token)

  if (!result) return null

  const processed: TransactionRecord[] = result?.data
    .flatMap(
      (t: any) =>
        t.attributes.transactions.map((tr: any) => ({
          ...tr,
          transactionId: t.id,
        })) as TransactionRaw,
    )
    .map(mapRawTransactionToRecord)

  return processed
}

export type ListAccountsOptions = Readonly<
  Partial<{
    /** default 50 items */
    limit: number
    page: number
    /** format: YYYY-MM-DD */
    start: string
    /** format: YYYY-MM-DD */
    end: string
    /** format: YYYY-MM-DD */
    date: string
    type: AccountType
  }>
>

function sanitizeOptions(options: Record<string, string | number>) {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [key, String(value)]),
  )
}

export async function listAccounts(
  token?: string | null,
  options: ListAccountsOptions = {},
) {
  if (!token) throw new Error('Token required!')
  const baseUrl = '/accounts'
  const searchParams = new URLSearchParams(sanitizeOptions(options))
  const url = baseUrl + '?' + searchParams.toString()

  const res = await fetchFirefly(url, token)
  const data = res.data.map((r: any) => ({
    ...r.attributes,
    id: Number(r.id),
    current_balance: Number(r.attributes.current_balance),
  })) as Array<{
    id: number
    name: string
    type: string
    active: boolean
    current_balance: number
  }>

  data.sort((a, b) => a.id - b.id)

  return data
}
