import { useEffect, useMemo, useState } from 'react'
import {
  createColumnHelper,
  createSortedRowModel,
  flexRender,
  stockFeatures,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/id'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import SelectionToolbar from './SelectionToolbar'
import type { DialogMode } from './SelectionToolbar'
import type { BucketKey } from './ReimbursementsPage'
import type { Column, StockFeatures } from '@tanstack/react-table'
import type { TransactionRecord } from '@/pages/transaction/model/interface'
import type { TagTransition } from '@/pages/transaction/lib/transaction'
import { getGroupNameFromTags } from '@/pages/transaction/lib/transaction'
import { formatIdr } from '@/shared/lib/format-currency'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AttachmentIcons from '@/pages/attachment/ui/AttachmentIcons'
import GroupPickerDialog from '@/components/group-picker/GroupPickerDialog'

dayjs.locale('id')
dayjs.extend(LocalizedFormat)

type Props = {
  rows: Array<TransactionRecord>
  bucketKind: BucketKey['kind']
  existingGroups: Array<string>
  isPending: boolean
  progress: { done: number; total: number } | null
  isDownloading: boolean
  downloadProgress: { done: number; total: number } | null
  onBulkAction: (
    selected: Array<TransactionRecord>,
    transition: TagTransition,
  ) => Promise<void>
  onDownload: (selected: Array<TransactionRecord>, groupName: string) => void
}

function SortableHeader({
  label,
  column,
  className,
}: {
  label: string
  column: Column<StockFeatures, TransactionRecord>
  className?: string
}) {
  return (
    <Button
      variant={column.getIsSorted() ? 'outline' : 'ghost'}
      size="sm"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className={cn('h-8 px-2 text-xs font-medium', className)}
    >
      {label}
      <ArrowUpDown className="ml-1 size-3" />
    </Button>
  )
}

const columnHelper = createColumnHelper<
  typeof stockFeatures,
  TransactionRecord
>()
const defaultColumns = columnHelper.columns([
  {
    id: 'select',
    enableSorting: false,
    size: 36,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomeRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(checked) =>
          table.toggleAllRowsSelected(checked === true)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        aria-label={`Select ${row.original.description}`}
      />
    ),
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: ({ column }) => <SortableHeader label="Date" column={column} />,
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {row.original.date.format('DD MMM YYYY')}
      </span>
    ),
    size: 110,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: ({ column }) => (
      <SortableHeader label="Description" column={column} />
    ),
    cell: ({ row }) => (
      <span className="text-sm truncate max-w-60 block">
        {row.original.description}
      </span>
    ),
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: ({ column }) => (
      <SortableHeader label="Amount" column={column} className="ml-auto" />
    ),
    cell: ({ row }) => {
      const amount = row.original.amount
      return (
        <div
          className={cn(
            'text-right font-mono text-sm tabular-nums font-medium',
            amount < 0 && 'text-negative',
            amount > 0 && 'text-positive',
          )}
        >
          {formatIdr(amount)}
        </div>
      )
    },
    size: 130,
  },
  {
    id: 'files',
    accessorFn: (row) => row.has_attachments,
    header: ({ column }) => (
      <SortableHeader label="Files" column={column} className="ml-auto" />
    ),
    cell: ({ row }) => (
      <AttachmentIcons
        journalId={row.original.id}
        hasAttachments={row.original.has_attachments}
      />
    ),
    size: 70,
    sortFn: (a, b) =>
      Number(a.original.has_attachments) - Number(b.original.has_attachments),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => (
      <Button variant="ghost" size="icon-xs" asChild>
        <a
          href={`${import.meta.env.VITE_FIREFLY_URL}/transactions/show/${row.original.transactionId}`}
          rel="noopener"
          target="_blank"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
    ),
    size: 60,
  },
])

const features = tableFeatures({
  ...stockFeatures,
  sortedRowModel: createSortedRowModel(), // if using client-side sorting
})

function MemberTable({
  rows,
  bucketKind,
  existingGroups,
  isPending,
  progress,
  isDownloading,
  downloadProgress,
  onBulkAction,
  onDownload,
}: Props) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)

  const table = useTable({
    data: rows,
    columns: defaultColumns,
    features,
    getRowId: (row) => String(row.id),
    initialState: { sorting: [{ id: 'date', desc: true }] },
    enableRowSelection: true,
    enableRowPinning: true,
  })

  useEffect(() => {
    table.resetRowSelection()
  }, [rows])

  const selected = Object.keys(table.state.rowSelection)
    .map((id) => rows.find((r) => r.id == Number(id)))
    .filter((x) => !!x)

  const groupName = useMemo(
    () => getGroupNameFromTags(selected[0]?.tags),
    [selected],
  )

  async function applyTransition(transition: TagTransition) {
    if (selected.length === 0) return
    await onBulkAction(selected, transition)
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border h-24 flex items-center justify-center text-sm text-muted-foreground">
        No transactions here.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.columnDef.size }}
                    className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground h-9"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'border-b border-border/50 transition-colors',
                    index % 2 === 0 ? 'bg-transparent' : 'bg-muted/30',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selected.length > 0 && (
        <SelectionToolbar
          count={selected.length}
          total={selected.reduce((acc, tx) => acc + tx.amount, 0)}
          bucketKind={bucketKind}
          isPending={isPending}
          progress={progress}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onApplyTransition={applyTransition}
          onDownload={() => onDownload(selected, groupName)}
          onClear={() => table.resetRowSelection()}
          onOpenDialog={setDialogMode}
        />
      )}

      {dialogMode !== null && (
        <GroupPickerDialog
          open
          mode={dialogMode}
          count={selected.length}
          existingGroups={existingGroups}
          onOpenChange={(open) => !open && setDialogMode(null)}
          onSubmit={(name) =>
            applyTransition({ type: 'assign', groupName: name })
          }
        />
      )}
    </>
  )
}

export default MemberTable
