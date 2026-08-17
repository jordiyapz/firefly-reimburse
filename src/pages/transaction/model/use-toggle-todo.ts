import { useMutation } from '@tanstack/react-query'
import { TransactionsService } from '@billos/firefly-iii-sdk'
import toast from 'react-hot-toast'
import { updateTodoTagsImmutable } from '../lib/transaction'
import type { TransactionRecord } from '../model/interface'
import { getFireflyClient } from '@/shared/lib/fetch-firefly'

export function useToggleTodo(token: string | null) {
  const { mutate: toggleTodo, isPending } = useMutation({
    mutationFn: async (args: {
      transaction: TransactionRecord
      checked: boolean
    }) => {
      if (!token) throw new Error('Token required!')
      const client = getFireflyClient(token)
      await TransactionsService.updateTransaction({
        path: { id: String(args.transaction.transactionId) },
        body: {
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              transaction_journal_id: args.transaction['transaction_journal_id'],
              tags: updateTodoTagsImmutable(args.transaction, args.checked),
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
        'Updated todo for transaction #' + args.transaction.transactionId + ' as ' + String(args.checked),
      )
    },
  })

  return {
    toggleTodo: (transaction: TransactionRecord, value: boolean) =>
      toggleTodo({ transaction, checked: value }),
    isPending,
  }
}
