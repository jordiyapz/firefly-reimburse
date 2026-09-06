import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  FolderOpenIcon,
  ListChecksIcon,
  SlashSquareIcon,
} from 'lucide-react'
import GroupList from './GroupList'
import MemberTable from './MemberTable'
import type { ReimbursementsSearch } from '@/routes/reimbursements'
import type { TagTransition } from '@/pages/transaction/lib/transaction'
import type { TransactionRecord } from '@/pages/transaction/model/interface'
import { useTransactionData } from '@/pages/transaction/model/use-transaction-data'
import {
  collectGroupNames,
  computeOutstandingTotal,
  deriveGroups,
} from '@/pages/transaction/lib/transaction'
import { useBatchUpdateTags } from '@/pages/transaction/model/use-batch-update-tags'
import { useBatchDownload } from '@/pages/attachment/model/use-batch-download'
import { useToken } from '@/shared/auth'
import { AppShell, useSelectedAccount } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

export type BucketKey =
  | { kind: 'pool' }
  | { kind: 'group'; name: string }
  | { kind: 'non-reimbursable' }

function ReimbursementsContent() {
  const token = useToken()
  const { accountId } = useSelectedAccount()
  const transactions = useTransactionData(accountId, token)
  const buckets = useMemo(() => deriveGroups(transactions), [transactions])
  const existingGroups = useMemo(
    () => collectGroupNames(transactions),
    [transactions],
  )
  const navigate = useNavigate({ from: '/reimbursements' })
  const { bucket: bucketParam } = useSearch({ from: '/reimbursements' })

  const bucket: BucketKey = useMemo(() => {
    if (bucketParam === 'pool') return { kind: 'pool' }
    if (bucketParam === 'non-reimbursable') return { kind: 'non-reimbursable' }
    if (bucketParam.startsWith('group:')) {
      return { kind: 'group', name: bucketParam.slice(6) }
    }
    return { kind: 'pool' }
  }, [bucketParam])

  const updateSearch = useCallback(
    (patch: Partial<ReimbursementsSearch>) => {
      navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )

  const { runBatchAsync, isPending, progress } = useBatchUpdateTags()
  const {
    isDownloading,
    progress: downloadProgress,
    error: downloadError,
    downloadSelected,
    clearError,
  } = useBatchDownload()

  function switchBucket(next: BucketKey) {
    if (next.kind === 'pool') {
      updateSearch({ bucket: 'pool' })
    } else if (next.kind === 'non-reimbursable') {
      updateSearch({ bucket: 'non-reimbursable' })
    } else {
      updateSearch({ bucket: `group:${next.name}` })
    }
  }

  const items = useMemo(() => {
    if (bucket.kind === 'pool') return buckets.pool
    if (bucket.kind === 'non-reimbursable') return buckets.nonReimbursable
    return buckets.groups.find((g) => g.name === bucket.name)?.items ?? []
  }, [bucket, buckets])

  const outstandingTotal = computeOutstandingTotal(buckets.pool)

  async function handleBulkAction(
    selected: Array<TransactionRecord>,
    transition: TagTransition,
  ) {
    await runBatchAsync({ transactions: selected, transition })
  }

  function handleDownload(
    selected: Array<TransactionRecord>,
    groupName: string,
  ) {
    downloadSelected(selected, groupName)
  }

  if (accountId === null) {
    return (
      <p className="px-6 py-10 text-sm text-muted-foreground">
        Select an account to view its reimbursements.
      </p>
    )
  }

  return (
    <div className="flex">
      <aside className="w-64 shrink-0 border-r border-border min-h-[calc(100vh-120px)] py-4 overflow-y-auto">
        <GroupList
          buckets={buckets}
          activeBucket={bucket}
          onSelect={switchBucket}
          outstandingTotal={outstandingTotal}
        />
      </aside>

      <section className="flex-1 min-w-0 px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {bucket.kind === 'pool' && (
              <span className="inline-flex items-center gap-1.5">
                <ListChecksIcon className="size-4 text-muted-foreground" />
                Todo pool
              </span>
            )}
            {bucket.kind === 'group' && (
              <span className="inline-flex items-center gap-1.5">
                <FolderOpenIcon className="size-4 text-muted-foreground" />
                {bucket.name}
              </span>
            )}
            {bucket.kind === 'non-reimbursable' && (
              <span className="inline-flex items-center gap-1.5">
                <SlashSquareIcon className="size-4 text-muted-foreground" />
                Non-reimbursable
              </span>
            )}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {items.length} transaction{items.length === 1 ? '' : 's'}
            </span>
          </h3>
        </div>

        <MemberTable
          rows={items}
          bucketKind={bucket.kind}
          existingGroups={existingGroups}
          isPending={isPending}
          progress={progress}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onBulkAction={handleBulkAction}
          onDownload={handleDownload}
        />

        {downloadError && (
          <div className="border border-destructive/50 rounded-lg bg-destructive/10 p-2 text-xs text-destructive flex items-center justify-between">
            <span>{downloadError}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

function ReimbursementsPage() {
  return (
    <AppShell title="reimbursements">
      <ReimbursementsContent />
    </AppShell>
  )
}

export default ReimbursementsPage
