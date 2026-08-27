import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import {
  ArrowUpDown,
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLink,
} from 'lucide-react'
import { collectGroupNames, getPeriodName } from '../lib/transaction'
import { useBatchUpdateTags } from '../model/use-batch-update-tags'
import TodoSwitch from './TodoSwitch'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import type { TagTransition } from '../lib/transaction'
import type { TransactionRecord } from '../model/interface'
import GroupPickerDialog from '@/components/group-picker/GroupPickerDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { formatIdr } from '@/shared/lib/format-currency'
import { cn } from '@/lib/utils'

dayjs.locale('id')
dayjs.extend(LocalizedFormat)

const PAGE_SIZE = 50

type StatusFilter = 'all' | 'todo' | 'assigned' | 'non-reimbursable'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'non-reimbursable', label: 'Excluded' },
]

export const columns: Array<ColumnDef<TransactionRecord>> = [
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
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
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
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium"
      >
        Date
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.date
      return (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {date.format('DD MMM YYYY')}
        </span>
      )
    },
    size: 110,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium"
      >
        Description
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const desc = row.original.description
      return (
        <span className="text-sm truncate max-w-60 block">{desc}</span>
      )
    },
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium ml-auto"
      >
        Amount
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
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
    id: 'status',
    accessorFn: (row) => getPeriodName(row.tags),
    enableSorting: true,
    header: 'Status',
    cell: ({ row }) => {
      const { status } = row.original
      const periodName = getPeriodName(row.original.tags)
      if (status === 'todo') return <Badge variant="todo">Todo</Badge>
      if (status === 'assigned')
        return <Badge variant="assigned">{periodName}</Badge>
      return <Badge variant="muted">—</Badge>
    },
    size: 120,
  },
  {
    accessorKey: 'has_attachments',
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium ml-auto"
      >
        Has File
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const has = row.original.has_attachments
      if (!has) return null
      return <Check className="size-4 text-positive" />
    },
    size: 40,
  },
  {
    id: 'reimbursable',
    enableSorting: false,
    header: 'Todo',
    cell: ({ row }) => <TodoSwitch transaction={row.original} />,
    size: 60,
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => {
      const id = row.original.transactionId
      return (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-xs" asChild>
            <a
              href={`${import.meta.env.VITE_FIREFLY_URL}/transactions/show/${id}`}
              rel="noopener"
              target="_blank"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      )
    },
    size: 60,
  },
]

type Props = { rows: Array<TransactionRecord> }

function TransactionTable2({ rows }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dialogMode, setDialogMode] = useState<'assign' | 'move' | null>(null)
  const { runBatchAsync, isPending, progress } = useBatchUpdateTags()
  
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (term && !row.description.toLowerCase().includes(term)) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      return true
    })
  }, [rows, search, statusFilter])

  const table = useReactTable({
    data: filteredRows,
    columns,
    getRowId: (row) => String(row.id),
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    autoResetPageIndex: false,
  })

  const existingGroups = useMemo(() => collectGroupNames(rows), [rows])

  const selectedTransactions = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => filteredRows.find((row) => String(row.id) === id))
        .filter((row): row is TransactionRecord => row !== undefined),
    [rowSelection, filteredRows],
  )

  const allSelectedAssigned =
    selectedTransactions.length > 0 &&
    selectedTransactions.every((tx) => tx.status === 'assigned')

  async function applyTransition(transition: TagTransition) {
    await runBatchAsync({ transactions: selectedTransactions, transition })
    setRowSelection({})
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-56 h-8 text-sm"
        />
        <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-colors',
                statusFilter === filter.value
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <span>
            {table.getRowModel().rows.length > 0
              ? `${table.getState().pagination.pageIndex * PAGE_SIZE + 1}-${Math.min((table.getState().pagination.pageIndex + 1) * PAGE_SIZE, table.getFilteredRowModel().rows.length)} of ${table.getFilteredRowModel().rows.length}`
              : '0 results'}
          </span>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {isPending && progress && (
        <p className="text-xs text-muted-foreground tabular-nums">
          Updating… {progress.done}/{progress.total}
        </p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  return (
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
                  )
                })}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTransactions.length > 0 && (
        <div className="border border-border rounded-lg bg-background p-2 shadow-lg flex flex-wrap items-center gap-2 sticky bottom-4">
          <span className="text-xs text-muted-foreground px-1 mr-auto">
            {selectedTransactions.length} selected ·{' '}
            {formatIdr(
              selectedTransactions.reduce((acc, tx) => acc + tx.amount, 0),
            )}
          </span>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => setDialogMode(allSelectedAssigned ? 'move' : 'assign')}
          >
            {allSelectedAssigned ? 'Move to…' : 'New reimbursement…'}
          </Button>
          {allSelectedAssigned && (
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRowSelection({})
              table.resetRowSelection()
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {dialogMode !== null && (
        <GroupPickerDialog
          open
          mode={dialogMode}
          count={selectedTransactions.length}
          existingGroups={existingGroups}
          onOpenChange={(open) => !open && setDialogMode(null)}
          onSubmit={(groupName) => applyTransition({ type: 'assign', groupName })}
        />
      )}
    </div>
  )
}

export default TransactionTable2
