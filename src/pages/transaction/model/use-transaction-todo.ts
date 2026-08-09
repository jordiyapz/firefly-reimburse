import { useMutation, useQuery } from '@tanstack/react-query'
import type { TransactionID, TransactionRecord } from '../model/interface'
import { fetchFirefly } from '@/shared/lib/fetch-firefly'
import { getToken } from '@/shared/auth'
import {
  mapRawTransactionToRecord,
  updateTodoTagsImmutable,
} from '../lib/transaction'
import toast from 'react-hot-toast'

export function useTransactionTodo(tid: TransactionID) {
  const token = getToken()

  const { data: transaction } = useQuery({
    queryKey: ['transactions', tid, 'todo'],
    queryFn: async () => {
      if (!token) return null
      const data = await fetchFirefly(`/transactions/${tid}`, token)
      const result = mapRawTransactionToRecord(
        data.data.attributes.transactions[0],
      )
      return result
    },
    initialData: null,
    enabled: !!token,
  })

  const { mutate: toggleIsTodo } = useMutation({
    mutationFn: async (args: {
      transaction: TransactionRecord
      checked: boolean
    }) => {
      if (!token) throw new Error('Token required!')
      if (!transaction) throw new Error('Transaction does not exist')
      fetchFirefly(`/transactions/${args.transaction.transactionId}`, token, {
        method: 'put',
        body: JSON.stringify({
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              transaction_journal_id: transaction['transaction_journal_id'],
              tags: updateTodoTagsImmutable(transaction, args.checked),
            },
          ],
        }),
      })
    },
    onSuccess(_data, variables, _onMutateResult, context) {
      context.client.invalidateQueries({
        queryKey: ['transactions', variables.transaction.transactionId, 'todo'],
      })
      toast.success(
        'Updated todo for transaction #' + variables.transaction.transactionId,
      )
    },
  })
  return {
    isTodo: transaction?.isTodo ?? false,
    setTodo: (transaction: TransactionRecord, value: boolean) =>
      toggleIsTodo({ transaction, checked: value }),
    transaction,
  }
}
