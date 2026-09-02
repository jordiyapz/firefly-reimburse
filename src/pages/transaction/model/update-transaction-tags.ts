import { TransactionsService } from '@billos/firefly-iii-sdk'
import { getFireflyClient } from '@/shared/lib/fetch-firefly'

export interface UpdateTagsArgs {
  token: string
  transactionId: number
  transactionJournalId: string
  tags: Array<string>
}

export async function updateTransactionTags(args: UpdateTagsArgs) {
  const client = getFireflyClient(args.token)
  await TransactionsService.updateTransaction({
    path: { id: String(args.transactionId) },
    body: {
      apply_rules: false,
      fire_webhooks: false,
      transactions: [
        {
          transaction_journal_id: args.transactionJournalId,
          tags: [...args.tags],
        },
      ],
    },
    client,
  })
}
