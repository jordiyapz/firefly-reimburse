import { getToken } from '@/shared/auth'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getTransactionByAccountIdOptions } from '../api/query'
import { appendTodoField } from '../lib/transaction'

export function useTransactionData(accountId: number | null) {
  const transactionQuery = useQuery(
    getTransactionByAccountIdOptions({
      id: accountId,
      token: getToken(),
      options: { start: '2025-11-16', limit: 100 },
    }),
  )
  const data = transactionQuery.data

  const initialData = useMemo(() => appendTodoField(data ?? []), [data])

  return initialData
}
