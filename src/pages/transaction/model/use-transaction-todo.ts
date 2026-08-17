import { useMutation, useQuery } from '@tanstack/react-query'
import { TransactionsService } from '@billos/firefly-iii-sdk'
import toast from 'react-hot-toast'
import {
  mapRawTransactionToRecord,
  updateTodoTagsImmutable,
} from '../lib/transaction'
import type { TransactionSplit } from '@billos/firefly-iii-sdk'
import type {
  TransactionID,
  TransactionRaw,
  TransactionRecord,
} from '../model/interface'
import { getFireflyClient } from '@/shared/lib/fetch-firefly'
import { getToken } from '@/shared/auth'

export function useTransactionTodo(tid: TransactionID) {
  const token = getToken()

  const { data: transaction, ...todoQuery } = useQuery({
    queryKey: ['transactions', tid, 'todo'],
    queryFn: async () => {
      if (!token) return null
      const client = getFireflyClient(token)
      const result = await TransactionsService.getTransaction({
        path: { id: String(tid) },
        client,
      })
      const split: TransactionSplit = result.data.attributes.transactions[0]
      return mapRawTransactionToRecord({
        transactionId: Number(result.data.id),
        id: Number(split.transaction_journal_id),
        description: split.description,
        amount: Number(split.amount),
        date: split.date,
        has_attachments: split.has_attachments ?? false,
        tags: split.tags ?? [],
        transaction_journal_id: split.transaction_journal_id ?? '',
        type: split.type.replace(' ', '_') as TransactionRaw['type'],
      })
    },
    enabled: !!token,
  })

  const { mutate: toggleIsTodo, isPending } = useMutation({
    mutationFn: async (args: {
      transaction: TransactionRecord
      checked: boolean
    }) => {
      if (!token) throw new Error('Token required!')
      if (!transaction) throw new Error('Transaction does not exist')
      const client = getFireflyClient(token)
      await TransactionsService.updateTransaction({
        path: { id: String(tid) },
        body: {
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              transaction_journal_id: transaction['transaction_journal_id'],
              tags: updateTodoTagsImmutable(transaction, args.checked),
            },
          ],
        },
        client,
      })
    },
    onSuccess(_data, args, _onMutateResult, context) {
      context.client.invalidateQueries({
        queryKey: ['transactions'],
      })
      toast.success(
        'Updated todo for transaction #' + tid + ' as ' + String(args.checked),
      )
    },
  })
  return {
    isTodo: transaction?.isTodo ?? false,
    setTodo: (transaction: TransactionRecord, value: boolean) =>
      toggleIsTodo({ transaction, checked: value }),
    transaction,
    isLoading: todoQuery.isLoading || isPending,
  }
}
