import { useMemo, useState } from 'react'
import {
  flexRender,
  stockFeatures,
  useTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/id'
import {
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react'
import type {
  ColumnDef,
  RowSelectionState,
  SortingState,
  StockFeatures,
} from '@tanstack/react-table'
import type { TransactionRecord } from '@/pages/transaction/model/interface'
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

dayjs.locale('id')
dayjs.extend(LocalizedFormat)

type Props = {
  rows: Array<TransactionRecord>
  selectedIds: Set<number>
  onToggle: (id: number, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
}

const columns: Array<ColumnDef<StockFeatures, TransactionRecord>> = [
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
    id: 'description',
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

function MemberTable({ rows, selectedIds, onToggle, onToggleAll }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ])

  // Sync external selectedIds to rowSelection state
  const rowSelection: RowSelectionState = useMemo(() => {
    const selection: RowSelectionState = {}
    for (const id of selectedIds) {
      const rowIndex = rows.findIndex((r) => r.id === id)
      if (rowIndex !== -1) {
        selection[String(rowIndex)] = true
      }
    }
    return selection
  }, [selectedIds, rows])

  const table = useTable({
    data: rows,
    columns,
    features: stockFeatures,
    getRowId: (row) => String(row.id),
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function'
        ? updater(rowSelection)
        : updater
      // Convert row index selection back to IDs
      const newIds = new Set<number>()
      for (const index of Object.keys(newSelection)) {
        const rowIndex = Number(index)
        if (rowIndex < rows.length) {
          newIds.add(rows[rowIndex].id)
        }
      }
      onToggleAll(false) // Clear all first
      for (const id of newIds) {
        onToggle(id, true)
      }
    },
    enableRowSelection: true,
  })

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border h-24 flex items-center justify-center text-sm text-muted-foreground">
        No transactions here.
      </div>
    )
  }

  return (
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  )
}

export default MemberTable
