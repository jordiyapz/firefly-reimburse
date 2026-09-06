import { DownloadIcon } from 'lucide-react'
import type { TagTransition } from '@/pages/transaction/lib/transaction'
import type { BucketKey } from './ReimbursementsPage'
import { formatIdr } from '@/shared/lib/format-currency'
import { Button } from '@/components/ui/button'

export type DialogMode = 'assign' | 'move' | null

type Props = {
  count: number
  total: number
  bucketKind: BucketKey['kind']
  isPending: boolean
  progress: { done: number; total: number } | null
  isDownloading: boolean
  downloadProgress: { done: number; total: number } | null
  onApplyTransition: (transition: TagTransition) => void
  onDownload: () => void
  onClear: () => void
  onOpenDialog: (mode: DialogMode) => void
}

function SelectionToolbar({
  count,
  total,
  bucketKind,
  isPending,
  progress,
  isDownloading,
  downloadProgress,
  onApplyTransition,
  onDownload,
  onClear,
  onOpenDialog,
}: Props) {
  return (
    <div className="border border-border rounded-lg bg-background p-2 shadow-lg flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground px-1 mr-auto">
        {count} selected · {formatIdr(total)}
      </span>
      {isPending && progress && (
        <span className="text-xs text-muted-foreground tabular-nums">
          Updating… {progress.done}/{progress.total}
        </span>
      )}
      {isDownloading && downloadProgress && (
        <span className="text-xs text-muted-foreground tabular-nums">
          Downloading… {downloadProgress.done}/{downloadProgress.total}
        </span>
      )}
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => onOpenDialog(bucketKind === 'group' ? 'move' : 'assign')}
      >
        {bucketKind === 'group' ? 'Move to…' : 'New reimbursement…'}
      </Button>
      {bucketKind === 'group' && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onApplyTransition({ type: 'mark-todo' })}
        >
          Unassign → todo
        </Button>
      )}
      {bucketKind !== 'non-reimbursable' && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onApplyTransition({ type: 'exclude' })}
        >
          Mark non-reimbursable
        </Button>
      )}
      {bucketKind === 'non-reimbursable' && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => onApplyTransition({ type: 'mark-todo' })}
        >
          Mark reimbursable
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isDownloading || isPending}
        onClick={onDownload}
      >
        <DownloadIcon className="size-3.5 mr-1" />
        Download Files
      </Button>
    </div>
  )
}

export default SelectionToolbar
