import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getTransactionByAccountIdOptions } from '../api/query'
import { appendStatusField } from '../lib/transaction'

export function useTransactionData(accountId: number | null, token: string | null) {
  const transactionQuery = useQuery(
    getTransactionByAccountIdOptions({
      id: accountId,
      token,
      options: {},
    }),
  )
  const data = transactionQuery.data
  const transactions = useMemo(() => appendStatusField(data ?? []), [data])
  return transactions
}
