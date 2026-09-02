import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { buildTransitionTags, getStatus } from '../lib/transaction'
import { updateTransactionTags } from './update-transaction-tags'
import type { TagTransition } from '../lib/transaction'
import type { TransactionRecord } from '../model/interface'
import { useToken } from '@/shared/auth'

export function useToggleTodo() {
  const token = useToken()
  const { mutate: toggleTodo, isPending } = useMutation({
    mutationFn: async (args: {
      transaction: TransactionRecord
      checked: boolean
    }) => {
      if (!token) throw new Error('Token required!')
      const transition: TagTransition = args.checked
        ? { type: 'mark-todo' }
        : { type: 'exclude' }
      await updateTransactionTags({
        token,
        transactionId: args.transaction.transactionId,
        transactionJournalId: args.transaction.transaction_journal_id,
        tags: buildTransitionTags(args.transaction, transition),
      })
    },
    onSuccess(_data, args, _onMutateResult, context) {
      context.client.invalidateQueries({
        queryKey: ['transactions'],
      })
      const status = getStatus(args.transaction.tags)
      toast.success(
        status === 'assigned'
          ? `Unassigned #${args.transaction.transactionId} → todo`
          : `Marked #${args.transaction.transactionId} as ${String(args.checked)}`,
      )
    },
  })

  return {
    toggleTodo: (transaction: TransactionRecord, value: boolean) =>
      toggleTodo({ transaction, checked: value }),
    isPending,
  }
}
