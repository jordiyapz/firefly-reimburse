import { getToken } from '@/shared/auth'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getTransactionByAccountIdOptions } from '../api/query'

export function useTransactionData(accountId: number | null) {
  const transactionQuery = useQuery(
    getTransactionByAccountIdOptions({
      id: accountId,
      token: getToken(),
      options: { start: '2025-11-16' },
    }),
  )
  const data = transactionQuery.data

  const initialData = useMemo(() => {
    const res = data
    if (!res) return []

    res.sort((a, b) => a.date.diff(b.date))
    res.sort((a, b) => {
      if (!a.account || !b.account) return 0
      return a.account.localeCompare(b.account)
    })
    return res
  }, [data])

  return initialData
}
