import { useCallback, useMemo, useState } from 'react'
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
import { useTransactionData } from '@/pages/transaction/model/use-transaction-data'
import { collectGroupNames, computeOutstandingTotal, deriveGroups } from '@/pages/transaction/lib/transaction'
import { useBatchUpdateTags } from '@/pages/transaction/model/use-batch-update-tags'
import { useToken } from '@/shared/auth'
import { AppShell, useSelectedAccount } from '@/components/layout/AppShell'
import GroupPickerDialog from '@/components/group-picker/GroupPickerDialog'
import { Button } from '@/components/ui/button'
import { formatIdr } from '@/shared/lib/format-currency'

export type BucketKey =
  | { kind: 'pool' }
  | { kind: 'group'; name: string }
  | { kind: 'non-reimbursable' }

type DialogMode = 'assign' | 'move' | null

function ReimbursementsContent() {
  const token = useToken()
  const { accountId } = useSelectedAccount()
  const transactions = useTransactionData(accountId, token)
  const buckets = useMemo(() => deriveGroups(transactions), [transactions])
  const existingGroups = useMemo(() => collectGroupNames(transactions), [transactions])
  const navigate = useNavigate({ from: '/reimbursements' })
  const { bucket: bucketParam } = useSearch({ from: '/reimbursements' })

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)

  // Parse bucket param into BucketKey
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

  function switchBucket(next: BucketKey) {
    setSelectedIds(new Set())
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

  const selected = items.filter((tx) => selectedIds.has(tx.id))
  const outstandingTotal = computeOutstandingTotal(buckets.pool)

  async function applyTransition(transition: TagTransition) {
    if (selected.length === 0) return
    await runBatchAsync({ transactions: selected, transition })
    setSelectedIds(new Set())
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
          {isPending && progress && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Updating… {progress.done}/{progress.total}
            </span>
          )}
        </div>

        <MemberTable
          rows={items}
          selectedIds={selectedIds}
          onToggle={(id, checked) =>
            setSelectedIds((prev) => {
              const next = new Set(prev)
              if (checked) next.add(id)
              else next.delete(id)
              return next
            })
          }
          onToggleAll={(checked) =>
            setSelectedIds(checked ? new Set(items.map((tx) => tx.id)) : new Set())
          }
        />

        {selected.length > 0 && (
          <div className="border border-border rounded-lg bg-background p-2 shadow-lg flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground px-1 mr-auto">
              {selected.length} selected ·{' '}
              {formatIdr(selected.reduce((acc, tx) => acc + tx.amount, 0))}
            </span>
            {(bucket.kind === 'pool' || bucket.kind === 'group') && (
              <>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => setDialogMode(bucket.kind === 'group' ? 'move' : 'assign')}
                >
                  {bucket.kind === 'group' ? 'Move to…' : 'New reimbursement…'}
                </Button>
                {bucket.kind === 'group' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => applyTransition({ type: 'mark-todo' })}
                  >
                    Unassign → todo
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => applyTransition({ type: 'exclude' })}
                >
                  Mark non-reimbursable
                </Button>
              </>
            )}
            {bucket.kind === 'non-reimbursable' && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => applyTransition({ type: 'mark-todo' })}
              >
                Mark reimbursable
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </section>

      {dialogMode !== null && (
        <GroupPickerDialog
          open
          mode={dialogMode}
          count={selected.length}
          existingGroups={existingGroups}
          onOpenChange={(open) => !open && setDialogMode(null)}
          onSubmit={(groupName) => applyTransition({ type: 'assign', groupName })}
        />
      )}
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
