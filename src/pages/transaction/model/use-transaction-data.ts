import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getTransactionByAccountIdOptions } from '../api/query'
import { appendTodoField } from '../lib/transaction'
import { getToken } from '@/shared/auth'

export function useTransactionData(accountId: number | null) {
  const transactionQuery = useQuery(
    getTransactionByAccountIdOptions({
      id: accountId,
      token: getToken(),
      options: {},
    }),
  )
  const data = transactionQuery.data
  const transactions = useMemo(() => appendTodoField(data ?? []), [data])
  return transactions
}
