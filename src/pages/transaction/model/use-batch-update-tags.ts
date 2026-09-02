import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { buildTransitionTags } from '../lib/transaction'
import { updateTransactionTags } from './update-transaction-tags'
import type { TagTransition } from '../lib/transaction'
import type { TransactionRecord } from '../model/interface'
import { useToken } from '@/shared/auth'

export interface BatchUpdateArgs {
  transactions: Array<TransactionRecord>
  transition: TagTransition
}

export interface BatchResult {
  succeeded: number
  failed: Array<{ transaction: TransactionRecord; error: unknown }>
}

export function useBatchUpdateTags() {
  const token = useToken()
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  )

  const mutation = useMutation({
    mutationFn: async (args: BatchUpdateArgs): Promise<BatchResult> => {
      if (!token) throw new Error('Token required!')
      const { transactions, transition } = args
      setProgress({ done: 0, total: transactions.length })

      const result: BatchResult = { succeeded: 0, failed: [] }
      for (const [index, transaction] of transactions.entries()) {
        try {
          await updateTransactionTags({
            token,
            transactionId: transaction.transactionId,
            transactionJournalId: transaction.transaction_journal_id,
            tags: buildTransitionTags(transaction, transition),
          })
          result.succeeded += 1
        } catch (error) {
          result.failed.push({ transaction, error })
        }
        setProgress({ done: index + 1, total: transactions.length })
      }
      return result
    },
    onSuccess(result) {
      toast.success(
        `Updated ${result.succeeded} transaction${result.succeeded === 1 ? '' : 's'}` +
          (result.failed.length > 0 ? `, ${result.failed.length} failed` : ''),
      )
      if (result.failed.length > 0) {
        const ids = result.failed
          .map(({ transaction }) => `#${transaction.transactionId}`)
          .join(', ')
        toast.error(`Failed to update: ${ids}`)
      }
    },
    onSettled(_data, _error, _vars, _onMutateResult, context) {
      context.client.invalidateQueries({ queryKey: ['transactions'] })
      setProgress(null)
    },
  })

  return {
    runBatch: mutation.mutate,
    runBatchAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    progress,
  }
}
