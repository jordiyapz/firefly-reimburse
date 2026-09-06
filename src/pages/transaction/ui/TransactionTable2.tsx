import { useCallback, useMemo, useState } from 'react'
import {
  columnOrderingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLink,
} from 'lucide-react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { collectGroupNames, getPeriodName } from '../lib/transaction'
import { useBatchUpdateTags } from '../model/use-batch-update-tags'
import type { TransactionSearch } from '@/routes/transactions'
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'
import type { TagTransition } from '../lib/transaction'
import type { TransactionRecord } from '../model/interface'
import AttachmentIcons from '@/pages/attachment/ui/AttachmentIcons'
import GroupPickerDialog from '@/components/group-picker/GroupPickerDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  columnSizingFeature,
  columnOrderingFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
})

type StatusFilter = 'all' | 'todo' | 'assigned' | 'non-reimbursable'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'non-reimbursable', label: 'Excluded' },
]

const dataColumns: Array<ColumnDef<typeof features, TransactionRecord>> = [
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
      return <span className="text-sm truncate max-w-60 block">{desc}</span>
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
    id: 'files',
    accessorFn: (row) => row.has_attachments,
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium ml-auto"
      >
        Files
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <AttachmentIcons
        journalId={row.original.id}
        hasAttachments={row.original.has_attachments}
      />
    ),
    size: 70,
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

const columnHelper = createColumnHelper<typeof features, TransactionRecord>()
const columns = columnHelper.columns([
  {
    id: 'select',
    enableSorting: false,
    size: 36,
    header: ({ table }) => (
      <input
        type="checkbox"
        className="size-4 accent-primary cursor-pointer"
        checked={table.getIsAllRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="size-4 accent-primary cursor-pointer"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label={`Select ${row.original.description}`}
      />
    ),
  },
  ...dataColumns,
])

type Props = { rows: Array<TransactionRecord> }

function TransactionTable2({ rows }: Props) {
  const [dialogMode, setDialogMode] = useState<'assign' | 'move' | null>(null)
  const { runBatchAsync, isPending, progress } = useBatchUpdateTags()
  const navigate = useNavigate({ from: '/transactions' })
  const {
    q: search,
    status: statusFilter,
    from: dateFrom,
    to: dateTo,
    sort,
    page,
  } = useSearch({ from: '/transactions' })

  const updateSearch = useCallback(
    (patch: Partial<TransactionSearch>) => {
      navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )

  // Parse sort string "field,desc" into SortingState
  const sorting: SortingState = useMemo(() => {
    if (!sort) return [{ id: 'date', desc: true }]
    const [id, direction] = sort.split(',')
    return [{ id: id || 'date', desc: direction !== 'asc' }]
  }, [sort])

  const setSorting = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater
      if (newSorting.length === 0) {
        updateSearch({ sort: '' })
      } else {
        const { id, desc } = newSorting[0]
        updateSearch({ sort: `${id},${desc ? 'desc' : 'asc'}` })
      }
    },
    [sorting, updateSearch],
  )

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: page || 0,
      pageSize: PAGE_SIZE,
    }),
    [page],
  )

  const setPagination = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState),
    ) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater
      updateSearch({ page: newPagination.pageIndex })
    },
    [pagination, updateSearch],
  )

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    const from = dateFrom ? dayjs(dateFrom) : null
    const to = dateTo ? dayjs(dateTo).endOf('day') : null
    return rows.filter((row) => {
      if (term && !row.description.toLowerCase().includes(term)) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (from && row.date.isBefore(from)) return false
      if (to && row.date.isAfter(to)) return false
      return true
    })
  }, [rows, search, statusFilter, dateFrom, dateTo])

  const table = useTable({
    data: filteredRows,
    columns,
    features,
    getRowId: (row) => String(row.id),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    autoResetPageIndex: false,
  })

  const existingGroups = useMemo(() => collectGroupNames(rows), [rows])

  const selectedTransactions = useMemo(
    () =>
      Object.keys(table.state.rowSelection)
        .map((id) => filteredRows.find((row) => row.id === Number(id)))
        .filter((row): row is TransactionRecord => row !== undefined),
    [table.state.rowSelection, filteredRows],
  )

  const allSelectedAssigned =
    selectedTransactions.length > 0 &&
    selectedTransactions.every((tx) => tx.status === 'assigned')

  const excludedSelected = useMemo(
    () => selectedTransactions.filter((tx) => tx.status === 'non-reimbursable'),
    [selectedTransactions],
  )

  async function applyTransition(transition: TagTransition) {
    await runBatchAsync({ transactions: selectedTransactions, transition })
    table.resetRowSelection()
  }

  async function markExcludedReimbursable() {
    // Target only the non-reimbursable rows: mark-todo on an assigned row
    // would strip its reimbursed:* tag (an implicit unassign).
    try {
      await runBatchAsync({
        transactions: excludedSelected,
        transition: { type: 'mark-todo' },
      })
    } catch (error) {
      console.error(error)
    }

    const excludedIds = new Set(excludedSelected.map((x) => x.id))
    table.setRowSelection(
      Object.fromEntries(
        Object.keys(table.state.rowSelection)
          .map(Number)
          .filter((id) => !excludedIds.has(id))
          .map((id) => [id, true]),
      ),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search description…"
          value={search}
          onChange={(e) => updateSearch({ q: e.target.value })}
          className="max-w-56 h-8 text-sm"
        />
        <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => updateSearch({ status: filter.value })}
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
        <div className="flex items-center gap-1 text-xs">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateSearch({ from: e.target.value })}
            className="h-8 px-2 text-sm border border-border rounded-md bg-transparent"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateSearch({ to: e.target.value })}
            className="h-8 px-2 text-sm border border-border rounded-md bg-transparent"
          />
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <span>
            {table.getRowModel().rows.length > 0
              ? `${table.state.pagination.pageIndex * PAGE_SIZE + 1}-${Math.min((table.state.pagination.pageIndex + 1) * PAGE_SIZE, table.getFilteredRowModel().rows.length)} of ${table.getFilteredRowModel().rows.length}`
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
            onClick={() =>
              setDialogMode(allSelectedAssigned ? 'move' : 'assign')
            }
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
          {excludedSelected.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={markExcludedReimbursable}
            >
              Mark reimbursable ({excludedSelected.length})
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
          onSubmit={(groupName) =>
            applyTransition({ type: 'assign', groupName })
          }
        />
      )}
    </div>
  )
}

export default TransactionTable2
