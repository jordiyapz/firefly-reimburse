import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getTransactionByAccountIdOptions } from '../api/query'
import { appendTodoField } from '../lib/transaction'

export function useTransactionData(accountId: number | null, token: string | null) {
  const transactionQuery = useQuery(
    getTransactionByAccountIdOptions({
      id: accountId,
      token,
      options: {},
    }),
  )
  const data = transactionQuery.data
  const transactions = useMemo(() => appendTodoField(data ?? []), [data])
  return transactions
}
