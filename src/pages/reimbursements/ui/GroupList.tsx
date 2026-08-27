import { ChevronDownIcon, FolderIcon, ListChecksIcon, SlashSquareIcon } from 'lucide-react'
import { useState } from 'react'
import type { DerivedBuckets } from '@/pages/transaction/lib/transaction'
import type { BucketKey } from './ReimbursementsPage'
import { formatIdr } from '@/shared/lib/format-currency'
import { cn } from '@/lib/utils'

type Props = {
  buckets: DerivedBuckets
  activeBucket: BucketKey
  onSelect: (bucket: BucketKey) => void
  outstandingTotal: number
}

function isSameBucket(a: BucketKey, b: BucketKey) {
  if (a.kind !== b.kind) return false
  if (a.kind === 'group' && b.kind === 'group') return a.name === b.name
  return true
}

function Row({
  active,
  onClick,
  icon,
  label,
  meta,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  meta?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
        active
          ? 'bg-accent text-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {icon}
      <span className="truncate flex-1">{label}</span>
      <span className="font-mono text-xs tabular-nums shrink-0">
        {meta ?? ''}
      </span>
    </button>
  )
}

function GroupList({ buckets, activeBucket, onSelect, outstandingTotal }: Props) {
  const [showNonReimbursable, setShowNonReimbursable] = useState(false)

  return (
    <div className="flex flex-col gap-0.5 px-2">
      <p className="px-3 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Buckets
      </p>

      <Row
        active={isSameBucket(activeBucket, { kind: 'pool' })}
        onClick={() => onSelect({ kind: 'pool' })}
        icon={<ListChecksIcon className="size-4 shrink-0" />}
        label="Todo pool"
        meta={formatIdr(outstandingTotal)}
      />
      <div className="text-[10px] text-muted-foreground px-3 pb-1 -mt-0.5">
        {buckets.pool.length} pending
      </div>

      {buckets.groups.length > 0 && (
        <>
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Groups
          </p>
          {buckets.groups.map((group) => (
            <Row
              key={group.name}
              active={isSameBucket(activeBucket, { kind: 'group', name: group.name })}
              onClick={() => onSelect({ kind: 'group', name: group.name })}
              icon={<FolderIcon className="size-4 shrink-0" />}
              label={group.name}
              meta={formatIdr(group.total)}
            />
          ))}
        </>
      )}

      <button
        onClick={() => setShowNonReimbursable((v) => !v)}
        className="flex items-center gap-1 px-3 pt-4 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDownIcon
          className={cn(
            'size-3 transition-transform',
            !showNonReimbursable && '-rotate-90',
          )}
        />
        Non-reimbursable ({buckets.nonReimbursable.length})
      </button>

      {showNonReimbursable &&
        (buckets.nonReimbursable.length > 0 ? (
          <Row
            active={isSameBucket(activeBucket, { kind: 'non-reimbursable' })}
            onClick={() => onSelect({ kind: 'non-reimbursable' })}
            icon={<SlashSquareIcon className="size-4 shrink-0" />}
            label="View all"
            meta={`${buckets.nonReimbursable.length}`}
          />
        ) : (
          <p className="px-3 py-1 text-xs text-muted-foreground">Nothing excluded</p>
        ))}
    </div>
  )
}

export default GroupList
