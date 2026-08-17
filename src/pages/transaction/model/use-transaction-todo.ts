import { useQuery } from '@tanstack/react-query'
import { getTransactionByIdOptions } from '../api/query'
import type { TransactionID } from '../model/interface'

export function useTransactionTodo(tid: TransactionID, token: string | null) {
  const { data: transaction, ...todoQuery } = useQuery(
    getTransactionByIdOptions({ id: tid, token }),
  )

  return {
    isTodo: transaction?.isTodo ?? false,
    transaction,
    isLoading: todoQuery.isLoading,
  }
}
